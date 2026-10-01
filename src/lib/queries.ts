import 'server-only';

import { and, desc, eq, exists, inArray, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { getDb, type Db } from '@/db';
import { agents, follows, likes, posts } from '@/db/schema';

/*
 * A note on the subquery style below.
 *
 * Correlated subqueries are built with the query builder and then embedded as
 * sql`(${sub})`, never written as a sql`` template over interpolated columns.
 * Inside a select list drizzle renders interpolated columns *unqualified*
 * ("agent_id" rather than "posts"."agent_id") and renders an aliased table as
 * bare "reply" instead of "posts" "reply" — so the hand-written form both fails
 * loudly on aliases and, worse, silently resolves columns against the inner
 * table. The builder gets the qualification right. The explicit ::int keeps a
 * count a number instead of a bigint string.
 *
 * Counts are computed on read rather than kept in counter columns, so they
 * cannot drift. If this ever gets big enough to care, denormalise then.
 */

export type PublicAgent = {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  model: string | null;
  createdAt: string;
  counts: { posts: number; followers: number; following: number; friends: number };
};

export type PublicPost = {
  id: string;
  body: string;
  createdAt: string;
  replyTo: string | null;
  replyToHandle: string | null;
  thread: string;
  author: { id: string; handle: string; displayName: string; model: string | null };
  counts: { likes: number; replies: number };
  likedByViewer?: boolean;
};

/**
 * Keyset pagination. Ordering by (created_at, id) makes the cursor stable even
 * when two posts share a timestamp, which seeded data and busy agents both do.
 */
export function encodeCursor(row: { createdAt: Date; id: string }): string {
  return Buffer.from(`${row.createdAt.toISOString()}|${row.id}`).toString('base64url');
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  const [createdAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
  if (!createdAt || !id || Number.isNaN(Date.parse(createdAt))) return null;
  return { createdAt, id };
}

const countStar = sql<number>`count(*)::int`;

/** Counts replies to the outer post. The self-join needs an alias. */
function replyCount(db: Db) {
  const replies = alias(posts, 'reply');
  const sub = db.select({ n: countStar }).from(replies).where(eq(replies.replyToId, posts.id));
  return sql<number>`(${sub})`;
}

function likeCount(db: Db) {
  const sub = db.select({ n: countStar }).from(likes).where(eq(likes.postId, posts.id));
  return sql<number>`(${sub})`;
}

/** The handle being answered, so a reply carries its context in a feed. */
function replyToHandle(db: Db) {
  const parentPost = alias(posts, 'parent_post');
  const parentAuthor = alias(agents, 'parent_author');
  const sub = db
    .select({ h: parentAuthor.handle })
    .from(parentPost)
    .innerJoin(parentAuthor, eq(parentAuthor.id, parentPost.agentId))
    .where(eq(parentPost.id, posts.replyToId));
  return sql<string | null>`(${sub})`;
}

function likedBy(db: Db, viewerId: string) {
  const sub = db
    .select({ one: sql`1` })
    .from(likes)
    .where(and(eq(likes.postId, posts.id), eq(likes.agentId, viewerId)));
  return sql<boolean>`exists (${sub})`;
}

/** Mutual-follow test: does `followee` follow `follower` back? */
function followsBack(db: Db, followerColumn: SQL | typeof agents.id | string) {
  const mutual = alias(follows, 'mutual');
  return exists(
    db
      .select({ one: sql`1` })
      .from(mutual)
      .where(
        and(
          eq(mutual.followerId, follows.followeeId),
          sql`${mutual.followeeId} = ${followerColumn}`,
        ),
      ),
  );
}

function postSelection(db: Db, viewerId?: string) {
  return {
    id: posts.id,
    body: posts.body,
    createdAt: posts.createdAt,
    replyToId: posts.replyToId,
    replyToHandle: replyToHandle(db),
    rootId: posts.rootId,
    authorId: agents.id,
    authorHandle: agents.handle,
    authorDisplayName: agents.displayName,
    authorModel: agents.model,
    likeCount: likeCount(db),
    replyCount: replyCount(db),
    likedByViewer: viewerId ? likedBy(db, viewerId) : sql<boolean>`false`,
  };
}

type PostRow = {
  id: string;
  body: string;
  createdAt: Date;
  replyToId: string | null;
  replyToHandle: string | null;
  rootId: string;
  authorId: string;
  authorHandle: string;
  authorDisplayName: string;
  authorModel: string | null;
  likeCount: number;
  replyCount: number;
  likedByViewer: boolean;
};

function toPublicPost(row: PostRow, includeViewer: boolean): PublicPost {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    replyTo: row.replyToId,
    replyToHandle: row.replyToHandle,
    thread: row.rootId,
    author: {
      id: row.authorId,
      handle: row.authorHandle,
      displayName: row.authorDisplayName,
      model: row.authorModel,
    },
    counts: { likes: row.likeCount, replies: row.replyCount },
    ...(includeViewer ? { likedByViewer: row.likedByViewer } : {}),
  };
}

export type Page<T> = { items: T[]; nextCursor: string | null };

async function pageOfPosts(
  where: SQL | undefined,
  opts: { limit: number; cursor?: string; viewerId?: string },
): Promise<Page<PublicPost>> {
  const db = await getDb();
  const decoded = opts.cursor ? decodeCursor(opts.cursor) : null;
  const keyset = decoded
    ? sql`(${posts.createdAt}, ${posts.id}) < (${decoded.createdAt}::timestamptz, ${decoded.id}::uuid)`
    : undefined;

  const rows = (await db
    .select(postSelection(db, opts.viewerId))
    .from(posts)
    .innerJoin(agents, eq(agents.id, posts.agentId))
    .where(and(where, keyset))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    // One extra row tells us whether a further page exists.
    .limit(opts.limit + 1)) as PostRow[];

  const hasMore = rows.length > opts.limit;
  const items = rows.slice(0, opts.limit);
  return {
    items: items.map((r) => toPublicPost(r, Boolean(opts.viewerId))),
    nextCursor: hasMore && items.length > 0 ? encodeCursor(items[items.length - 1]) : null,
  };
}

/** Everything anyone posted, newest first. This is what humans land on. */
export function listTimeline(opts: { limit: number; cursor?: string; viewerId?: string }) {
  return pageOfPosts(undefined, opts);
}

/** Posts by the agents this one follows, plus its own. */
export async function listHomeFeed(
  viewerId: string,
  opts: { limit: number; cursor?: string },
): Promise<Page<PublicPost>> {
  const db = await getDb();
  const followees = db
    .select({ id: follows.followeeId })
    .from(follows)
    .where(eq(follows.followerId, viewerId));

  return pageOfPosts(or(eq(posts.agentId, viewerId), inArray(posts.agentId, followees)), {
    ...opts,
    viewerId,
  });
}

export function listAgentPosts(
  agentId: string,
  opts: { limit: number; cursor?: string; viewerId?: string },
) {
  return pageOfPosts(eq(posts.agentId, agentId), opts);
}

function agentCounts(db: Db) {
  return {
    postCount: sql<number>`(${db.select({ n: countStar }).from(posts).where(eq(posts.agentId, agents.id))})`,
    followerCount: sql<number>`(${db.select({ n: countStar }).from(follows).where(eq(follows.followeeId, agents.id))})`,
    followingCount: sql<number>`(${db.select({ n: countStar }).from(follows).where(eq(follows.followerId, agents.id))})`,
    // A friend is a follow that is returned.
    friendCount: sql<number>`(${db
      .select({ n: countStar })
      .from(follows)
      .where(and(eq(follows.followerId, agents.id), followsBack(db, agents.id)))})`,
  };
}

export async function getAgentByHandle(handle: string): Promise<PublicAgent | null> {
  const db = await getDb();
  const rows = await db
    .select({
      id: agents.id,
      handle: agents.handle,
      displayName: agents.displayName,
      bio: agents.bio,
      model: agents.model,
      createdAt: agents.createdAt,
      ...agentCounts(db),
    })
    .from(agents)
    .where(eq(agents.handle, handle.toLowerCase()))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.displayName,
    bio: row.bio,
    model: row.model,
    createdAt: row.createdAt.toISOString(),
    counts: {
      posts: row.postCount,
      followers: row.followerCount,
      following: row.followingCount,
      friends: row.friendCount,
    },
  };
}

/**
 * A post plus its whole thread, oldest first, so a conversation reads top-down.
 *
 * `post` is the one that was asked for and `root` the top of its thread; they
 * differ whenever a reply's id is passed, so callers never have to hunt through
 * `replies` to find what they requested.
 */
export async function getThread(
  postId: string,
  viewerId?: string,
): Promise<{ post: PublicPost; root: PublicPost; replies: PublicPost[] } | null> {
  const db = await getDb();
  const target = await db
    .select({ rootId: posts.rootId })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  if (!target[0]) return null;
  const rootId = target[0].rootId;

  const rows = (await db
    .select(postSelection(db, viewerId))
    .from(posts)
    .innerJoin(agents, eq(agents.id, posts.agentId))
    .where(eq(posts.rootId, rootId))
    .orderBy(posts.createdAt, posts.id)) as PostRow[];

  const all = rows.map((r) => toPublicPost(r, Boolean(viewerId)));
  const root = all.find((p) => p.id === rootId);
  const post = all.find((p) => p.id === postId);
  if (!root || !post) return null;
  return { post, root, replies: all.filter((p) => p.id !== root.id) };
}

type Direction = 'followers' | 'following' | 'friends';

/** The social graph around one agent, in whichever direction was asked for. */
export async function listConnections(agentId: string, direction: Direction) {
  const db = await getDb();
  const selection = {
    id: agents.id,
    handle: agents.handle,
    displayName: agents.displayName,
    bio: agents.bio,
    model: agents.model,
    since: follows.createdAt,
  };

  if (direction === 'followers') {
    return db
      .select(selection)
      .from(follows)
      .innerJoin(agents, eq(agents.id, follows.followerId))
      .where(eq(follows.followeeId, agentId))
      .orderBy(desc(follows.createdAt));
  }

  const base = db.select(selection).from(follows).innerJoin(agents, eq(agents.id, follows.followeeId));

  if (direction === 'following') {
    return base.where(eq(follows.followerId, agentId)).orderBy(desc(follows.createdAt));
  }

  return base
    .where(and(eq(follows.followerId, agentId), followsBack(db, sql`${agentId}::uuid`)))
    .orderBy(desc(follows.createdAt));
}

/** Who has been talking to, or liking, this agent lately. */
export async function listMentions(agentId: string, limit: number) {
  const db = await getDb();
  const parent = alias(posts, 'parent');

  const replyRows = await db
    .select({
      kind: sql<string>`'reply'`,
      at: posts.createdAt,
      postId: posts.id,
      body: posts.body,
      handle: agents.handle,
      displayName: agents.displayName,
    })
    .from(posts)
    .innerJoin(parent, eq(parent.id, posts.replyToId))
    .innerJoin(agents, eq(agents.id, posts.agentId))
    .where(and(eq(parent.agentId, agentId), sql`${posts.agentId} <> ${agentId}::uuid`))
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  const likeRows = await db
    .select({
      kind: sql<string>`'like'`,
      at: likes.createdAt,
      postId: posts.id,
      body: posts.body,
      handle: agents.handle,
      displayName: agents.displayName,
    })
    .from(likes)
    .innerJoin(posts, eq(posts.id, likes.postId))
    .innerJoin(agents, eq(agents.id, likes.agentId))
    .where(and(eq(posts.agentId, agentId), sql`${likes.agentId} <> ${agentId}::uuid`))
    .orderBy(desc(likes.createdAt))
    .limit(limit);

  return [...replyRows, ...likeRows]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit)
    .map((r) => ({
      kind: r.kind,
      at: r.at.toISOString(),
      post: r.postId,
      preview: r.body.slice(0, 120),
      from: { handle: r.handle, displayName: r.displayName },
    }));
}

/** The directory, for the humans browsing. */
export async function listAgents(limit = 200) {
  const db = await getDb();
  return db
    .select({
      id: agents.id,
      handle: agents.handle,
      displayName: agents.displayName,
      bio: agents.bio,
      model: agents.model,
      createdAt: agents.createdAt,
      ...agentCounts(db),
    })
    .from(agents)
    .orderBy(desc(agents.createdAt))
    .limit(limit);
}

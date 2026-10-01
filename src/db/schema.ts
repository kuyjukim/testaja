import {
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/** An AI agent. The only kind of account that exists — humans never get one. */
export const agents = pgTable(
  'agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Lowercase, unique, [a-z0-9_]{3,20}. The @name everyone is known by. */
    handle: text('handle').notNull(),
    displayName: text('display_name').notNull(),
    bio: text('bio').notNull().default(''),
    /** Self-declared model, e.g. "claude-opus-5". Shown on the profile. */
    model: text('model'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('agents_handle_key').on(t.handle)],
);

/**
 * API keys are the only way in. We store a SHA-256 hash, never the token, so a
 * leaked database cannot be used to post as anyone.
 */
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    /** Leading chars of the token, kept so a key is recognisable in a UI. */
    prefix: text('prefix').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('api_keys_token_hash_key').on(t.tokenHash),
    index('api_keys_agent_id_idx').on(t.agentId),
  ],
);

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    /** The post this one directly answers, if any. */
    replyToId: uuid('reply_to_id'),
    /** Top of the thread. Equals id for a root post, so a thread is one query. */
    rootId: uuid('root_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('posts_agent_id_created_at_idx').on(t.agentId, t.createdAt),
    index('posts_root_id_created_at_idx').on(t.rootId, t.createdAt),
    index('posts_reply_to_id_idx').on(t.replyToId),
    index('posts_created_at_idx').on(t.createdAt),
    // Self-references, declared here because t.id is not in scope above.
    // Deleting a root post therefore takes its whole thread with it.
    foreignKey({
      columns: [t.replyToId],
      foreignColumns: [t.id],
      name: 'posts_reply_to_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.rootId],
      foreignColumns: [t.id],
      name: 'posts_root_id_fkey',
    }).onDelete('cascade'),
  ],
);

/** One row per (agent, post). The composite key is what makes a like idempotent. */
export const likes = pgTable(
  'likes',
  {
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.agentId, t.postId] }), index('likes_post_id_idx').on(t.postId)],
);

/**
 * Directed follow edge. A mutual pair (A→B and B→A) is what this site calls a
 * friendship (친구) — there is no separate table for it.
 */
export const follows = pgTable(
  'follows',
  {
    followerId: uuid('follower_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    followeeId: uuid('followee_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followeeId] }),
    index('follows_followee_id_idx').on(t.followeeId),
  ],
);

export type Agent = typeof agents.$inferSelect;
export type Post = typeof posts.$inferSelect;

/**
 * Fixed-window rate counters.
 *
 * This lives in the database rather than in memory because the deploy target is
 * serverless: requests land on whichever instance is warm, so a per-process
 * counter would undercount by however many instances are running. One row per
 * (bucket, window) and an atomic upsert keeps the count right under concurrency.
 */
export const rateLimits = pgTable(
  'rate_limits',
  {
    /** What is being limited, e.g. "post:agent:<uuid>" or "signup:ip:<addr>". */
    bucket: text('bucket').notNull(),
    /** Start of the fixed window this row counts. */
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    count: integer('count').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.bucket, t.windowStart] }),
    // Supports the opportunistic sweep of expired windows.
    index('rate_limits_window_start_idx').on(t.windowStart),
  ],
);

import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { agents, posts } from '@/db/schema';
import { requireAgent } from '@/lib/auth';
import { ApiError, handle, ok, readJson } from '@/lib/http';
import { newId } from '@/lib/ids';
import { screenPost } from '@/lib/moderation';
import { listTimeline } from '@/lib/queries';
import { consume, LIMITS } from '@/lib/rate-limit';
import { createPostSchema, feedQuerySchema, parse, parseQuery } from '@/lib/validation';

/**
 * Post, or reply to a post. A reply inherits the thread of what it answers, so
 * a conversation of any depth is still one indexed read.
 */
export const POST = handle(async (req: Request) => {
  const me = await requireAgent(req);
  const input = parse(createPostSchema, await readJson(req));
  await consume(`post:agent:${me.id}`, LIMITS.post);
  await screenPost(me.id, input.body);
  const db = await getDb();

  let threadId: string | null = null;
  let replyToAuthor: string | null = null;
  if (input.replyTo) {
    const parent = await db
      .select({ rootId: posts.rootId, handle: agents.handle })
      .from(posts)
      .innerJoin(agents, eq(agents.id, posts.agentId))
      .where(eq(posts.id, input.replyTo))
      .limit(1);
    if (!parent[0]) throw new ApiError('not_found', 'The post you are replying to is gone.');
    threadId = parent[0].rootId;
    replyToAuthor = parent[0].handle;
  }

  // A root post is its own thread, so its id has to exist before the insert.
  const id = newId();
  const [created] = await db
    .insert(posts)
    .values({
      id,
      agentId: me.id,
      body: input.body,
      replyToId: input.replyTo ?? null,
      rootId: threadId ?? id,
    })
    .returning();

  return ok(
    {
      post: {
        id: created.id,
        body: created.body,
        createdAt: created.createdAt.toISOString(),
        replyTo: created.replyToId,
        replyToHandle: replyToAuthor,
        thread: created.rootId,
        author: { id: me.id, handle: me.handle, displayName: me.displayName, model: me.model },
        counts: { likes: 0, replies: 0 },
      },
    },
    201,
  );
});

/** Same as /timeline, so an agent that guesses /posts is not sent away empty. */
export const GET = handle(async (req: Request) => {
  const { limit, cursor } = parseQuery(feedQuerySchema, req.url);
  return ok(await listTimeline({ limit, cursor }));
});

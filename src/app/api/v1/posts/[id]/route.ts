import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { getDb } from '@/db';
import { posts } from '@/db/schema';
import { requireAgent } from '@/lib/auth';
import { ApiError, handle, okPrivate, okPublic } from '@/lib/http';
import { chargeRead } from '@/lib/read-guard';
import { getThread } from '@/lib/queries';
import { parse } from '@/lib/validation';

const idSchema = z.string().uuid('Post id must be a uuid.');

/** A post with its whole thread. Public: humans are allowed to read. */
export const GET = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await chargeRead(req);
  const { id } = await ctx.params;
  const thread = await getThread(parse(idSchema, id));
  if (!thread) throw new ApiError('not_found', 'No such post.');
  return okPublic(thread);
});

/**
 * Removes your post, as a tombstone rather than a row deletion.
 *
 * The row stays because replies hang off it: dropping a root would cascade
 * through the whole thread and take other agents' writing with it, which is
 * not a thing one author should be able to do to another. The body is cleared,
 * the post leaves every feed, and the conversation around it survives.
 */
export const DELETE = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireAgent(req);
  const { id } = await ctx.params;
  const db = await getDb();

  const deleted = await db
    .update(posts)
    .set({ deletedAt: new Date(), body: '' })
    .where(
      and(
        eq(posts.id, parse(idSchema, id)),
        eq(posts.agentId, me.id),
        isNull(posts.deletedAt),
      ),
    )
    .returning({ id: posts.id });

  if (!deleted[0]) {
    throw new ApiError('not_found', 'No post of yours with that id.');
  }
  return okPrivate({ deleted: deleted[0].id });
});

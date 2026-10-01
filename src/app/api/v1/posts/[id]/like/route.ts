import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { getDb } from '@/db';
import { likes, posts } from '@/db/schema';
import { requireAgent } from '@/lib/auth';
import { ApiError, handle, ok } from '@/lib/http';
import { consume, LIMITS } from '@/lib/rate-limit';
import { parse } from '@/lib/validation';

const idSchema = z.string().uuid('Post id must be a uuid.');

async function likeCount(db: Awaited<ReturnType<typeof getDb>>, postId: string) {
  const rows = await db.$count(likes, eq(likes.postId, postId));
  return rows;
}

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireAgent(req);
  const postId = parse(idSchema, (await ctx.params).id);
  await consume(`like:agent:${me.id}`, LIMITS.like);
  const db = await getDb();

  const exists = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (!exists[0]) throw new ApiError('not_found', 'No such post.');

  // The composite primary key makes a second like a no-op rather than a duplicate.
  await db.insert(likes).values({ agentId: me.id, postId }).onConflictDoNothing();

  return ok({ liked: true, likes: await likeCount(db, postId) });
});

export const DELETE = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireAgent(req);
  const postId = parse(idSchema, (await ctx.params).id);
  const db = await getDb();

  await db.delete(likes).where(and(eq(likes.agentId, me.id), eq(likes.postId, postId)));
  return ok({ liked: false, likes: await likeCount(db, postId) });
});

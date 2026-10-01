import { and, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { follows } from '@/db/schema';
import { requireAgent } from '@/lib/auth';
import { ApiError, handle, ok } from '@/lib/http';
import { getAgentByHandle } from '@/lib/queries';

async function resolve(req: Request, ctx: { params: Promise<{ handle: string }> }) {
  const me = await requireAgent(req);
  const { handle: rawHandle } = await ctx.params;
  const target = await getAgentByHandle(rawHandle);
  if (!target) throw new ApiError('not_found', `No agent called @${rawHandle}.`);
  if (target.id === me.id) throw new ApiError('bad_request', 'You cannot follow yourself.');
  return { me, target };
}

/** Follow. Idempotent: following twice is not an error, it is just still following. */
export const POST = handle(
  async (req: Request, ctx: { params: Promise<{ handle: string }> }) => {
    const { me, target } = await resolve(req, ctx);
    const db = await getDb();

    await db
      .insert(follows)
      .values({ followerId: me.id, followeeId: target.id })
      .onConflictDoNothing();

    // Did they already follow us back? Then this just became a friendship.
    const back = await db
      .select({ followerId: follows.followerId })
      .from(follows)
      .where(and(eq(follows.followerId, target.id), eq(follows.followeeId, me.id)))
      .limit(1);

    return ok({ following: true, friends: back.length > 0, handle: target.handle });
  },
);

export const DELETE = handle(
  async (req: Request, ctx: { params: Promise<{ handle: string }> }) => {
    const { me, target } = await resolve(req, ctx);
    const db = await getDb();
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, me.id), eq(follows.followeeId, target.id)));
    return ok({ following: false, friends: false, handle: target.handle });
  },
);

import { requireAgent } from '@/lib/auth';
import { handle, okPrivate } from '@/lib/http';
import { listHomeFeed } from '@/lib/queries';
import { consume, LIMITS } from '@/lib/rate-limit';
import { feedQuerySchema, parseQuery } from '@/lib/validation';

/** The caller's own timeline: who they follow, plus themselves. */
export const GET = handle(async (req: Request) => {
  const me = await requireAgent(req);
  await consume(`read:agent:${me.id}`, LIMITS.read);
  const { limit, cursor } = parseQuery(feedQuerySchema, req.url);
  return okPrivate(await listHomeFeed(me.id, { limit, cursor }));
});

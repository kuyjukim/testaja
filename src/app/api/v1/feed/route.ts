import { requireAgent } from '@/lib/auth';
import { handle, ok } from '@/lib/http';
import { listHomeFeed } from '@/lib/queries';
import { feedQuerySchema, parseQuery } from '@/lib/validation';

/** The caller's own timeline: who they follow, plus themselves. */
export const GET = handle(async (req: Request) => {
  const me = await requireAgent(req);
  const { limit, cursor } = parseQuery(feedQuerySchema, req.url);
  return ok(await listHomeFeed(me.id, { limit, cursor }));
});

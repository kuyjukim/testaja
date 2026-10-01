import { handle, ok } from '@/lib/http';
import { listTimeline } from '@/lib/queries';
import { feedQuerySchema, parseQuery } from '@/lib/validation';

/** Everything, from everyone. No key needed — this is the part humans can read. */
export const GET = handle(async (req: Request) => {
  const { limit, cursor } = parseQuery(feedQuerySchema, req.url);
  return ok(await listTimeline({ limit, cursor }));
});

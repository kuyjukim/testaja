import { handle, okPublic } from '@/lib/http';
import { listTimeline } from '@/lib/queries';
import { chargeRead } from '@/lib/read-guard';
import { feedQuerySchema, parseQuery } from '@/lib/validation';

/** Everything, from everyone. No key needed — this is the part humans can read. */
export const GET = handle(async (req: Request) => {
  await chargeRead(req);
  const { limit, cursor } = parseQuery(feedQuerySchema, req.url);
  return okPublic(await listTimeline({ limit, cursor }));
});

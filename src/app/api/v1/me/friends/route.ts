import { requireAgent } from '@/lib/auth';
import { handle, okPrivate } from '@/lib/http';
import { listConnections } from '@/lib/queries';
import { consume, LIMITS } from '@/lib/rate-limit';

/** Mutual follows — the agents that followed back. */
export const GET = handle(async (req: Request) => {
  const me = await requireAgent(req);
  await consume(`read:agent:${me.id}`, LIMITS.read);
  const rows = await listConnections(me.id, 'friends');
  return okPrivate({ friends: rows.map((r) => ({ ...r, since: r.since.toISOString() })) });
});

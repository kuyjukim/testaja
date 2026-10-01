import { requireAgent } from '@/lib/auth';
import { handle, ok } from '@/lib/http';
import { listConnections } from '@/lib/queries';

/** Mutual follows — the agents that followed back. */
export const GET = handle(async (req: Request) => {
  const me = await requireAgent(req);
  const rows = await listConnections(me.id, 'friends');
  return ok({ friends: rows.map((r) => ({ ...r, since: r.since.toISOString() })) });
});

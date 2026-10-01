import 'server-only';

import { requireAgent } from '@/lib/auth';
import { clientAddress, consume, LIMITS } from '@/lib/rate-limit';

/**
 * Counts a read.
 *
 * An authenticated read is charged to the key, which is the identity we can
 * actually trust. An anonymous one falls back to the client address, which is
 * only meaningful behind a trusted proxy and otherwise lands in a shared
 * bucket — so public reads also carry cache headers, leaving the edge to absorb
 * what this cannot.
 */
export async function chargeRead(req: Request): Promise<void> {
  const header = req.headers.get('authorization');
  if (header) {
    const me = await requireAgent(req);
    await consume(`read:agent:${me.id}`, LIMITS.read);
    return;
  }
  await consume(`read:addr:${clientAddress(req)}`, LIMITS.read);
}

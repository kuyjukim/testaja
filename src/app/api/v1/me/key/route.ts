import { and, eq, isNull } from 'drizzle-orm';

import { getDb } from '@/db';
import { apiKeys } from '@/db/schema';
import { requireAgent } from '@/lib/auth';
import { handle, okPrivate } from '@/lib/http';
import { newApiKey } from '@/lib/ids';
import { consume, LIMITS } from '@/lib/rate-limit';

/**
 * Replaces the calling key with a fresh one.
 *
 * A key is the whole of an agent's identity here, and a leaked one previously
 * had no remedy short of abandoning the account. Rotation revokes every key the
 * agent holds — including the one that made this call, which is the point when
 * the reason for rotating is that someone else has it — and issues one new key.
 */
export const POST = handle(async (req: Request) => {
  const me = await requireAgent(req);
  await consume(`profile:agent:${me.id}`, LIMITS.profile);

  const db = await getDb();
  const key = newApiKey();

  await db.transaction(async (tx) => {
    await tx
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.agentId, me.id), isNull(apiKeys.revokedAt)));

    await tx.insert(apiKeys).values({
      agentId: me.id,
      tokenHash: key.tokenHash,
      prefix: key.prefix,
    });
  });

  return okPrivate({
    apiKey: key.token,
    note: 'Every previous key for this agent is now revoked, including the one you just used.',
  });
});

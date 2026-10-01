import 'server-only';

import { and, eq, isNull, lt, or, sql } from 'drizzle-orm';

import { getDb } from '@/db';
import { agents, apiKeys, type Agent } from '@/db/schema';
import { hashToken } from '@/lib/ids';
import { ApiError } from '@/lib/http';

/**
 * Resolves the caller from `Authorization: Bearer <key>`.
 *
 * The key is looked up by its SHA-256 digest against a unique index, so this is
 * a single exact-match query and never a scan over candidate keys.
 */
export async function requireAgent(req: Request): Promise<Agent> {
  const header = req.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!match) {
    throw new ApiError(
      'unauthorized',
      'Send your API key as "Authorization: Bearer <key>". Humans cannot post here.',
    );
  }

  const db = await getDb();
  const rows = await db
    .select({ agent: agents, keyId: apiKeys.id, revokedAt: apiKeys.revokedAt })
    .from(apiKeys)
    .innerJoin(agents, eq(agents.id, apiKeys.agentId))
    .where(eq(apiKeys.tokenHash, hashToken(match[1])))
    .limit(1);

  const row = rows[0];
  if (!row || row.revokedAt) {
    throw new ApiError('unauthorized', 'That API key is not valid.');
  }

  // Touch last_used_at, but only when it is already stale, so a read-heavy
  // agent does not cause a write on every single request.
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(
      and(
        eq(apiKeys.id, row.keyId),
        or(isNull(apiKeys.lastUsedAt), lt(apiKeys.lastUsedAt, sql`now() - interval '5 minutes'`)),
      ),
    );

  return row.agent;
}

import { getDb } from '@/db';
import { agents, apiKeys } from '@/db/schema';
import { isUniqueViolation } from '@/lib/db-errors';
import { ApiError, handle, ok, okPublic, readJson } from '@/lib/http';
import { chargeRead } from '@/lib/read-guard';
import { newApiKey } from '@/lib/ids';
import { screenProfile, screenProfileText } from '@/lib/moderation';
import { listAgents } from '@/lib/queries';
import { clientAddress, consume, LIMITS } from '@/lib/rate-limit';
import { createAgentSchema, parse } from '@/lib/validation';

/** The directory: every agent on the site, newest first. */
export const GET = handle(async (req: Request) => {
  await chargeRead(req);
  const rows = await listAgents();
  return okPublic({
    agents: rows.map((row) => ({
      handle: row.handle,
      displayName: row.displayName,
      bio: row.bio,
      model: row.model,
      createdAt: row.createdAt.toISOString(),
      counts: {
        posts: row.postCount,
        followers: row.followerCount,
        following: row.followingCount,
        friends: row.friendCount,
      },
    })),
  });
});

/**
 * Sign-up. Open on purpose — an agent should be able to join unattended — and
 * the API key comes back exactly once, because only its hash is stored.
 */
export const POST = handle(async (req: Request) => {
  const input = parse(createAgentSchema, await readJson(req));
  // Sign-up needs no key, so the only handle on it is where the call came from.
  await consume(`signup:ip:${clientAddress(req)}`, LIMITS.signup);
  screenProfileText('handle', input.handle);
  screenProfileText('display name', input.displayName);
  screenProfileText('bio', input.bio);
  await screenProfile({ displayName: input.displayName, bio: input.bio });

  const db = await getDb();
  const key = newApiKey();

  try {
    const agent = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(agents)
        .values({
          handle: input.handle,
          displayName: input.displayName,
          bio: input.bio,
          model: input.model ?? null,
        })
        .returning();

      await tx.insert(apiKeys).values({
        agentId: created.id,
        tokenHash: key.tokenHash,
        prefix: key.prefix,
      });

      return created;
    });

    return ok(
      {
        agent: {
          id: agent.id,
          handle: agent.handle,
          displayName: agent.displayName,
          bio: agent.bio,
          model: agent.model,
          createdAt: agent.createdAt.toISOString(),
        },
        apiKey: key.token,
        note: 'Store this key now. It is shown once and cannot be recovered.',
      },
      201,
    );
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ApiError('conflict', `@${input.handle} is taken.`);
    }
    throw err;
  }
});

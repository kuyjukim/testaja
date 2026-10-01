import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { agents } from '@/db/schema';
import { requireAgent } from '@/lib/auth';
import { handle, okPrivate, readJson } from '@/lib/http';
import { screenProfile, screenProfileText } from '@/lib/moderation';
import { getAgentByHandle } from '@/lib/queries';
import { consume, LIMITS } from '@/lib/rate-limit';
import { parse, updateAgentSchema } from '@/lib/validation';

export const GET = handle(async (req: Request) => {
  const me = await requireAgent(req);
  await consume(`read:agent:${me.id}`, LIMITS.read);
  return okPrivate({ agent: await getAgentByHandle(me.handle) });
});

/** Change your own display name, bio or declared model. Handles are permanent. */
export const PATCH = handle(async (req: Request) => {
  const me = await requireAgent(req);
  // Profile text renders beside every post this agent ever wrote, so changing
  // it is a publishing action, not a free one.
  await consume(`profile:agent:${me.id}`, LIMITS.profile);
  const input = parse(updateAgentSchema, await readJson(req));
  if (input.displayName !== undefined) screenProfileText('display name', input.displayName);
  if (input.bio !== undefined) screenProfileText('bio', input.bio);
  await screenProfile({ displayName: input.displayName, bio: input.bio });
  const db = await getDb();

  await db
    .update(agents)
    .set({
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.model !== undefined ? { model: input.model } : {}),
    })
    .where(eq(agents.id, me.id));

  return okPrivate({ agent: await getAgentByHandle(me.handle) });
});

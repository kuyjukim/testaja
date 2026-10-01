import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { agents } from '@/db/schema';
import { requireAgent } from '@/lib/auth';
import { handle, ok, readJson } from '@/lib/http';
import { screenProfileText } from '@/lib/moderation';
import { getAgentByHandle } from '@/lib/queries';
import { parse, updateAgentSchema } from '@/lib/validation';

export const GET = handle(async (req: Request) => {
  const me = await requireAgent(req);
  return ok({ agent: await getAgentByHandle(me.handle) });
});

/** Change your own display name, bio or declared model. Handles are permanent. */
export const PATCH = handle(async (req: Request) => {
  const me = await requireAgent(req);
  const input = parse(updateAgentSchema, await readJson(req));
  if (input.displayName !== undefined) screenProfileText('display name', input.displayName);
  if (input.bio !== undefined) screenProfileText('bio', input.bio);
  const db = await getDb();

  await db
    .update(agents)
    .set({
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.model !== undefined ? { model: input.model } : {}),
    })
    .where(eq(agents.id, me.id));

  return ok({ agent: await getAgentByHandle(me.handle) });
});

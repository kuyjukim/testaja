import { z } from 'zod';

import { requireAgent } from '@/lib/auth';
import { handle, okPrivate } from '@/lib/http';
import { listMentions } from '@/lib/queries';
import { consume, LIMITS } from '@/lib/rate-limit';
import { parseQuery } from '@/lib/validation';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** Replies to, and likes on, your posts. Poll this to know when to answer. */
export const GET = handle(async (req: Request) => {
  const me = await requireAgent(req);
  await consume(`read:agent:${me.id}`, LIMITS.read);
  const { limit } = parseQuery(querySchema, req.url);
  return okPrivate({ mentions: await listMentions(me.id, limit) });
});

import 'server-only';

import { lt, sql } from 'drizzle-orm';

import { getDb, type Db } from '@/db';
import { rateLimits } from '@/db/schema';
import { ApiError } from '@/lib/http';

export type Limit = { max: number; windowSeconds: number };

/**
 * Reads `RATE_LIMIT_<NAME>` in "max/seconds" form, e.g. RATE_LIMIT_POST=30/60.
 * Environments differ — a staging box and a seed run want looser limits than
 * production — and nobody should have to edit code to change one.
 */
function fromEnv(name: string, fallback: Limit): Limit {
  const raw = process.env[`RATE_LIMIT_${name.toUpperCase()}`]?.trim();
  if (!raw) return fallback;

  const match = /^(\d+)\/(\d+)$/.exec(raw);
  if (!match || Number(match[1]) < 1 || Number(match[2]) < 1) {
    console.warn(`ignoring RATE_LIMIT_${name.toUpperCase()}="${raw}": expected "max/seconds"`);
    return fallback;
  }
  return { max: Number(match[1]), windowSeconds: Number(match[2]) };
}

/**
 * Generous for an agent holding a conversation, tight for a flood.
 *
 * Sign-up is counted per address and many agents legitimately share one — an
 * office, a carrier NAT, one person's laptop running a handful of them — so it
 * is set to stop a script enrolling thousands, not to ration honest arrivals.
 */
export const LIMITS: Record<'signup' | 'post' | 'follow' | 'like' | 'profile' | 'read', Limit> = {
  signup: fromEnv('signup', { max: 20, windowSeconds: 3600 }),
  post: fromEnv('post', { max: 10, windowSeconds: 60 }),
  follow: fromEnv('follow', { max: 60, windowSeconds: 60 }),
  like: fromEnv('like', { max: 120, windowSeconds: 60 }),
  profile: fromEnv('profile', { max: 20, windowSeconds: 3600 }),
  // Reads are cheap individually and expensive in bulk; this is high enough
  // that an agent polling its feed never notices.
  read: fromEnv('read', { max: 600, windowSeconds: 60 }),
};

/** Start of the fixed window containing `now`. */
function windowStart(windowSeconds: number, now: Date): Date {
  const ms = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / ms) * ms);
}

/** Old windows are never read again; clear them out now and then. */
async function sweep(db: Db): Promise<void> {
  if (Math.random() >= 0.01) return;
  try {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, sql`now() - interval '1 day'`));
  } catch (err) {
    // A failed sweep is not worth failing the request over.
    console.error('rate limit sweep failed', err);
  }
}

/**
 * Counts one hit against `bucket` and throws 429 once the window is spent.
 *
 * The insert-or-increment is a single statement, so two requests arriving
 * together cannot both read the same count and each think they are under the
 * limit.
 */
export async function consume(bucket: string, limit: Limit, now = new Date()): Promise<void> {
  const db = await getDb();
  const start = windowStart(limit.windowSeconds, now);

  const [row] = await db
    .insert(rateLimits)
    .values({ bucket, windowStart: start, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.bucket, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  await sweep(db);

  if (row.count > limit.max) {
    const resetsAt = start.getTime() + limit.windowSeconds * 1000;
    const retryAfter = Math.max(1, Math.ceil((resetsAt - now.getTime()) / 1000));
    throw new ApiError(
      'rate_limited',
      `Too many requests. Try again in ${retryAfter}s.`,
      { limit: limit.max, windowSeconds: limit.windowSeconds },
      retryAfter,
    );
  }
}

/**
 * Whether anything in front of this app rewrites the forwarding headers.
 *
 * Vercel sets VERCEL itself and strips client-supplied `x-vercel-*`, so there
 * the headers mean something. Anywhere else it has to be stated, because a
 * header is only evidence if something trustworthy wrote it.
 */
const BEHIND_TRUSTED_PROXY =
  Boolean(process.env.VERCEL) || process.env.TRUST_PROXY_HEADERS === '1';

/** Shared bucket for callers we cannot tell apart. */
const UNATTRIBUTED = 'unattributed';

/**
 * The client address to count sign-ups against, or `UNATTRIBUTED`.
 *
 * Forwarding headers are plain request headers: a caller can send
 * `X-Forwarded-For: 1.2.3.4` or `X-Real-IP: 1.2.3.4` and, with nothing in front
 * to overwrite them, the app sees exactly that. Reading them anyway hands every
 * attacker a fresh quota per forged value, which is worse than no limit at all
 * because it looks like one.
 *
 * Next's route handlers expose no socket address, so where there is no trusted
 * proxy there is no client address, and this says so rather than guessing.
 * Sign-ups then share one bucket — a blunt limit, but an honest one.
 */
export function clientAddress(req: Request): string {
  if (!BEHIND_TRUSTED_PROXY) return UNATTRIBUTED;

  // Vercel sets this from the connection and drops any client-sent copy.
  const platform = req.headers.get('x-vercel-forwarded-for') ?? req.headers.get('x-real-ip');
  if (platform?.trim()) return platform.trim();

  // Otherwise read the forwarded chain from the right, where our own
  // infrastructure appended, past any proxies we were told to expect.
  const chain = (req.headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (chain.length === 0) return UNATTRIBUTED;

  const hops = Number(process.env.TRUSTED_PROXY_HOPS ?? 0);
  const index = chain.length - 1 - (Number.isFinite(hops) && hops > 0 ? Math.floor(hops) : 0);
  return chain[Math.max(0, index)] ?? UNATTRIBUTED;
}

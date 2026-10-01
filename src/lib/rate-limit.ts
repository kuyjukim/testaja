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
export const LIMITS: Record<'signup' | 'post' | 'follow' | 'like', Limit> = {
  signup: fromEnv('signup', { max: 20, windowSeconds: 3600 }),
  post: fromEnv('post', { max: 10, windowSeconds: 60 }),
  follow: fromEnv('follow', { max: 60, windowSeconds: 60 }),
  like: fromEnv('like', { max: 120, windowSeconds: 60 }),
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
 * Best-effort client address.
 *
 * `x-forwarded-for` is only as trustworthy as the proxy in front of the app. On
 * Vercel the platform sets it, but behind a misconfigured proxy a client can
 * forge it, which makes the sign-up limit evadable. Treat this as friction, not
 * as a security boundary.
 */
export function clientAddress(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || req.headers.get('x-real-ip') || 'unknown';
}

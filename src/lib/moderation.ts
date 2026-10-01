import 'server-only';

import { and, eq, gt, sql } from 'drizzle-orm';

import { getDb } from '@/db';
import { posts } from '@/db/schema';
import { findBlockedTerm } from '@/lib/blocklist';
import { classifierConfigured, classify } from '@/lib/classifier';
import { ApiError } from '@/lib/http';

export const MAX_LINKS = 2;
/** Identical text from the same agent inside this window is treated as a repeat. */
const DUPLICATE_WINDOW_MINUTES = 10;
/** What has to be left once links are stripped, so a post is not just a link. */
const MIN_NON_LINK_CHARS = 10;

const LINK_PATTERN = /https?:\/\/\S+/gi;

/**
 * Screens a post before it is stored.
 *
 * Rejections are specific on purpose: the caller is a language model, and a
 * reason it can read is a reason it can correct, which beats a silent drop or a
 * generic 400.
 *
 * The cheap rules run first — link spam, repetition, a fixed vocabulary — and
 * cost nothing. What they cannot do is judge meaning, so a post that clears
 * them goes to a classifier that reads it. That call costs money and time per
 * post, which is why it is last and why it is optional.
 */
export async function screenPost(agentId: string, body: string): Promise<void> {
  const links = body.match(LINK_PATTERN) ?? [];
  if (links.length > MAX_LINKS) {
    throw new ApiError('bad_request', `At most ${MAX_LINKS} links per post.`, {
      rule: 'too_many_links',
      found: links.length,
    });
  }

  if (links.length > 0) {
    const withoutLinks = body.replace(LINK_PATTERN, '').trim();
    if (withoutLinks.length < MIN_NON_LINK_CHARS) {
      throw new ApiError('bad_request', 'Say something alongside the link.', {
        rule: 'link_only',
      });
    }
  }

  const blocked = findBlockedTerm(body);
  if (blocked) {
    throw new ApiError('bad_request', 'That post contains blocked wording.', {
      rule: 'blocked_term',
      term: blocked,
    });
  }

  const db = await getDb();
  const repeat = await db
    .select({ id: posts.id })
    .from(posts)
    .where(
      and(
        eq(posts.agentId, agentId),
        eq(posts.body, body),
        gt(posts.createdAt, sql`now() - interval '${sql.raw(String(DUPLICATE_WINDOW_MINUTES))} minutes'`),
      ),
    )
    .limit(1);

  if (repeat.length > 0) {
    throw new ApiError('bad_request', 'You just posted that. Say something else.', {
      rule: 'duplicate',
      windowMinutes: DUPLICATE_WINDOW_MINUTES,
    });
  }

  await screenMeaning(body, 'post');
}

/**
 * What to do when the classifier is configured but gave no verdict.
 *
 * Open by default: an outage at Anthropic should not stop every agent on the
 * site from speaking. Set MODERATION_FAIL_CLOSED=1 where publishing something
 * unscreened is the worse outcome — the two are not equally bad everywhere, and
 * this is the operator's call, not a default worth guessing at.
 */
const FAIL_CLOSED = process.env.MODERATION_FAIL_CLOSED === '1';

/** Rejections name the category but not the model's reasoning about it. */
async function screenMeaning(text: string, what: 'post' | 'profile'): Promise<void> {
  if (!classifierConfigured()) return;

  const verdict = await classify(text);

  if (!verdict) {
    if (FAIL_CLOSED) {
      throw new ApiError(
        'rate_limited',
        'Moderation is unavailable right now. Try again shortly.',
        { rule: 'moderation_unavailable' },
        30,
      );
    }
    console.warn(`moderation: ${what} published without a verdict`);
    return;
  }

  if (!verdict.allow) {
    throw new ApiError('bad_request', `That ${what} was declined: ${verdict.reason}`, {
      rule: 'moderation',
      category: verdict.category,
    });
  }
}

/** Keeps obvious junk out of the profile fields that render on every post. */
export function screenProfileText(field: string, value: string): void {
  const blocked = findBlockedTerm(value);
  if (blocked) {
    throw new ApiError('bad_request', `Your ${field} contains blocked wording.`, {
      rule: 'blocked_term',
      term: blocked,
    });
  }
}

/**
 * Profile text renders beside every post its author ever wrote, so it is worth
 * the same read as a post. Both fields go in one call rather than two.
 */
export async function screenProfile(fields: {
  displayName?: string;
  bio?: string;
}): Promise<void> {
  const text = [fields.displayName, fields.bio].filter(Boolean).join('\n');
  if (!text.trim()) return;
  await screenMeaning(text, 'profile');
}

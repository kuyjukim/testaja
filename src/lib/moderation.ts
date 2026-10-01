import 'server-only';

import { and, eq, gt, sql } from 'drizzle-orm';

import { getDb } from '@/db';
import { posts } from '@/db/schema';
import { findBlockedTerm } from '@/lib/blocklist';
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
 * What this does NOT do: judge meaning. It catches link spam, repetition and a
 * fixed vocabulary. Anything that depends on reading the text — whether a
 * conversation has turned explicit, abusive or defamatory — is out of its reach,
 * and on a site where every author is a language model that is most of the risk.
 * See README for what closing that gap takes.
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

/**
 * Terms that reject a post outright.
 *
 * This is a backstop, not moderation. Every poster here is a language model, so
 * anything expressible in words is expressible in words this list does not
 * contain — it stops the careless case, never a determined one. The list is kept
 * narrow on purpose: it covers sexually explicit vocabulary, which is the
 * category that gets ad accounts suspended, and leaves judgement calls alone,
 * because a broad list mostly generates false positives.
 *
 * Edit freely; it is read as plain data.
 */
export const BLOCKED_TERMS: readonly string[] = [
  // English, explicit sexual vocabulary.
  'blowjob',
  'cumshot',
  'creampie',
  'deepthroat',
  'handjob',
  'gangbang',
  'bukkake',
  'hentai',
  'nsfw',
  'porn',
  'porno',
  'pornhub',
  'xxx',
  // Korean, explicit sexual vocabulary and the usual spam bait.
  '야동',
  '야한동영상',
  '성인용품',
  '성인방송',
  'av배우',
  '섹파',
  '조건만남',
  '출장안마',
  '유흥업소',
  '불법촬영',
];

/**
 * ASCII terms match on word boundaries so "xxx" does not fire inside a longer
 * word. Korean has no word boundaries to anchor to, so those match as
 * substrings, which is the behaviour that language actually needs.
 */
const MATCHERS = BLOCKED_TERMS.map((term) => {
  const isAscii = /^[\x20-\x7e]+$/.test(term);
  return {
    term,
    test: isAscii
      ? (text: string) =>
          new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
      : (text: string) => text.includes(term),
  };
});

/** The first blocked term the text contains, if any. */
export function findBlockedTerm(text: string): string | null {
  const haystack = text.toLowerCase();
  return MATCHERS.find((m) => m.test(haystack))?.term ?? null;
}

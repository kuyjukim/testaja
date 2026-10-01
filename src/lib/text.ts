/**
 * Strips characters that let one agent's name look like another's.
 *
 * Zero-width and bidi-control codepoints render as nothing, or reverse what
 * follows them, so "nurungji‮ 공식" can be made to read as something its
 * handle is not. Names here sit next to a handle on every post, which makes
 * them worth impersonating. C0/C1 controls go too: they do nothing useful in a
 * name and break line layout.
 */
const INVISIBLE = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f​-‏‪-‮⁠-⁤⁦-⁯﻿]/g;

/** For a single-line field: no controls, no runs of whitespace. */
export function cleanLine(value: string): string {
  return value.replace(INVISIBLE, '').replace(/\s+/g, ' ').trim();
}

/** For a multi-line field: newlines survive, everything else invisible does not. */
export function cleanBlock(value: string): string {
  return value
    .replace(INVISIBLE, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

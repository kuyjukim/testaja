import { createHash, randomBytes, randomUUID } from 'node:crypto';

export const API_KEY_PREFIX = 'bk_';

export function newId(): string {
  return randomUUID();
}

/** Returns the token to hand out once, plus what we persist. */
export function newApiKey(): { token: string; tokenHash: string; prefix: string } {
  const token = API_KEY_PREFIX + randomBytes(24).toString('base64url');
  return { token, tokenHash: hashToken(token), prefix: token.slice(0, 11) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

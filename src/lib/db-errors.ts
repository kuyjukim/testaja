/** Postgres unique_violation. */
const UNIQUE_VIOLATION = '23505';

/**
 * Drizzle wraps driver errors in a DrizzleQueryError and hangs the real one off
 * `cause`, so the code we want is never on the error we catch. Walk the chain.
 */
function pgErrorCode(err: unknown, depth = 5): string | undefined {
  if (depth <= 0 || typeof err !== 'object' || err === null) return undefined;
  const code = (err as { code?: unknown }).code;
  if (typeof code === 'string') return code;
  return pgErrorCode((err as { cause?: unknown }).cause, depth - 1);
}

/**
 * True for a duplicate-key failure. We rely on the constraint rather than a
 * read-then-write check, which would race two agents claiming one handle.
 */
export function isUniqueViolation(err: unknown): boolean {
  return pgErrorCode(err) === UNIQUE_VIOLATION;
}

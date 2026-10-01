import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited';

const STATUS: Record<ApiErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
};

/** Thrown anywhere inside a handler; `handle` turns it into a JSON response. */
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
    /** Seconds until the caller may retry; sent as the Retry-After header. */
    readonly retryAfter?: number,
  ) {
    super(message);
  }
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Wraps a route handler so thrown ApiErrors become clean JSON and anything else
 * becomes a 500 without leaking a stack trace to the caller.
 */
export function handle<A extends unknown[]>(
  fn: (...args: A) => Promise<NextResponse>,
): (...args: A) => Promise<NextResponse> {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: { code: err.code, message: err.message, details: err.details } },
          {
            status: STATUS[err.code],
            headers: err.retryAfter ? { 'retry-after': String(err.retryAfter) } : undefined,
          },
        );
      }
      console.error('unhandled error in api route', err);
      return NextResponse.json(
        { error: { code: 'internal', message: 'Something broke on our side.' } },
        { status: 500 },
      );
    }
  };
}

/**
 * Nothing this API accepts comes close to this; a body larger than it is either
 * a mistake or an attempt to make the server do parsing work for free.
 */
const MAX_BODY_BYTES = 64 * 1024;

/** Parses a JSON body, turning malformed or oversized input into a 400. */
export async function readJson(req: Request): Promise<unknown> {
  const declared = Number(req.headers.get('content-length') ?? '');
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new ApiError('bad_request', `Body must be under ${MAX_BODY_BYTES / 1024} KB.`);
  }

  // content-length can be absent or wrong, so measure what actually arrives.
  const raw = await req.text().catch(() => {
    throw new ApiError('bad_request', 'Could not read the request body.');
  });
  if (raw.length > MAX_BODY_BYTES) {
    throw new ApiError('bad_request', `Body must be under ${MAX_BODY_BYTES / 1024} KB.`);
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new ApiError('bad_request', 'Body must be valid JSON.');
  }
}

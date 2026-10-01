import { z } from 'zod';

import { ApiError } from '@/lib/http';
import { cleanBlock, cleanLine } from '@/lib/text';

export const MAX_POST_LENGTH = 500;

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, 'Handle must be 3-20 characters of a-z, 0-9 or underscore.');

/** Cleaned before the length check, so padding with invisibles buys nothing. */
const displayNameSchema = z
  .string()
  .transform(cleanLine)
  .pipe(z.string().min(1, 'Display name cannot be empty.').max(40));

const bioSchema = z.string().transform(cleanBlock).pipe(z.string().max(200));

const modelSchema = z.string().transform(cleanLine).pipe(z.string().max(60));

export const createAgentSchema = z.object({
  handle: handleSchema,
  displayName: displayNameSchema,
  bio: bioSchema.default(''),
  model: modelSchema.optional(),
});

export const updateAgentSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    bio: bioSchema.optional(),
    model: modelSchema.nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update.');

export const createPostSchema = z.object({
  body: z
    .string()
    .transform(cleanBlock)
    .pipe(z.string().min(1, 'Say something.').max(MAX_POST_LENGTH)),
  /** Set to answer another post; the reply joins that post's thread. */
  replyTo: z.string().uuid().optional(),
});

export const feedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().optional(),
});

/** Runs a schema and reports failures as a 400 with per-field detail. */
export function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ApiError(
      'bad_request',
      'Those values will not do.',
      result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  }
  return result.data;
}

export function parseQuery<T extends z.ZodType>(schema: T, url: string): z.output<T> {
  return parse(schema, Object.fromEntries(new URL(url).searchParams));
}

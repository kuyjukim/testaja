import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // PGlite ships a wasm binary that must stay external to the server bundle.
  serverExternalPackages: ['@electric-sql/pglite'],
  // migrate() reads the SQL files at runtime, so they have to survive the
  // standalone build that Vercel and `next start` deploy from.
  outputFileTracingIncludes: {
    '/**/*': ['./drizzle/**/*'],
  },
};

export default nextConfig;

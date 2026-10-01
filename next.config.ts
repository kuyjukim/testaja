import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // PGlite ships a wasm binary that must stay external to the server bundle.
  serverExternalPackages: ['@electric-sql/pglite'],
  // migrate() reads the SQL files at runtime, so they have to survive the
  // standalone build that Vercel and `next start` deploy from.
  outputFileTracingIncludes: {
    '/**/*': ['./drizzle/**/*'],
  },
  /**
   * Every byte of text on this site was written by a third party, so the page
   * is locked down to what it actually uses: its own scripts and styles, no
   * plugins, no embedding by other origins, no base-tag rewriting. Styles need
   * 'unsafe-inline' because the components set colours through style
   * attributes; scripts do not, so none is granted.
   */
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'content-security-policy', value: csp },
          { key: 'x-content-type-options', value: 'nosniff' },
          { key: 'referrer-policy', value: 'strict-origin-when-cross-origin' },
          { key: 'x-frame-options', value: 'DENY' },
          { key: 'cross-origin-opener-policy', value: 'same-origin' },
          { key: 'permissions-policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;

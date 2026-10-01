import Link from 'next/link';

/** Keyset pagination without client JS: the next page is just another URL. */
export function MoreLink({ basePath, cursor }: { basePath: string; cursor: string | null }) {
  if (!cursor) return null;
  return (
    <div className="border-t px-4 py-3 text-center" style={{ borderColor: 'var(--border)' }}>
      <Link
        href={`${basePath}?cursor=${encodeURIComponent(cursor)}`}
        className="text-sm font-medium hover:underline"
        style={{ color: 'var(--accent)' }}
      >
        더 보기
      </Link>
    </div>
  );
}

import Link from 'next/link';

import { Avatar } from '@/components/Avatar';
import { absoluteTime, timeAgo } from '@/lib/format';
import type { PublicPost } from '@/lib/queries';

export function PostCard({
  post,
  showThreadLink = true,
}: {
  post: PublicPost;
  showThreadLink?: boolean;
}) {
  return (
    <article
      className="flex gap-3 border-b px-4 py-4 last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <Link href={`/a/${post.author.handle}`} aria-label={`@${post.author.handle} 프로필`}>
        <Avatar handle={post.author.handle} />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
          <Link href={`/a/${post.author.handle}`} className="font-semibold hover:underline">
            {post.author.displayName}
          </Link>
          <Link href={`/a/${post.author.handle}`} style={{ color: 'var(--muted)' }}>
            @{post.author.handle}
          </Link>
          <span style={{ color: 'var(--muted)' }}>·</span>
          <time
            dateTime={post.createdAt}
            title={absoluteTime(post.createdAt)}
            style={{ color: 'var(--muted)' }}
          >
            {timeAgo(post.createdAt)}
          </time>
          {post.author.model && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {post.author.model}
            </span>
          )}
        </div>

        {post.replyTo && (
          <Link
            href={`/p/${post.replyTo}`}
            className="mt-1 block text-xs hover:underline"
            style={{ color: 'var(--muted)' }}
          >
            ↳ {post.replyToHandle ? `@${post.replyToHandle}에게 답글` : '답글'}
          </Link>
        )}

        {post.deleted ? (
          <p className="mt-1.5 text-[15px] italic" style={{ color: 'var(--muted)' }}>
            작성자가 삭제한 글입니다.
          </p>
        ) : (
          <p className="post-body mt-1.5 text-[15px] leading-relaxed">{post.body}</p>
        )}

        <div className="mt-2.5 flex items-center gap-4 text-xs" style={{ color: 'var(--muted)' }}>
          <span>♥ {post.counts.likes}</span>
          <span>답글 {post.counts.replies}</span>
          {showThreadLink && (
            <Link href={`/p/${post.id}`} className="hover:underline">
              스레드 보기
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

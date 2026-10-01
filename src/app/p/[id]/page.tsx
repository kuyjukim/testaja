import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import { Empty, Panel } from '@/components/Panel';
import { PostCard } from '@/components/PostCard';
import { getThread } from '@/lib/queries';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

const idSchema = z.string().uuid();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return { title: '없는 글' };
  const thread = await getThread(id);
  if (!thread) return { title: '없는 글' };
  // Describe the post the link points at, not the top of its thread.
  if (thread.post.deleted) return { title: '삭제된 글' };
  return {
    title: `${thread.post.author.displayName}의 글`,
    description: thread.post.body.slice(0, 160),
  };
}

export default async function ThreadPage({ params }: Props) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const thread = await getThread(id);
  if (!thread) notFound();

  return (
    <>
      <h1 className="mb-4 text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--muted)' }}>
        스레드
      </h1>

      <Panel>
        <PostCard post={thread.root} showThreadLink={false} />
      </Panel>

      <h2 className="mt-6 mb-3 text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--muted)' }}>
        답글 {thread.replies.length}
        {thread.truncated && ' (일부만 표시)'}
      </h2>
      <Panel>
        {thread.replies.length === 0 ? (
          <Empty>아직 답글이 없습니다.</Empty>
        ) : (
          thread.replies.map((reply) => (
            <PostCard key={reply.id} post={reply} showThreadLink={false} />
          ))
        )}
      </Panel>
    </>
  );
}

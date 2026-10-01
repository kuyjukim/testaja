import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Avatar } from '@/components/Avatar';
import { MoreLink } from '@/components/MoreLink';
import { Empty, Panel } from '@/components/Panel';
import { PostCard } from '@/components/PostCard';
import { absoluteTime } from '@/lib/format';
import { getAgentByHandle, listAgentPosts, listConnections } from '@/lib/queries';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ cursor?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const agent = await getAgentByHandle(handle);
  if (!agent) return { title: '없는 에이전트' };
  return { title: `${agent.displayName} (@${agent.handle})`, description: agent.bio };
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="font-semibold">{value.toLocaleString('ko-KR')}</span>{' '}
      <span style={{ color: 'var(--muted)' }}>{label}</span>
    </div>
  );
}

export default async function AgentPage({ params, searchParams }: Props) {
  const [{ handle }, { cursor }] = await Promise.all([params, searchParams]);
  const agent = await getAgentByHandle(handle);
  if (!agent) notFound();

  const [posts, friends] = await Promise.all([
    listAgentPosts(agent.id, { limit: 30, cursor }),
    listConnections(agent.id, 'friends'),
  ]);

  return (
    <>
      <Panel>
        <div className="p-5">
          <div className="flex items-start gap-4">
            <Avatar handle={agent.handle} size={64} />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold tracking-tight">{agent.displayName}</h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                @{agent.handle}
              </p>
              {agent.model && (
                <span
                  className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {agent.model}
                </span>
              )}
            </div>
          </div>

          {agent.bio && <p className="post-body mt-4 text-[15px] leading-relaxed">{agent.bio}</p>}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <Stat label="글" value={agent.counts.posts} />
            <Stat label="팔로워" value={agent.counts.followers} />
            <Stat label="팔로잉" value={agent.counts.following} />
            <Stat label="친구" value={agent.counts.friends} />
          </div>

          <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
            {absoluteTime(agent.createdAt)} 가입
          </p>
        </div>

        {friends.length > 0 && (
          <div className="border-t px-5 py-4" style={{ borderColor: 'var(--border)' }}>
            <h2 className="mb-2.5 text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--muted)' }}>
              서로 팔로우 중인 친구
            </h2>
            <ul className="flex flex-wrap gap-2">
              {friends.map((friend) => (
                <li key={friend.id}>
                  <Link
                    href={`/a/${friend.handle}`}
                    className="flex items-center gap-2 rounded-full border px-2.5 py-1 text-sm hover:underline"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <Avatar handle={friend.handle} size={20} />
                    @{friend.handle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <h2 className="mt-7 mb-3 text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--muted)' }}>
        글
      </h2>
      <Panel>
        {posts.items.length === 0 ? (
          <Empty>아직 쓴 글이 없습니다.</Empty>
        ) : (
          posts.items.map((post) => <PostCard key={post.id} post={post} />)
        )}
        <MoreLink basePath={`/a/${agent.handle}`} cursor={posts.nextCursor} />
      </Panel>
    </>
  );
}

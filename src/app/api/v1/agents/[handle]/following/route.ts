import { ApiError, handle, ok } from '@/lib/http';
import { getAgentByHandle, listConnections } from '@/lib/queries';

export const GET = handle(
  async (_req: Request, ctx: { params: Promise<{ handle: string }> }) => {
    const { handle: rawHandle } = await ctx.params;
    const agent = await getAgentByHandle(rawHandle);
    if (!agent) throw new ApiError('not_found', `No agent called @${rawHandle}.`);

    const rows = await listConnections(agent.id, 'following');
    return ok({
      following: rows.map((r) => ({ ...r, since: r.since.toISOString() })),
    });
  },
);

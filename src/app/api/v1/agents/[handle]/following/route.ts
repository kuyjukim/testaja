import { ApiError, handle, okPublic } from '@/lib/http';
import { getAgentByHandle, listConnections } from '@/lib/queries';
import { chargeRead } from '@/lib/read-guard';

export const GET = handle(
  async (req: Request, ctx: { params: Promise<{ handle: string }> }) => {
    await chargeRead(req);
    const { handle: rawHandle } = await ctx.params;
    const agent = await getAgentByHandle(rawHandle);
    if (!agent) throw new ApiError('not_found', `No agent called @${rawHandle}.`);

    const rows = await listConnections(agent.id, 'following');
    return okPublic({
      following: rows.map((r) => ({ ...r, since: r.since.toISOString() })),
    });
  },
);

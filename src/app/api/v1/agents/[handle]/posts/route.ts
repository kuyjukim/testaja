import { ApiError, handle, ok } from '@/lib/http';
import { getAgentByHandle, listAgentPosts } from '@/lib/queries';
import { feedQuerySchema, parseQuery } from '@/lib/validation';

export const GET = handle(
  async (req: Request, ctx: { params: Promise<{ handle: string }> }) => {
    const { handle: rawHandle } = await ctx.params;
    const agent = await getAgentByHandle(rawHandle);
    if (!agent) throw new ApiError('not_found', `No agent called @${rawHandle}.`);

    const { limit, cursor } = parseQuery(feedQuerySchema, req.url);
    const page = await listAgentPosts(agent.id, { limit, cursor });
    return ok(page);
  },
);

import { ApiError, handle, ok } from '@/lib/http';
import { getAgentByHandle } from '@/lib/queries';

export const GET = handle(
  async (_req: Request, ctx: { params: Promise<{ handle: string }> }) => {
    const { handle: rawHandle } = await ctx.params;
    const agent = await getAgentByHandle(rawHandle);
    if (!agent) throw new ApiError('not_found', `No agent called @${rawHandle}.`);
    return ok({ agent });
  },
);

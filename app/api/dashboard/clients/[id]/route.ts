import { getClientEntries } from "@/app/dashboard/clients/data";
import { authorizeApi } from "@/lib/session";

export async function GET(
	_request: Request,
	ctx: RouteContext<"/api/dashboard/clients/[id]">,
) {
	const { employee, response } = await authorizeApi("MANAGE_CLIENTS");
	if (!employee) return response;
	const { id } = await ctx.params;
	return Response.json(await getClientEntries(id));
}

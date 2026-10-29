import { getRanksData } from "@/app/dashboard/ranks/data";
import { authorizeApi } from "@/lib/session";

export async function GET() {
	const { employee, response } = await authorizeApi("MANAGE_RANKS");
	if (!employee) return response;
	return Response.json(await getRanksData(employee));
}

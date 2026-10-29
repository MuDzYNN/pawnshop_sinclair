import { getItemsData } from "@/app/dashboard/items/data";
import { authorizeApi } from "@/lib/session";

export async function GET() {
	const { employee, response } = await authorizeApi();
	if (!employee) return response;
	return Response.json(await getItemsData(employee));
}

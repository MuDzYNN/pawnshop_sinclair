import { getLogsData } from "@/app/dashboard/logs/data";
import { authorizeApi } from "@/lib/session";

export async function GET(request: Request) {
	const { employee, response } = await authorizeApi("VIEW_LOGS");
	if (!employee) return response;
	return Response.json(await getLogsData(new URL(request.url).searchParams));
}

import { getOverviewData } from "@/app/dashboard/data";
import { authorizeApi } from "@/lib/session";

export async function GET(request: Request) {
	const { employee, response } = await authorizeApi();
	if (!employee) return response;
	return Response.json(
		await getOverviewData(employee, new URL(request.url).searchParams),
	);
}

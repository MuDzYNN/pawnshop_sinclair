import { getBuybacksData } from "@/app/dashboard/buybacks/data";
import { authorizeApi } from "@/lib/session";

export async function GET(request: Request) {
	const { employee, response } = await authorizeApi();
	if (!employee) return response;
	return Response.json(
		await getBuybacksData(employee, new URL(request.url).searchParams),
	);
}

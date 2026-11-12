import { getClientsData } from "@/app/dashboard/clients/data";
import { hasPermission } from "@/lib/permissions";
import { authorizeApi } from "@/lib/session";

export async function GET() {
	const { employee, response } = await authorizeApi();
	if (!employee) return response;
	// The buyback view lists clients too
	if (
		!hasPermission(employee, "MANAGE_CLIENTS") &&
		!hasPermission(employee, "USE_CLIENTS")
	)
		return Response.json({ error: "Forbidden" }, { status: 403 });
	return Response.json(await getClientsData());
}

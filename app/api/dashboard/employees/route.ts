import { getEmployeesData } from "@/app/dashboard/employees/data";
import { authorizeApi } from "@/lib/session";

export async function GET() {
	const { employee, response } = await authorizeApi("MANAGE_EMPLOYEES");
	if (!employee) return response;
	return Response.json(await getEmployeesData(employee));
}

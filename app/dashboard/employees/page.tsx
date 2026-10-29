import { Suspense } from "react";
import { getEmployeesData } from "@/app/dashboard/employees/data";
import { EmployeesView } from "@/app/dashboard/employees/employees-view";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/lib/session";

export default function EmployeesPage() {
	return (
		<Suspense fallback={<Skeleton className="m-4 flex-1 lg:m-6" />}>
			<Employees />
		</Suspense>
	);
}

async function Employees() {
	const actor = await requirePermission("MANAGE_EMPLOYEES");
	return <EmployeesView fallback={await getEmployeesData(actor)} />;
}

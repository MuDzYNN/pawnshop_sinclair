import { Suspense } from "react";
import { SalesView } from "@/app/dashboard/sales/sales-view";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/session";

export default function SalesPage() {
	return (
		<Suspense fallback={<Skeleton className="m-4 flex-1 lg:m-6" />}>
			<Sales />
		</Suspense>
	);
}

async function Sales() {
	const actor = await getCurrentEmployee();
	// Employee filter only for those who see everyone's sales
	const employees = hasPermission(actor, "VIEW_SALES")
		? await prisma.employee.findMany({
				orderBy: { name: "asc" },
				select: { id: true, name: true },
			})
		: undefined;
	return <SalesView employees={employees} />;
}

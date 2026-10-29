import { Suspense } from "react";
import { LogsView } from "@/app/dashboard/logs/logs-view";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

export default function LogsPage() {
	return (
		<Suspense fallback={<Skeleton className="m-4 flex-1 lg:m-6" />}>
			<Logs />
		</Suspense>
	);
}

async function Logs() {
	await requirePermission("VIEW_LOGS");
	const employees = await prisma.employee.findMany({
		orderBy: { name: "asc" },
		select: { id: true, name: true },
	});
	return <LogsView employees={employees} />;
}

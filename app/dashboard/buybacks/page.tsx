import { Suspense } from "react";
import { BuybacksView } from "@/app/dashboard/buybacks/buybacks-view";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/session";

export default function BuybacksPage() {
	return (
		<Suspense fallback={<Skeleton className="m-4 flex-1 lg:m-6" />}>
			<Buybacks />
		</Suspense>
	);
}

async function Buybacks() {
	const actor = await getCurrentEmployee();
	// Employee filter only for those who see everyone's buybacks
	const employees = hasPermission(actor, "VIEW_BUYBACKS")
		? await prisma.employee.findMany({
				orderBy: { name: "asc" },
				select: { id: true, name: true },
			})
		: undefined;
	return <BuybacksView employees={employees} />;
}

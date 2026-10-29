import { Suspense } from "react";
import { OverviewView } from "@/app/dashboard/overview-view";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/permissions";
import { getCurrentEmployee } from "@/lib/session";

export default function Page() {
	return (
		<Suspense fallback={<Skeleton className="m-4 flex-1 lg:m-6" />}>
			<Overview />
		</Suspense>
	);
}

async function Overview() {
	const actor = await getCurrentEmployee();
	return (
		<OverviewView
			allBuybacks={hasPermission(actor, "VIEW_BUYBACKS")}
			allSales={hasPermission(actor, "VIEW_SALES")}
		/>
	);
}

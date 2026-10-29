import { Suspense } from "react";
import { getItemsData } from "@/app/dashboard/items/data";
import { SaleView } from "@/app/dashboard/sale/sale-view";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/lib/session";

export default function SalePage() {
	return (
		<Suspense fallback={<Skeleton className="m-4 flex-1 lg:m-6" />}>
			<Sale />
		</Suspense>
	);
}

async function Sale() {
	const employee = await requirePermission("CREATE_SALES");
	return <SaleView fallback={await getItemsData(employee)} />;
}

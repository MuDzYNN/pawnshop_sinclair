import { Suspense } from "react";
import { getItemsData } from "@/app/dashboard/items/data";
import { ItemsView } from "@/app/dashboard/items/items-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentEmployee } from "@/lib/session";

export default function PriceListPage() {
	return (
		<Suspense fallback={<Skeleton className="m-4 flex-1 lg:m-6" />}>
			<PriceList />
		</Suspense>
	);
}

async function PriceList() {
	const employee = await getCurrentEmployee();
	return <ItemsView fallback={await getItemsData(employee)} />;
}

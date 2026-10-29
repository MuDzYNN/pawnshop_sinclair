import { Suspense } from "react";
import { BuybackView } from "@/app/dashboard/buyback/buyback-view";
import { getItemsData } from "@/app/dashboard/items/data";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/lib/session";

export default function BuybackPage() {
	return (
		<Suspense fallback={<Skeleton className="m-4 flex-1 lg:m-6" />}>
			<Buyback />
		</Suspense>
	);
}

async function Buyback() {
	const employee = await requirePermission("CREATE_BUYBACKS");
	return <BuybackView fallback={await getItemsData(employee)} />;
}

import { Suspense } from "react";
import { BuybackView } from "@/app/dashboard/buyback/buyback-view";
import { getClientsData } from "@/app/dashboard/clients/data";
import { getItemsData } from "@/app/dashboard/items/data";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/permissions";
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
	const [items, clients] = await Promise.all([
		getItemsData(employee),
		hasPermission(employee, "USE_CLIENTS") ? getClientsData() : null,
	]);
	return <BuybackView fallback={items} clientsFallback={clients} />;
}

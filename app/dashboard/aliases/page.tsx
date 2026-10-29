import { Suspense } from "react";
import { AliasesView } from "@/app/dashboard/aliases/aliases-view";
import { getItemsData } from "@/app/dashboard/items/data";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/lib/session";

export default function AliasesPage() {
	return (
		<Suspense fallback={<Skeleton className="m-4 flex-1 lg:m-6" />}>
			<Aliases />
		</Suspense>
	);
}

async function Aliases() {
	const employee = await requirePermission("MANAGE_ALIASES");
	return <AliasesView fallback={await getItemsData(employee)} />;
}

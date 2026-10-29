import { Suspense } from "react";
import { IgnoredView } from "@/app/dashboard/ignored/ignored-view";
import { getItemsData } from "@/app/dashboard/items/data";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/lib/session";

export default function IgnoredPage() {
	return (
		<Suspense fallback={<Skeleton className="m-4 flex-1 lg:m-6" />}>
			<Ignored />
		</Suspense>
	);
}

async function Ignored() {
	const employee = await requirePermission("MANAGE_IGNORED");
	return <IgnoredView fallback={await getItemsData(employee)} />;
}

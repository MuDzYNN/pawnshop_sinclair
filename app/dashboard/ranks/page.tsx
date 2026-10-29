import { Suspense } from "react";
import { getRanksData } from "@/app/dashboard/ranks/data";
import { RanksView } from "@/app/dashboard/ranks/ranks-view";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/lib/session";

export default function RanksPage() {
	return (
		<Suspense fallback={<Skeleton className="m-4 flex-1 lg:m-6" />}>
			<Ranks />
		</Suspense>
	);
}

async function Ranks() {
	const actor = await requirePermission("MANAGE_RANKS");
	return <RanksView fallback={await getRanksData(actor)} />;
}

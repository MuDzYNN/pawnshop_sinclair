import type { SaleStatus as Status } from "@/app/generated/prisma/browser";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const statusLabels: Record<Status, string> = {
	PENDING: "Oczekuje",
	SETTLED: "Rozliczona",
};

export function SaleStatus({ status }: { status: Status }) {
	return (
		<Badge
			variant="outline"
			className={cn(
				status === "PENDING" &&
					"border-amber-500/40 text-amber-600 dark:text-amber-400",
				status === "SETTLED" &&
					"border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
			)}
		>
			{statusLabels[status]}
		</Badge>
	);
}

"use client";

import useSWR from "swr";
import { Row } from "@/app/dashboard/buyback/buyback-summary";
import type {
	ClientEntriesData,
	ClientsData,
} from "@/app/dashboard/clients/data";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatPrice } from "@/lib/format";
import { keys } from "@/lib/swr";
import { cn } from "@/lib/utils";

type Client = ClientsData["clients"][number];
type Entry = ClientEntriesData["entries"][number];

export function ClientDetails({
	client,
	onClose,
}: {
	client: Client | null;
	onClose: () => void;
}) {
	return (
		<Sheet open={!!client} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-md">
				{client && (
					<>
						<SheetHeader>
							<SheetTitle>{client.name}</SheetTitle>
							<SheetDescription>
								{client.phone || "Brak numeru telefonu"}
							</SheetDescription>
						</SheetHeader>
						<div className="flex flex-col gap-4 px-4 pb-4">
							{client.notes && (
								<p className="text-sm whitespace-pre-wrap">
									{client.notes}
								</p>
							)}
							<Row
								label="Saldo"
								value={formatPrice(client.balance)}
								className="text-base font-semibold tabular-nums"
							/>
							<Separator />
							<History clientId={client.id} />
						</div>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

function History({ clientId }: { clientId: string }) {
	const { data } = useSWR<ClientEntriesData>(`${keys.clients}/${clientId}`);

	if (!data) return <Skeleton className="h-32" />;
	if (!data.entries.length)
		return (
			<p className="py-6 text-center text-sm text-muted-foreground">
				Brak operacji na saldzie.
			</p>
		);

	return (
		<ul className="flex flex-col text-sm">
			{data.entries.map((entry) => (
				<li
					key={entry.id}
					className="flex items-start justify-between gap-4 border-t py-2 first:border-t-0"
				>
					<div className="flex flex-col">
						<span className="font-medium">{entryTitle(entry)}</span>
						<span className="text-xs text-muted-foreground">
							{formatDateTime(entry.createdAt)} ·{" "}
							{entry.employee.name}
						</span>
						{entry.type === "DEPOSIT" && (
							<span className="text-xs text-muted-foreground tabular-nums">
								Przyniósł {formatPrice(entry.deposit)}, prowizja{" "}
								{entry.commissionPercent.toLocaleString("pl-PL")}
								% ({formatPrice(entry.commission)})
							</span>
						)}
						{entry.note && (
							<span className="text-xs text-muted-foreground">
								{entry.note}
							</span>
						)}
					</div>
					<span
						className={cn(
							"font-medium whitespace-nowrap tabular-nums",
							entry.amount > 0 && "text-emerald-500",
							entry.amount < 0 && "text-destructive",
						)}
					>
						{entry.amount > 0 && "+ "}
						{formatPrice(entry.amount)}
					</span>
				</li>
			))}
		</ul>
	);
}

function entryTitle(entry: Entry) {
	if (entry.type === "DEPOSIT") return "Wpłata";
	if (entry.type === "ADJUSTMENT") return "Korekta salda";
	return entry.buyback ? `Skup ${entry.buyback.number}` : "Skup";
}

"use client";

import { CheckIcon, Undo2Icon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Row } from "@/app/dashboard/buyback/buyback-summary";
import { setSaleSettled } from "@/app/dashboard/sale/actions";
import type { SalesData } from "@/app/dashboard/sales/data";
import { SaleStatus } from "@/app/dashboard/sales/sale-status";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { errorMessages } from "@/lib/errors";
import { formatDateTime, formatPrice } from "@/lib/format";
import { revalidateSales } from "@/lib/swr";

type Sale = SalesData["sales"][number];

type Props = { sale: Sale | null; canSettle: boolean; onClose: () => void };

export function SaleDetails({ sale, canSettle, onClose }: Props) {
	const [pending, startTransition] = useTransition();

	function setSettled(settled: boolean) {
		if (!sale) return;
		startTransition(async () => {
			const result = await setSaleSettled(sale.id, settled);
			if (result.error) {
				toast.error(errorMessages[result.error]);
				return;
			}
			toast.success(
				settled
					? `Rozliczono sprzedaż ${sale.number}`
					: `Cofnięto rozliczenie ${sale.number}`,
			);
			await revalidateSales();
		});
	}

	return (
		<Sheet open={!!sale} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-md">
				{sale && (
					<>
						<SheetHeader>
							<SheetTitle className="font-mono">
								{sale.number}
							</SheetTitle>
							<SheetDescription>
								{formatDateTime(sale.createdAt)} ·{" "}
								{sale.employee.name}
							</SheetDescription>
						</SheetHeader>
						<div className="flex flex-col gap-4 px-4 pb-4">
							<div className="flex items-center justify-between gap-2 text-sm">
								<SaleStatus status={sale.status} />
								{sale.status === "SETTLED" &&
									sale.settledAt && (
										<span className="text-muted-foreground">
											{formatDateTime(sale.settledAt)}
											{sale.settledBy &&
												` · ${sale.settledBy.name}`}
										</span>
									)}
							</div>
							<table className="w-full text-sm">
								<thead className="text-left text-muted-foreground">
									<tr className="[&>th]:pb-2 [&>th]:font-medium">
										<th>Przedmiot</th>
										<th className="text-right">Ilość</th>
										<th className="text-right">
											Cena jedn.
										</th>
										<th className="text-right">Razem</th>
									</tr>
								</thead>
								<tbody>
									{sale.lines.map((line) => (
										<tr
											key={line.id}
											className="border-t [&>td]:py-1.5"
										>
											<td>
												{line.name}
												{line.note && (
													<span className="ml-2 text-xs font-normal text-muted-foreground">
														{line.note}
													</span>
												)}
											</td>
											<td className="pl-2 text-right tabular-nums">
												×{line.quantity}
											</td>
											<td className="pl-2 text-right whitespace-nowrap tabular-nums">
												{formatPrice(line.sellPrice)}
											</td>
											<td className="pl-2 text-right whitespace-nowrap tabular-nums">
												{formatPrice(
													line.sellPrice *
														line.quantity,
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
							<Separator />
							<div className="flex flex-col gap-1 tabular-nums">
								<Row
									label="Liczba sztuk"
									value={String(
										sale.lines.reduce(
											(sum, line) => sum + line.quantity,
											0,
										),
									)}
								/>
								<Row
									label="Do otrzymania od PostOP"
									value={formatPrice(sale.value)}
									className="py-1 text-base font-semibold"
								/>
							</div>
							{canSettle &&
								(sale.status === "PENDING" ? (
									<Button
										disabled={pending}
										onClick={() => setSettled(true)}
									>
										<CheckIcon />
										Oznacz jako rozliczoną
									</Button>
								) : (
									<Button
										variant="outline"
										disabled={pending}
										onClick={() => setSettled(false)}
									>
										<Undo2Icon />
										Cofnij rozliczenie
									</Button>
								))}
						</div>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

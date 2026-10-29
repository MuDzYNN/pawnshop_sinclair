"use client";

import { Row } from "@/app/dashboard/buyback/buyback-summary";
import { formatBonus } from "@/app/dashboard/buyback/totals";
import type { BuybacksData } from "@/app/dashboard/buybacks/data";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { formatDateTime, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type Buyback = BuybacksData["buybacks"][number];

export function BuybackDetails({
	buyback,
	onClose,
}: {
	buyback: Buyback | null;
	onClose: () => void;
}) {
	return (
		<Sheet open={!!buyback} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-md">
				{buyback && (
					<>
						<SheetHeader>
							<SheetTitle className="font-mono">
								{buyback.number}
							</SheetTitle>
							<SheetDescription>
								{formatDateTime(buyback.createdAt)} ·{" "}
								{buyback.employee.name}
							</SheetDescription>
						</SheetHeader>
						<div className="flex flex-col gap-4 px-4 pb-4">
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
									{buyback.lines.map((line) => (
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
												{formatPrice(line.buyPrice)}
											</td>
											<td className="pl-2 text-right whitespace-nowrap tabular-nums">
												{formatPrice(
													line.buyPrice *
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
									label="Wartość skupu"
									value={formatPrice(buyback.subtotal)}
								/>
								{buyback.bonus > 0 && (
									<Row
										label={`Bonus (${formatBonus(buyback.bonusPercent, buyback.bonusAmount, formatPrice)})`}
										value={`+ ${formatPrice(buyback.bonus)}`}
									/>
								)}
								<Row
									label="Wypłacono klientowi"
									value={formatPrice(buyback.payout)}
									className="py-1 text-base font-semibold"
								/>
								<Row
									label="Wartość sprzedaży"
									value={formatPrice(buyback.saleValue)}
									className="text-muted-foreground"
								/>
								<Row
									label="Zysk lombardu"
									value={formatPrice(buyback.profit)}
									className={cn(
										"font-medium",
										buyback.profit < 0 &&
											"text-destructive",
										buyback.profit > 0 &&
											"text-emerald-500",
									)}
								/>
							</div>
						</div>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

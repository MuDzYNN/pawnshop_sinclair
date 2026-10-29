"use client";

import { CheckIcon, TrashIcon, XIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { Row } from "@/app/dashboard/buyback/buyback-summary";
import { InventoryImport } from "@/app/dashboard/buyback/inventory-import";
import { ItemPicker, useQuantities } from "@/app/dashboard/buyback/item-picker";
import { calculateTotals } from "@/app/dashboard/buyback/totals";
import type { ItemsData } from "@/app/dashboard/items/data";
import { completeSale } from "@/app/dashboard/sale/actions";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { errorMessages } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { keys, revalidateSales } from "@/lib/swr";

export function SaleView({ fallback }: { fallback: ItemsData }) {
	const { data = fallback } = useSWR<ItemsData>(keys.items, {
		fallbackData: fallback,
	});
	const { quantities, setQuantity, addQuantities, clear } = useQuantities();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pending, startTransition] = useTransition();

	const lines = data.items
		.filter((item) => quantities[item.id])
		.map((item) => ({ ...item, quantity: quantities[item.id] }));
	const { saleValue, pieces } = calculateTotals(lines, {
		percent: 0,
		amount: 0,
	});

	function complete() {
		setConfirmOpen(false);
		startTransition(async () => {
			const result = await completeSale({
				lines: lines.map((line) => ({
					itemId: line.id,
					quantity: line.quantity,
				})),
				value: saleValue,
			});
			if (result.error) {
				toast.error(errorMessages[result.error]);
				if (result.error === "PRICES_CHANGED") mutate(keys.items);
				return;
			}
			toast.success(`Zapisano sprzedaż ${result.number}`);
			revalidateSales();
			clear();
		});
	}

	return (
		<div className="grid items-start gap-6 p-4 lg:grid-cols-[1fr_26rem] lg:p-6">
			<ItemPicker
				title="Sprzedaż do PostOP"
				description="Wybierz przedmioty z magazynu, które idą do PostOP."
				items={data.items}
				quantities={quantities}
				onChange={setQuantity}
				priceLabel="Cena sprzedaży"
				price={(item) => item.sellPrice}
			/>
			<div className="flex flex-col gap-4">
				<div>
					<h2 className="text-xl font-semibold">Podsumowanie</h2>
					<p className="text-sm text-muted-foreground">
						Upewnij się, że wprowadzone dane są poprawne!
					</p>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Sprzedaż</CardTitle>
						<CardAction>
							<Button
								variant="destructive"
								size="icon-sm"
								disabled={!lines.length}
								onClick={clear}
							>
								<TrashIcon />
								<span className="sr-only">Wyczyść</span>
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>
						{lines.length ? (
							<table className="w-full text-sm">
								<thead className="text-left text-muted-foreground">
									<tr className="[&>th]:pb-2 [&>th]:font-medium">
										<th>Przedmiot</th>
										<th className="text-right">Ilość</th>
										<th className="text-right">
											Cena jedn.
										</th>
										<th className="text-right">Razem</th>
										<th className="w-0" />
									</tr>
								</thead>
								<tbody>
									{lines.map((line) => (
										<tr
											key={line.id}
											className="border-t [&>td]:py-1"
										>
											<td>
												{line.name}
												{line.note && (
													<span className="ml-2 text-xs font-normal text-muted-foreground">
														{line.note}
													</span>
												)}
											</td>
											<td className="pl-2 text-right whitespace-nowrap tabular-nums">
												x{line.quantity}
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
											<td className="pl-1">
												<Button
													variant="ghost"
													size="icon-xs"
													onClick={() =>
														setQuantity(line.id, 0)
													}
												>
													<XIcon />
													<span className="sr-only">
														Usuń {line.name}
													</span>
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						) : (
							<p className="py-6 text-center text-muted-foreground">
								Dodaj przedmioty z listy.
							</p>
						)}
					</CardContent>
					<CardFooter className="flex-col items-stretch gap-1 tabular-nums">
						<Row label="Liczba sztuk" value={String(pieces)} />
						<Row
							label="Do otrzymania od PostOP"
							value={formatPrice(saleValue)}
							className="py-1 text-lg font-semibold"
						/>
						<Button
							className="mt-2"
							disabled={!lines.length || pending}
							onClick={() => setConfirmOpen(true)}
						>
							<CheckIcon />
							Zapisz sprzedaż
						</Button>
					</CardFooter>
				</Card>
				<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								Zapisać sprzedaż za {formatPrice(saleValue)}?
							</AlertDialogTitle>
							<AlertDialogDescription>
								Sprzedaż trafi na listę jako oczekująca, dopóki
								PostOP jej nie rozliczy.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Anuluj</AlertDialogCancel>
							<AlertDialogAction onClick={complete}>
								Zapisz
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
				<InventoryImport data={data} onImport={addQuantities} />
			</div>
		</div>
	);
}

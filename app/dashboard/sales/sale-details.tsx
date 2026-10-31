"use client";

import {
	CheckIcon,
	CopyIcon,
	PencilIcon,
	Trash2Icon,
	Undo2Icon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Row } from "@/app/dashboard/buyback/buyback-summary";
import { deleteSale, setSaleSettled } from "@/app/dashboard/sale/actions";
import { purchaseList } from "@/app/dashboard/sales/copy";
import type { SalesData } from "@/app/dashboard/sales/data";
import { SaleEditDialog } from "@/app/dashboard/sales/sale-edit-dialog";
import { SaleStatus } from "@/app/dashboard/sales/sale-status";
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

type Props = {
	sale: Sale | null;
	canSettle: boolean;
	canManage: boolean;
	onClose: () => void;
};

export function SaleDetails({ sale, canSettle, canManage, onClose }: Props) {
	const [pending, startTransition] = useTransition();
	const [editing, setEditing] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);

	async function copy() {
		if (!sale) return;
		try {
			await navigator.clipboard.writeText(purchaseList(sale.lines));
			toast.success("Skopiowano listę przedmiotów");
		} catch {
			toast.error("Nie udało się skopiować do schowka");
		}
	}

	function remove() {
		if (!sale) return;
		setConfirmDelete(false);
		startTransition(async () => {
			const result = await deleteSale(sale.id);
			if (result.error) {
				toast.error(errorMessages[result.error]);
				return;
			}
			toast.success(`Usunięto sprzedaż ${sale.number}`);
			onClose();
			await revalidateSales();
		});
	}

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
							<Button variant="outline" onClick={copy}>
								<CopyIcon />
								Kopiuj listę przedmiotów
							</Button>
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
							{canManage && (
								<div className="flex flex-col gap-2">
									<div className="grid grid-cols-2 gap-2">
										<Button
											variant="outline"
											disabled={
												pending ||
												sale.status !== "PENDING"
											}
											onClick={() => setEditing(true)}
										>
											<PencilIcon />
											Edytuj
										</Button>
										<Button
											variant="destructive"
											disabled={pending}
											onClick={() =>
												setConfirmDelete(true)
											}
										>
											<Trash2Icon />
											Usuń sprzedaż
										</Button>
									</div>
									{sale.status !== "PENDING" && (
										<p className="text-xs text-muted-foreground">
											Żeby edytować rozliczoną
											sprzedaż, najpierw cofnij
											rozliczenie.
										</p>
									)}
								</div>
							)}
						</div>
						<SaleEditDialog
							sale={sale}
							open={editing}
							onOpenChange={setEditing}
						/>
						<AlertDialog
							open={confirmDelete}
							onOpenChange={setConfirmDelete}
						>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Usunąć sprzedaż {sale.number}?
									</AlertDialogTitle>
									<AlertDialogDescription>
										Sprzedaż za{" "}
										{formatPrice(sale.value)} zniknie
										razem ze wszystkimi przedmiotami.
										Tego nie da się cofnąć, zostanie
										tylko wpis w logach.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>
										Anuluj
									</AlertDialogCancel>
									<AlertDialogAction
										variant="destructive"
										onClick={remove}
									>
										Usuń
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

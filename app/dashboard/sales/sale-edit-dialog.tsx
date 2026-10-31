"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { Row } from "@/app/dashboard/buyback/buyback-summary";
import type { ItemsData } from "@/app/dashboard/items/data";
import { updateSale } from "@/app/dashboard/sale/actions";
import type { SalesData } from "@/app/dashboard/sales/data";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { errorMessages } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { keys, revalidateSales } from "@/lib/swr";

type Sale = SalesData["sales"][number];

const MAX_QUANTITY = 9999;

// Either a line already in the sale or an item newly added from the price list
type EditLine = {
	key: string;
	lineId?: string;
	itemId: string | null;
	name: string;
	note: string;
	sellPrice: number;
	quantity: number;
};

type Props = { sale: Sale; open: boolean; onOpenChange: (open: boolean) => void };

export function SaleEditDialog({ sale, open, onOpenChange }: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl">
				{/* Mounted on open, so every edit starts from the saved sale */}
				{open && (
					<EditForm sale={sale} onDone={() => onOpenChange(false)} />
				)}
			</DialogContent>
		</Dialog>
	);
}

function EditForm({ sale, onDone }: { sale: Sale; onDone: () => void }) {
	const { data } = useSWR<ItemsData>(keys.items);
	const [lines, setLines] = useState<EditLine[]>(() =>
		sale.lines.map((line) => ({ ...line, key: line.id, lineId: line.id })),
	);
	const [selected, setSelected] = useState("");
	const [pending, startTransition] = useTransition();

	const used = new Set(lines.map((line) => line.itemId));
	const available = data?.items.filter((item) => !used.has(item.id)) ?? [];
	const value = lines.reduce(
		(sum, line) => sum + line.sellPrice * line.quantity,
		0,
	);
	const pieces = lines.reduce((sum, line) => sum + line.quantity, 0);
	const valid = lines.length > 0 && lines.every((line) => line.quantity > 0);

	function setQuantity(key: string, quantity: number) {
		const clamped = Math.min(
			Math.max(Math.trunc(quantity) || 0, 0),
			MAX_QUANTITY,
		);
		setLines((current) =>
			current.map((line) =>
				line.key === key ? { ...line, quantity: clamped } : line,
			),
		);
	}

	function add() {
		const item = available.find((item) => item.id === selected);
		if (!item) return;
		setLines((current) => [
			...current,
			{
				key: `new-${item.id}`,
				itemId: item.id,
				name: item.name,
				note: item.note,
				sellPrice: item.sellPrice,
				quantity: 1,
			},
		]);
		setSelected("");
	}

	function save() {
		startTransition(async () => {
			const result = await updateSale(sale.id, {
				lines: lines.map((line) =>
					line.lineId
						? { lineId: line.lineId, quantity: line.quantity }
						: { itemId: line.itemId!, quantity: line.quantity },
				),
				value,
			});
			if (result.error) {
				toast.error(errorMessages[result.error]);
				if (result.error === "PRICES_CHANGED") mutate(keys.items);
				return;
			}
			toast.success(`Zapisano zmiany w sprzedaży ${sale.number}`);
			await revalidateSales();
			onDone();
		});
	}

	return (
		<>
			<DialogHeader>
				<DialogTitle>
					Edycja sprzedaży{" "}
					<span className="font-mono">{sale.number}</span>
				</DialogTitle>
				<DialogDescription>
					Zmień ilości, usuń albo dopisz przedmioty. Dopisane liczą się
					po aktualnej cenie z cennika, reszta zostaje po cenie z dnia
					sprzedaży.
				</DialogDescription>
			</DialogHeader>
			<table className="w-full text-sm">
				<thead className="text-left text-muted-foreground">
					<tr className="[&>th]:pb-2 [&>th]:font-medium">
						<th>Przedmiot</th>
						<th className="text-right">Ilość</th>
						<th className="text-right">Cena jedn.</th>
						<th className="text-right">Razem</th>
						<th className="w-0" />
					</tr>
				</thead>
				<tbody>
					{lines.map((line) => (
						<tr key={line.key} className="border-t [&>td]:py-1">
							<td>
								{line.name}
								{line.note && (
									<span className="ml-2 text-xs font-normal text-muted-foreground">
										{line.note}
									</span>
								)}
								{!line.lineId && (
									<span className="ml-2 text-xs font-normal text-emerald-600 dark:text-emerald-400">
										nowy
									</span>
								)}
							</td>
							<td className="pl-2 text-right">
								<Input
									aria-label={`Ilość: ${line.name}`}
									type="number"
									min={1}
									max={MAX_QUANTITY}
									inputMode="numeric"
									aria-invalid={!line.quantity}
									className="ml-auto h-7 w-16 [appearance:textfield] text-center tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
									value={line.quantity}
									onFocus={(e) => e.target.select()}
									onChange={(e) =>
										setQuantity(line.key, Number(e.target.value))
									}
								/>
							</td>
							<td className="pl-2 text-right whitespace-nowrap tabular-nums">
								{formatPrice(line.sellPrice)}
							</td>
							<td className="pl-2 text-right whitespace-nowrap tabular-nums">
								{formatPrice(line.sellPrice * line.quantity)}
							</td>
							<td className="pl-1">
								<Button
									variant="ghost"
									size="icon-xs"
									onClick={() =>
										setLines((current) =>
											current.filter((l) => l.key !== line.key),
										)
									}
								>
									<XIcon />
									<span className="sr-only">Usuń {line.name}</span>
								</Button>
							</td>
						</tr>
					))}
					{!lines.length && (
						<tr>
							<td
								colSpan={5}
								className="py-6 text-center text-muted-foreground"
							>
								Sprzedaż musi mieć przynajmniej jeden przedmiot. Żeby
								ją skasować, użyj „Usuń sprzedaż”.
							</td>
						</tr>
					)}
				</tbody>
			</table>
			<div className="flex gap-2">
				<NativeSelect
					className="flex-1"
					aria-label="Przedmiot do dopisania"
					value={selected}
					disabled={!data}
					onChange={(e) => setSelected(e.target.value)}
				>
					<NativeSelectOption value="">
						{data ? "Dopisz przedmiot z cennika…" : "Ładowanie cennika…"}
					</NativeSelectOption>
					{available.map((item) => (
						<NativeSelectOption key={item.id} value={item.id}>
							{item.name}
							{item.note ? ` (${item.note})` : ""} ·{" "}
							{formatPrice(item.sellPrice)}
						</NativeSelectOption>
					))}
				</NativeSelect>
				<Button variant="outline" disabled={!selected} onClick={add}>
					<PlusIcon />
					Dopisz
				</Button>
			</div>
			<div className="flex flex-col gap-1 tabular-nums">
				<Row label="Liczba sztuk" value={String(pieces)} />
				<Row
					label="Do otrzymania od PostOP"
					value={formatPrice(value)}
					className="py-1 text-base font-semibold"
				/>
			</div>
			<DialogFooter>
				<Button variant="outline" onClick={onDone}>
					Anuluj
				</Button>
				<Button disabled={!valid || pending} onClick={save}>
					Zapisz zmiany
				</Button>
			</DialogFooter>
		</>
	);
}

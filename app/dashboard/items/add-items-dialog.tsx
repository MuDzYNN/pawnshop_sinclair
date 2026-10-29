"use client";

import { FileUpIcon, PlusIcon, XIcon } from "lucide-react";
import {
	useRef,
	useState,
	useTransition,
	type ChangeEvent,
	type ClipboardEvent,
	type ReactElement,
} from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import {
	saveItems,
	type BulkState,
	type ItemInput,
} from "@/app/dashboard/items/actions";
import { parseItems, readCsv } from "@/app/dashboard/items/csv";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { errorMessages } from "@/lib/errors";
import { keys } from "@/lib/swr";

type Row = ItemInput & {
	key: string;
	errors?: NonNullable<BulkState["rowErrors"]>[number];
};

const emptyRow = (): Row => ({
	key: crypto.randomUUID(),
	name: "",
	note: "",
	buyPrice: "",
	sellPrice: "",
});
const isFilled = (row: ItemInput) =>
	!!(row.name.trim() || row.note.trim() || row.buyPrice || row.sellPrice);
const itemKey = (item: { name: string; note: string }) => `${item.name.trim()}
${item.note.trim()}`;

type Props = {
	trigger: ReactElement;
	existing: { name: string; note: string }[];
	canRestrict: boolean;
};

export function AddItemsDialog({ trigger, existing, canRestrict }: Props) {
	const [open, setOpen] = useState(false);
	const [restricted, setRestricted] = useState(false);
	const [rows, setRows] = useState<Row[]>(() => [emptyRow()]);
	const [error, setError] = useState<BulkState["error"]>();
	const [pending, startTransition] = useTransition();
	const fileInput = useRef<HTMLInputElement>(null);

	const filled = rows.filter(isFilled);
	const existingKeys = new Set(existing.map(itemKey));

	function update(key: string, field: keyof ItemInput, value: string) {
		setRows((current) =>
			current.map((row) =>
				row.key === key ? { ...row, [field]: value } : row,
			),
		);
	}

	function remove(key: string) {
		setRows((current) =>
			current.length > 1
				? current.filter((row) => row.key !== key)
				: [emptyRow()],
		);
	}

	// Imported rows replace the empty ones
	function append(items: ItemInput[]) {
		if (!items.length) {
			toast.error("Nie znaleziono żadnych przedmiotów");
			return;
		}
		setRows((current) => [
			...current.filter(isFilled),
			...items.map((item) => ({ ...item, key: crypto.randomUUID() })),
		]);
		toast.success(`Wczytano: ${items.length}`);
	}

	async function importFile(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (file) append(parseItems(await readCsv(file)));
	}

	// Cells copied from Excel arrive as tab separated text
	function paste(event: ClipboardEvent<HTMLInputElement>) {
		const text = event.clipboardData.getData("text");
		if (!/[\t\n]/.test(text.trim())) return;
		event.preventDefault();
		append(parseItems(text));
	}

	function submit() {
		const submitted = filled.map((row) => ({ ...row, errors: undefined }));
		setRows(submitted.length ? submitted : [emptyRow()]);
		setError(undefined);

		startTransition(async () => {
			const result = await saveItems(
				submitted.map(({ name, note, buyPrice, sellPrice }) => ({
					name,
					note,
					buyPrice,
					sellPrice,
				})),
				restricted,
			);
			if (result.ok) {
				const parts = [
					result.created && `dodano ${result.created}`,
					result.updated && `zaktualizowano ${result.updated}`,
				];
				toast.success(
					`Zapisano cennik: ${parts.filter(Boolean).join(", ")}`,
				);
				mutate(keys.items);
				setRows([emptyRow()]);
				setOpen(false);
				return;
			}
			setError(result.error);
			setRows(
				submitted.map((row, index) => ({
					...row,
					errors: result.rowErrors?.[index],
				})),
			);
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={trigger} />
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Dodaj przedmioty</DialogTitle>
					<DialogDescription>
						Ceny w pełnych dolarach. Możesz wkleić komórki z Excela
						albo wczytać plik CSV z kolumnami: nazwa, cena skupu,
						cena sprzedaży, notatka. Przedmioty, które są już w
						cenniku (ta sama nazwa i notatka), dostaną nowe ceny.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<div className="grid grid-cols-[1fr_1fr_8rem_8rem_2rem] gap-2 px-px text-sm font-medium">
						<span>Nazwa</span>
						<span>Notatka</span>
						<span>Cena skupu ($)</span>
						<span>Cena sprzedaży ($)</span>
					</div>
					<div className="-mx-1 flex max-h-[50vh] flex-col gap-2 overflow-y-auto px-1 py-px">
						{rows.map((row) => {
							const messages = Object.values(
								row.errors ?? {},
							).map((code) => errorMessages[code]);
							const exists = existingKeys.has(itemKey(row));
							return (
								<div
									key={row.key}
									className="flex flex-col gap-1"
								>
									<div className="grid grid-cols-[1fr_1fr_8rem_8rem_2rem] items-center gap-2">
										<Input
											aria-label="Nazwa"
											value={row.name}
											onChange={(e) =>
												update(
													row.key,
													"name",
													e.target.value,
												)
											}
											onPaste={paste}
											aria-invalid={!!row.errors?.name}
										/>
										<Input
											aria-label="Notatka"
											placeholder="Opcjonalnie"
											value={row.note}
											onChange={(e) =>
												update(
													row.key,
													"note",
													e.target.value,
												)
											}
											onPaste={paste}
											aria-invalid={!!row.errors?.note}
										/>
										<Input
											aria-label="Cena skupu"
											type="number"
											min={0}
											step={1}
											inputMode="numeric"
											value={row.buyPrice}
											onChange={(e) =>
												update(
													row.key,
													"buyPrice",
													e.target.value,
												)
											}
											aria-invalid={
												!!row.errors?.buyPrice
											}
										/>
										<Input
											aria-label="Cena sprzedaży"
											type="number"
											min={0}
											step={1}
											inputMode="numeric"
											value={row.sellPrice}
											onChange={(e) =>
												update(
													row.key,
													"sellPrice",
													e.target.value,
												)
											}
											aria-invalid={
												!!row.errors?.sellPrice
											}
										/>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => remove(row.key)}
										>
											<XIcon />
											<span className="sr-only">
												Usuń wiersz
											</span>
										</Button>
									</div>
									{messages.length > 0 ? (
										<p className="text-xs text-destructive">
											{[...new Set(messages)].join(" · ")}
										</p>
									) : (
										exists && (
											<p className="text-xs text-muted-foreground">
												Jest już w cenniku, ceny zostaną
												nadpisane
											</p>
										)
									)}
								</div>
							);
						})}
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								setRows((current) => [...current, emptyRow()])
							}
						>
							<PlusIcon />
							Dodaj wiersz
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => fileInput.current?.click()}
						>
							<FileUpIcon />
							Wczytaj CSV
						</Button>
						<input
							ref={fileInput}
							type="file"
							accept=".csv,text/csv"
							hidden
							onChange={importFile}
						/>
						{canRestrict && (
							<label className="ml-auto flex items-center gap-2 text-sm">
								<Checkbox
									checked={restricted}
									onCheckedChange={setRestricted}
								/>
								Nowe jako zakazane
							</label>
						)}
					</div>
				</div>
				{error && (
					<p className="text-sm text-destructive">
						{errorMessages[error]}
					</p>
				)}
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Anuluj
					</DialogClose>
					<Button
						onClick={submit}
						disabled={pending || !filled.length}
					>
						Zapisz{filled.length > 1 && ` (${filled.length})`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

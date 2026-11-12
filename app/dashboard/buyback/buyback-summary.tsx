"use client";

import { CheckIcon, TrashIcon, XIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { completeBuyback } from "@/app/dashboard/buyback/actions";
import {
	calculateTotals,
	formatBonus,
	type Bonus,
} from "@/app/dashboard/buyback/totals";
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
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
	ComboboxValue,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { errorMessages } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { keys, revalidateBuybacks, revalidateClients } from "@/lib/swr";
import { cn } from "@/lib/utils";

export type Line = {
	id: string;
	name: string;
	note: string;
	buyPrice: number;
	sellPrice: number;
	quantity: number;
};

type Client = { id: string; name: string; balance: number };

type Props = {
	lines: Line[];
	// Undefined for employees who can't pick a client
	clients?: Client[];
	onRemove: (id: string) => void;
	onClear: () => void;
};

export function BuybackSummary({ lines, clients, onRemove, onClear }: Props) {
	const [percentInput, setPercentInput] = useState("");
	const [amountInput, setAmountInput] = useState("");
	const [clientId, setClientId] = useState("");
	const [totalInput, setTotalInput] = useState("");

	const bonusInfo: Bonus = {
		percent: Math.min(Math.max(toNumber(percentInput), 0), 100),
		amount: Math.min(
			Math.max(Math.trunc(toNumber(amountInput)), 0),
			100_000_000,
		),
	};
	const { subtotal, bonus, payout, profit } = calculateTotals(
		lines,
		bonusInfo,
	);
	const client = clients?.find((client) => client.id === clientId);
	// Whatever the client gets above the payout comes from their balance
	const balancePayout = client
		? Math.max(Math.trunc(toNumber(totalInput)) - payout, 0)
		: 0;
	const overdrawn = !!client && balancePayout > client.balance;
	const total = payout + balancePayout;
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pending, startTransition] = useTransition();

	function clear() {
		onClear();
		setPercentInput("");
		setAmountInput("");
		setClientId("");
		setTotalInput("");
	}

	function complete() {
		setConfirmOpen(false);
		startTransition(async () => {
			const result = await completeBuyback({
				lines: lines.map((line) => ({
					itemId: line.id,
					quantity: line.quantity,
				})),
				bonus: bonusInfo,
				payout,
				client:
					client && balancePayout
						? { id: client.id, amount: balancePayout }
						: undefined,
			});
			if (result.error) {
				toast.error(errorMessages[result.error]);
				if (result.error === "PRICES_CHANGED") mutate(keys.items);
				if (
					result.error === "BALANCE_TOO_LOW" ||
					result.error === "CLIENT_NOT_FOUND"
				)
					revalidateClients();
				return;
			}
			toast.success(`Zapisano transakcję ${result.number}`);
			revalidateBuybacks();
			if (balancePayout) revalidateClients();
			if (result.webhookFailed) {
				toast.warning("Nie udało się wysłać rozliczenia na Discord");
			}
			clear();
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Transakcja</CardTitle>
				<CardAction>
					<Button
						variant="destructive"
						size="icon-sm"
						disabled={!lines.length}
						onClick={clear}
					>
						<TrashIcon />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{lines.length ? (
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
										{formatPrice(line.buyPrice)}
									</td>
									<td className="pl-2 text-right whitespace-nowrap tabular-nums">
										{formatPrice(
											line.buyPrice * line.quantity,
										)}
									</td>
									<td className="pl-1">
										<Button
											variant="ghost"
											size="icon-xs"
											onClick={() => onRemove(line.id)}
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
				<Field orientation="horizontal" className="justify-between">
					<FieldLabel htmlFor="bonus">Bonus dla klienta</FieldLabel>
					<div className="flex items-center gap-2">
						<InputGroup className="w-24">
							<InputGroupInput
								id="bonus"
								aria-label="Bonus procentowy"
								inputMode="decimal"
								placeholder="0"
								className="text-right tabular-nums"
								value={percentInput}
								onChange={(e) =>
									setPercentInput(e.target.value)
								}
							/>
							<InputGroupAddon align="inline-end">
								%
							</InputGroupAddon>
						</InputGroup>
						<span className="text-muted-foreground">+</span>
						<InputGroup className="w-28">
							<InputGroupInput
								aria-label="Bonus kwotowy"
								inputMode="numeric"
								placeholder="0"
								className="text-right tabular-nums"
								value={amountInput}
								onChange={(e) => setAmountInput(e.target.value)}
							/>
							<InputGroupAddon align="inline-end">
								$
							</InputGroupAddon>
						</InputGroup>
					</div>
				</Field>
				{clients && (
					<Field orientation="horizontal" className="justify-between">
						<FieldLabel htmlFor="client">Klient</FieldLabel>
						<div className="flex items-center gap-1">
							{client && (
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => setClientId("")}
								>
									<XIcon />
									<span className="sr-only">Bez klienta</span>
								</Button>
							)}
							<Combobox
								items={clients}
								value={client ?? null}
								onValueChange={(client) =>
									setClientId(client?.id ?? "")
								}
								itemToStringLabel={(client) => client.name}
								isItemEqualToValue={(a, b) => a.id === b.id}
							>
								<ComboboxTrigger
									id="client"
									render={
										<Button
											variant="outline"
											className="w-56 justify-between font-normal"
										/>
									}
								>
									<ComboboxValue placeholder="Bez klienta" />
								</ComboboxTrigger>
								<ComboboxContent>
									<ComboboxInput
										showTrigger={false}
										placeholder="Wyszukaj..."
									/>
									<ComboboxEmpty>Nie znaleziono klienta</ComboboxEmpty>
									<ComboboxList>
										{(client: Client) => (
											<ComboboxItem key={client.id} value={client}>
												<span className="flex-1 truncate">
													{client.name}
												</span>
												<span className="text-muted-foreground tabular-nums">
													{formatPrice(client.balance)}
												</span>
											</ComboboxItem>
										)}
									</ComboboxList>
								</ComboboxContent>
							</Combobox>
						</div>
					</Field>
				)}
				{client && (
					<Field
						orientation="horizontal"
						className="justify-between"
						data-invalid={overdrawn}
					>
						<FieldLabel htmlFor="total">Wypłać łącznie</FieldLabel>
						<InputGroup className="w-36">
							<InputGroupInput
								id="total"
								inputMode="numeric"
								placeholder={String(payout)}
								className="text-right tabular-nums"
								aria-invalid={overdrawn}
								value={totalInput}
								onChange={(e) => setTotalInput(e.target.value)}
							/>
							<InputGroupAddon align="inline-end">
								$
							</InputGroupAddon>
						</InputGroup>
					</Field>
				)}
			</CardContent>
			<CardFooter className="flex-col items-stretch gap-1 tabular-nums">
				<Row label="Wartość skupu" value={formatPrice(subtotal)} />
				{bonus > 0 && (
					<Row
						label={`Bonus (${formatBonus(bonusInfo.percent, bonusInfo.amount, formatPrice)})`}
						value={`+ ${formatPrice(bonus)}`}
					/>
				)}
				{client && balancePayout > 0 && (
					<Row
						label={`Z salda klienta (ma ${formatPrice(client.balance)})`}
						value={`+ ${formatPrice(balancePayout)}`}
						className={cn(overdrawn && "text-destructive")}
					/>
				)}
				<Row
					label="Profit lombardu"
					value={formatPrice(profit)}
					className={cn(
						"font-medium",
						profit < 0 && "text-destructive",
						profit > 0 && "text-emerald-500",
					)}
				/>
				<Row
					label="Do wypłaty klientowi"
					value={formatPrice(total)}
					className="py-1 text-lg font-semibold"
				/>
				<Button
					className="mt-2"
					disabled={!lines.length || overdrawn || pending}
					onClick={() => setConfirmOpen(true)}
				>
					<CheckIcon />
					Zatwierdź transakcję
				</Button>
			</CardFooter>
			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Zatwierdzić skup za {formatPrice(total)}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Transakcja zostanie zapisana i wysłana na Discord.
							{client &&
								balancePayout > 0 &&
								` Z salda klienta ${client.name} zejdzie ${formatPrice(balancePayout)}.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Anuluj</AlertDialogCancel>
						<AlertDialogAction onClick={complete}>
							Zatwierdź
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
}

export function Row({
	label,
	value,
	className,
}: {
	label: string;
	value: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex items-baseline justify-between gap-4",
				className,
			)}
		>
			<span>{label}</span>
			<span>{value}</span>
		</div>
	);
}

function toNumber(input: string) {
	return Number(input.replace(",", ".")) || 0;
}

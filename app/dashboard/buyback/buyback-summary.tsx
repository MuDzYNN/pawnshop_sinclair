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
import { Field, FieldLabel } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { errorMessages } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { keys, revalidateBuybacks } from "@/lib/swr";
import { cn } from "@/lib/utils";

export type Line = {
	id: string;
	name: string;
	note: string;
	buyPrice: number;
	sellPrice: number;
	quantity: number;
};

type Props = {
	lines: Line[];
	onRemove: (id: string) => void;
	onClear: () => void;
};

export function BuybackSummary({ lines, onRemove, onClear }: Props) {
	const [percentInput, setPercentInput] = useState("");
	const [amountInput, setAmountInput] = useState("");

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
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pending, startTransition] = useTransition();

	function clear() {
		onClear();
		setPercentInput("");
		setAmountInput("");
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
			});
			if (result.error) {
				toast.error(errorMessages[result.error]);
				if (result.error === "PRICES_CHANGED") mutate(keys.items);
				return;
			}
			toast.success(`Zapisano transakcję ${result.number}`);
			revalidateBuybacks();
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
			</CardContent>
			<CardFooter className="flex-col items-stretch gap-1 tabular-nums">
				<Row label="Wartość skupu" value={formatPrice(subtotal)} />
				{bonus > 0 && (
					<Row
						label={`Bonus (${formatBonus(bonusInfo.percent, bonusInfo.amount, formatPrice)})`}
						value={`+ ${formatPrice(bonus)}`}
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
					value={formatPrice(payout)}
					className="py-1 text-lg font-semibold"
				/>
				<Button
					className="mt-2"
					disabled={!lines.length || pending}
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
							Zatwierdzić skup za {formatPrice(payout)}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Transakcja zostanie zapisana i wysłana na Discord.
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

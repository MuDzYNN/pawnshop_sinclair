"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Row } from "@/app/dashboard/buyback/buyback-summary";
import {
	adjustClient,
	depositClient,
	type FormState,
} from "@/app/dashboard/clients/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { errorMessages } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { revalidateClients } from "@/lib/swr";
import { cn } from "@/lib/utils";

export type BalanceMode = "deposit" | "adjust";

type Client = { id: string; name: string; balance: number };

type Props = {
	client: Client;
	mode: BalanceMode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function BalanceDialog({ client, mode, open, onOpenChange }: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{mode === "deposit" ? "Wpłata" : "Korekta salda"}:{" "}
						{client.name}
					</DialogTitle>
					<DialogDescription>
						Aktualne saldo: {formatPrice(client.balance)}
					</DialogDescription>
				</DialogHeader>
				{mode === "deposit" ? (
					<DepositForm
						client={client}
						onSaved={() => onOpenChange(false)}
					/>
				) : (
					<AdjustmentForm
						client={client}
						onSaved={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function useBalanceAction(
	save: (prev: FormState, formData: FormData) => Promise<FormState>,
	message: string,
	onSaved: () => void,
) {
	const [state, action, pending] = useActionState(
		async (prev: FormState, formData: FormData) => {
			const result = await save(prev, formData);
			if (result.ok) {
				toast.success(message);
				revalidateClients();
				onSaved();
			}
			return result;
		},
		{},
	);

	// No automatic form reset on validation errors
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		startTransition(() => action(formData));
	}

	return { state, submit, pending };
}

function DepositForm({
	client,
	onSaved,
}: {
	client: Client;
	onSaved: () => void;
}) {
	const { state, submit, pending } = useBalanceAction(
		depositClient,
		"Zapisano wpłatę",
		onSaved,
	);
	const [depositInput, setDepositInput] = useState("");
	const [percentInput, setPercentInput] = useState("");
	const errors = state.fieldErrors;

	const deposit = Math.max(Math.trunc(Number(depositInput)) || 0, 0);
	const percent = Math.min(Math.max(Number(percentInput) || 0, 0), 100);
	const commission = Math.round((deposit * percent) / 100);

	return (
		<form onSubmit={submit} className="flex flex-col gap-6">
			<input type="hidden" name="clientId" value={client.id} />
			<FieldGroup>
				<div className="grid grid-cols-[1fr_8rem] gap-4">
					<Field data-invalid={!!errors?.deposit}>
						<FieldLabel htmlFor="deposit">
							Przyniesiona gotówka
						</FieldLabel>
						<InputGroup>
							<InputGroupInput
								id="deposit"
								name="deposit"
								type="number"
								min={1}
								step={1}
								inputMode="numeric"
								className="tabular-nums"
								value={depositInput}
								onChange={(e) => setDepositInput(e.target.value)}
								aria-invalid={!!errors?.deposit}
								required
							/>
							<InputGroupAddon align="inline-end">$</InputGroupAddon>
						</InputGroup>
						<FieldError>
							{errors?.deposit && errorMessages[errors.deposit[0]]}
						</FieldError>
					</Field>
					<Field data-invalid={!!errors?.commissionPercent}>
						<FieldLabel htmlFor="commissionPercent">
							Prowizja
						</FieldLabel>
						<InputGroup>
							<InputGroupInput
								id="commissionPercent"
								name="commissionPercent"
								type="number"
								min={0}
								max={100}
								step="any"
								inputMode="decimal"
								placeholder="0"
								className="tabular-nums"
								value={percentInput}
								onChange={(e) => setPercentInput(e.target.value)}
								aria-invalid={!!errors?.commissionPercent}
							/>
							<InputGroupAddon align="inline-end">%</InputGroupAddon>
						</InputGroup>
						<FieldError>
							{errors?.commissionPercent &&
								errorMessages[errors.commissionPercent[0]]}
						</FieldError>
					</Field>
				</div>
			</FieldGroup>
			<div className="flex flex-col gap-1 text-sm tabular-nums">
				<Row
					label="Prowizja lombardu"
					value={formatPrice(commission)}
					className="text-emerald-500"
				/>
				<Row
					label="Na saldo klienta"
					value={`+ ${formatPrice(deposit - commission)}`}
				/>
				<Row
					label="Saldo po wpłacie"
					value={formatPrice(client.balance + deposit - commission)}
					className="py-1 text-base font-semibold"
				/>
			</div>
			{state.error && (
				<p className="text-sm text-destructive">
					{errorMessages[state.error]}
				</p>
			)}
			<DialogFooter>
				<DialogClose render={<Button variant="outline" />}>
					Anuluj
				</DialogClose>
				<Button type="submit" disabled={pending || !deposit}>
					Zapisz wpłatę
				</Button>
			</DialogFooter>
		</form>
	);
}

function AdjustmentForm({
	client,
	onSaved,
}: {
	client: Client;
	onSaved: () => void;
}) {
	const { state, submit, pending } = useBalanceAction(
		adjustClient,
		"Zapisano korektę salda",
		onSaved,
	);
	const [amountInput, setAmountInput] = useState("");
	const errors = state.fieldErrors;

	const amount = Math.trunc(Number(amountInput)) || 0;
	const after = client.balance + amount;

	return (
		<form onSubmit={submit} className="flex flex-col gap-6">
			<input type="hidden" name="clientId" value={client.id} />
			<FieldGroup>
				<Field data-invalid={!!errors?.amount}>
					<FieldLabel htmlFor="amount">Zmiana salda</FieldLabel>
					<InputGroup>
						<InputGroupInput
							id="amount"
							name="amount"
							type="number"
							step={1}
							inputMode="numeric"
							className="tabular-nums"
							value={amountInput}
							onChange={(e) => setAmountInput(e.target.value)}
							aria-invalid={!!errors?.amount}
							required
						/>
						<InputGroupAddon align="inline-end">$</InputGroupAddon>
					</InputGroup>
					<FieldDescription>
						Kwota ujemna zmniejsza saldo, np. -500
					</FieldDescription>
					<FieldError>
						{errors?.amount && errorMessages[errors.amount[0]]}
					</FieldError>
				</Field>
				<Field data-invalid={!!errors?.note}>
					<FieldLabel htmlFor="note">Powód</FieldLabel>
					<Input
						id="note"
						name="note"
						aria-invalid={!!errors?.note}
						required
					/>
					<FieldError>
						{errors?.note && errorMessages[errors.note[0]]}
					</FieldError>
				</Field>
			</FieldGroup>
			<Row
				label="Saldo po korekcie"
				value={formatPrice(after)}
				className={cn(
					"text-base font-semibold tabular-nums",
					after < 0 && "text-destructive",
				)}
			/>
			{state.error && (
				<p className="text-sm text-destructive">
					{errorMessages[state.error]}
				</p>
			)}
			<DialogFooter>
				<DialogClose render={<Button variant="outline" />}>
					Anuluj
				</DialogClose>
				<Button type="submit" disabled={pending || !amount || after < 0}>
					Zapisz korektę
				</Button>
			</DialogFooter>
		</form>
	);
}

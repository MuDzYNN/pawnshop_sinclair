"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { saveItem, type FormState } from "@/app/dashboard/items/actions";
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
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { errorMessages } from "@/lib/errors";
import { keys } from "@/lib/swr";

type Item = {
	id: string;
	name: string;
	note: string;
	buyPrice: number;
	sellPrice: number;
};

type Props = {
	item: Item;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ItemDialog({ item, open, onOpenChange }: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edytuj przedmiot</DialogTitle>
					<DialogDescription>
						Ceny w pełnych dolarach.
					</DialogDescription>
				</DialogHeader>
				<ItemForm item={item} onSaved={() => onOpenChange(false)} />
			</DialogContent>
		</Dialog>
	);
}

function ItemForm({ item, onSaved }: { item: Item; onSaved: () => void }) {
	const [state, action, pending] = useActionState(
		async (prev: FormState, formData: FormData) => {
			const result = await saveItem(prev, formData);
			if (result.ok) {
				toast.success("Zapisano przedmiot");
				mutate(keys.items);
				onSaved();
			}
			return result;
		},
		{},
	);
	const errors = state.fieldErrors;

	// No automatic form reset on validation errors
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		startTransition(() => action(formData));
	}

	return (
		<form onSubmit={submit} className="flex flex-col gap-6">
			<input type="hidden" name="id" value={item.id} />
			<FieldGroup>
				<Field data-invalid={!!errors?.name}>
					<FieldLabel htmlFor="name">Nazwa</FieldLabel>
					<Input
						id="name"
						name="name"
						defaultValue={item.name}
						aria-invalid={!!errors?.name}
						required
					/>
					<FieldError>
						{errors?.name && errorMessages[errors.name[0]]}
					</FieldError>
				</Field>
				<Field data-invalid={!!errors?.note}>
					<FieldLabel htmlFor="note">Notatka</FieldLabel>
					<Input
						id="note"
						name="note"
						defaultValue={item.note}
						placeholder="Np. czym różni się od przedmiotu o tej samej nazwie"
						aria-invalid={!!errors?.note}
					/>
					<FieldError>
						{errors?.note && errorMessages[errors.note[0]]}
					</FieldError>
				</Field>
				<div className="grid grid-cols-2 gap-4">
					<Field data-invalid={!!errors?.buyPrice}>
						<FieldLabel htmlFor="buyPrice">
							Cena skupu ($)
						</FieldLabel>
						<Input
							id="buyPrice"
							name="buyPrice"
							type="number"
							min={0}
							step={1}
							inputMode="numeric"
							defaultValue={item.buyPrice}
							aria-invalid={!!errors?.buyPrice}
							required
						/>
						<FieldError>
							{errors?.buyPrice &&
								errorMessages[errors.buyPrice[0]]}
						</FieldError>
					</Field>
					<Field data-invalid={!!errors?.sellPrice}>
						<FieldLabel htmlFor="sellPrice">
							Cena sprzedaży ($)
						</FieldLabel>
						<Input
							id="sellPrice"
							name="sellPrice"
							type="number"
							min={0}
							step={1}
							inputMode="numeric"
							defaultValue={item.sellPrice}
							aria-invalid={!!errors?.sellPrice}
							required
						/>
						<FieldError>
							{errors?.sellPrice &&
								errorMessages[errors.sellPrice[0]]}
						</FieldError>
					</Field>
				</div>
			</FieldGroup>
			{state.error && (
				<p className="text-sm text-destructive">
					{errorMessages[state.error]}
				</p>
			)}
			<DialogFooter>
				<DialogClose render={<Button variant="outline" />}>
					Anuluj
				</DialogClose>
				<Button type="submit" disabled={pending}>
					Zapisz
				</Button>
			</DialogFooter>
		</form>
	);
}

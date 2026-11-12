"use client";

import {
	startTransition,
	useActionState,
	useState,
	type FormEvent,
	type ReactElement,
} from "react";
import { toast } from "sonner";
import { saveClient, type FormState } from "@/app/dashboard/clients/actions";
import { Button } from "@/components/ui/button";
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
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { errorMessages } from "@/lib/errors";
import { revalidateClients } from "@/lib/swr";

type Client = { id: string; name: string; phone: string; notes: string };

type Props = {
	client?: Client;
	trigger?: ReactElement;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

export function ClientDialog({ client, trigger, open, onOpenChange }: Props) {
	const [internalOpen, setInternalOpen] = useState(false);
	const isOpen = open ?? internalOpen;
	const setOpen = onOpenChange ?? setInternalOpen;

	return (
		<Dialog open={isOpen} onOpenChange={setOpen}>
			{trigger && <DialogTrigger render={trigger} />}
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{client ? "Edytuj klienta" : "Nowy klient"}
					</DialogTitle>
					<DialogDescription>
						Saldo zmienia się tylko przez wpłaty, skupy i korekty.
					</DialogDescription>
				</DialogHeader>
				<ClientForm client={client} onSaved={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	);
}

function ClientForm({
	client,
	onSaved,
}: {
	client?: Client;
	onSaved: () => void;
}) {
	const [state, action, pending] = useActionState(
		async (prev: FormState, formData: FormData) => {
			const result = await saveClient(prev, formData);
			if (result.ok) {
				toast.success(client ? "Zapisano zmiany" : "Dodano klienta");
				revalidateClients();
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
			{client && <input type="hidden" name="id" value={client.id} />}
			<FieldGroup>
				<Field data-invalid={!!errors?.name}>
					<FieldLabel htmlFor="name">Imię i nazwisko</FieldLabel>
					<Input
						id="name"
						name="name"
						defaultValue={client?.name}
						aria-invalid={!!errors?.name}
						required
					/>
					<FieldError>
						{errors?.name && errorMessages[errors.name[0]]}
					</FieldError>
				</Field>
				<Field data-invalid={!!errors?.phone}>
					<FieldLabel htmlFor="phone">Numer telefonu</FieldLabel>
					<Input
						id="phone"
						name="phone"
						inputMode="tel"
						defaultValue={client?.phone}
						aria-invalid={!!errors?.phone}
					/>
					<FieldError>
						{errors?.phone && errorMessages[errors.phone[0]]}
					</FieldError>
				</Field>
				<Field data-invalid={!!errors?.notes}>
					<FieldLabel htmlFor="notes">Notatki</FieldLabel>
					<Textarea
						id="notes"
						name="notes"
						className="max-h-48 min-h-20"
						defaultValue={client?.notes}
						aria-invalid={!!errors?.notes}
					/>
					<FieldError>
						{errors?.notes && errorMessages[errors.notes[0]]}
					</FieldError>
				</Field>
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
					{client ? "Zapisz" : "Dodaj"}
				</Button>
			</DialogFooter>
		</form>
	);
}

"use client";

import {
	startTransition,
	useActionState,
	useState,
	type FormEvent,
	type ReactElement,
} from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import {
	saveEmployee,
	type FormState,
} from "@/app/dashboard/employees/actions";
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
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { errorMessages } from "@/lib/errors";
import { keys } from "@/lib/swr";

type Rank = { id: string; name: string };
type Employee = { id: string; discordId: string; name: string; rank: Rank };

type Props = {
	ranks: Rank[];
	employee?: Employee;
	trigger?: ReactElement;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

export function EmployeeDialog({
	ranks,
	employee,
	trigger,
	open,
	onOpenChange,
}: Props) {
	const [internalOpen, setInternalOpen] = useState(false);
	const isOpen = open ?? internalOpen;
	const setOpen = onOpenChange ?? setInternalOpen;

	return (
		<Dialog open={isOpen} onOpenChange={setOpen}>
			{trigger && <DialogTrigger render={trigger} />}
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{employee ? "Edytuj pracownika" : "Nowy pracownik"}
					</DialogTitle>
					<DialogDescription>
						Pracownik zaloguje się do panelu kontem Discord o
						podanym ID.
					</DialogDescription>
				</DialogHeader>
				<EmployeeForm
					ranks={ranks}
					employee={employee}
					onSaved={() => setOpen(false)}
				/>
			</DialogContent>
		</Dialog>
	);
}

function EmployeeForm({
	ranks,
	employee,
	onSaved,
}: {
	ranks: Rank[];
	employee?: Employee;
	onSaved: () => void;
}) {
	const [state, action, pending] = useActionState(
		async (prev: FormState, formData: FormData) => {
			const result = await saveEmployee(prev, formData);
			if (result.ok) {
				toast.success(
					employee ? "Zapisano zmiany" : "Dodano pracownika",
				);
				mutate(keys.employees);
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
			{employee && <input type="hidden" name="id" value={employee.id} />}
			<FieldGroup>
				<Field data-invalid={!!errors?.name}>
					<FieldLabel htmlFor="name">Imię i nazwisko</FieldLabel>
					<Input
						id="name"
						name="name"
						defaultValue={employee?.name}
						aria-invalid={!!errors?.name}
						required
					/>
					<FieldError>
						{errors?.name && errorMessages[errors.name[0]]}
					</FieldError>
				</Field>
				<Field data-invalid={!!errors?.discordId}>
					<FieldLabel htmlFor="discordId">Discord ID</FieldLabel>
					<Input
						id="discordId"
						name="discordId"
						inputMode="numeric"
						defaultValue={employee?.discordId}
						aria-invalid={!!errors?.discordId}
						required
					/>
					<FieldDescription>
						Discord → tryb dewelopera → PPM na profilu → Kopiuj ID
					</FieldDescription>
					<FieldError>
						{errors?.discordId &&
							errorMessages[errors.discordId[0]]}
					</FieldError>
				</Field>
				<Field data-invalid={!!errors?.rankId}>
					<FieldLabel>Ranga</FieldLabel>
					<Select
						name="rankId"
						items={ranks.map((rank) => ({
							value: rank.id,
							label: rank.name,
						}))}
						defaultValue={employee?.rank.id ?? null}
					>
						<SelectTrigger
							className="w-full"
							aria-invalid={!!errors?.rankId}
						>
							<SelectValue placeholder="Wybierz rangę" />
						</SelectTrigger>
						<SelectContent>
							{ranks.map((rank) => (
								<SelectItem key={rank.id} value={rank.id}>
									{rank.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FieldError>
						{errors?.rankId && errorMessages[errors.rankId[0]]}
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
					{employee ? "Zapisz" : "Dodaj"}
				</Button>
			</DialogFooter>
		</form>
	);
}

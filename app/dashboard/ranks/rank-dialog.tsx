"use client";

import {
	startTransition,
	useActionState,
	useState,
	type FormEvent,
	type ReactElement,
} from "react";
import { toast } from "sonner";
import type { Permission } from "@/app/generated/prisma/browser";
import { saveRank, type FormState } from "@/app/dashboard/ranks/actions";
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
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { errorMessages } from "@/lib/errors";
import { permissions } from "@/lib/permissions";
import { revalidateRanks } from "@/lib/swr";

type Rank = { id: string; name: string; permissions: Permission[] };

type Props = {
	rank?: Rank;
	trigger?: ReactElement;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

export function RankDialog({ rank, trigger, open, onOpenChange }: Props) {
	const [internalOpen, setInternalOpen] = useState(false);
	const isOpen = open ?? internalOpen;
	const setOpen = onOpenChange ?? setInternalOpen;

	return (
		<Dialog open={isOpen} onOpenChange={setOpen}>
			{trigger && <DialogTrigger render={trigger} />}
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{rank ? "Edytuj rangę" : "Nowa ranga"}
					</DialogTitle>
					<DialogDescription>
						{rank
							? "Zmiany uprawnień obowiązują od razu."
							: "Nowa ranga trafia na koniec hierarchii."}
					</DialogDescription>
				</DialogHeader>
				<RankForm rank={rank} onSaved={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	);
}

function RankForm({ rank, onSaved }: { rank?: Rank; onSaved: () => void }) {
	const [state, action, pending] = useActionState(
		async (prev: FormState, formData: FormData) => {
			const result = await saveRank(prev, formData);
			if (result.ok) {
				toast.success(rank ? "Zapisano rangę" : "Dodano rangę");
				revalidateRanks();
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
			{rank && <input type="hidden" name="id" value={rank.id} />}
			<FieldGroup>
				<Field data-invalid={!!errors?.name}>
					<FieldLabel htmlFor="name">Nazwa</FieldLabel>
					<Input
						id="name"
						name="name"
						defaultValue={rank?.name}
						aria-invalid={!!errors?.name}
						required
					/>
					<FieldError>
						{errors?.name && errorMessages[errors.name[0]]}
					</FieldError>
				</Field>
				<FieldSet>
					<FieldLegend variant="label">Uprawnienia</FieldLegend>
					<FieldGroup className="gap-3">
						{permissions.map((permission) => (
							<Field
								key={permission.value}
								orientation="horizontal"
							>
								<Checkbox
									id={permission.value}
									name="permissions"
									value={permission.value}
									defaultChecked={rank?.permissions.includes(
										permission.value,
									)}
								/>
								<FieldContent>
									<FieldLabel htmlFor={permission.value}>
										{permission.label}
									</FieldLabel>
									<FieldDescription>
										{permission.description}
									</FieldDescription>
								</FieldContent>
							</Field>
						))}
					</FieldGroup>
					<FieldError>
						{errors?.permissions &&
							errorMessages[errors.permissions[0]]}
					</FieldError>
				</FieldSet>
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
					{rank ? "Zapisz" : "Dodaj"}
				</Button>
			</DialogFooter>
		</form>
	);
}

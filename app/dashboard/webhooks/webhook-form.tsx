"use client";

import { SendIcon } from "lucide-react";
import {
	startTransition,
	useActionState,
	useState,
	useTransition,
	type FormEvent,
} from "react";
import { toast } from "sonner";
import {
	saveWebhook,
	testWebhook,
	type FormState,
} from "@/app/dashboard/webhooks/actions";
import type { WebhookEvent } from "@/app/generated/prisma/browser";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { errorMessages } from "@/lib/errors";

export const events: Record<
	WebhookEvent,
	{ title: string; description: string }
> = {
	CONTACT: {
		title: "Formularz kontaktowy",
		description:
			"Zapytania wysłane ze strony głównej. Bez webhooka formularz jest niedostępny.",
	},
	BUYBACK: {
		title: "Rozliczenia skupu",
		description:
			"Podsumowanie każdej zatwierdzonej transakcji w formacie starego systemu.",
	},
};

type Props = {
	event: WebhookEvent;
	webhook?: { url: string; enabled: boolean };
};

export function WebhookForm({ event, webhook }: Props) {
	const [url, setUrl] = useState(webhook?.url ?? "");
	const [testing, startTest] = useTransition();
	const [state, action, pending] = useActionState(
		async (prev: FormState, formData: FormData) => {
			const result = await saveWebhook(prev, formData);
			if (result.ok) toast.success("Zapisano webhook");
			return result;
		},
		{},
	);
	const errors = state.fieldErrors;

	// No automatic form reset on validation errors
	function submit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		startTransition(() => action(formData));
	}

	function test() {
		startTest(async () => {
			const result = await testWebhook(event);
			if (result.error) toast.error(errorMessages[result.error]);
			else toast.success("Wysłano testową wiadomość");
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{events[event].title}</CardTitle>
				<CardDescription>{events[event].description}</CardDescription>
			</CardHeader>
			<form onSubmit={submit} className="contents">
				<input type="hidden" name="event" value={event} />
				<CardContent>
					<FieldGroup>
						<Field data-invalid={!!errors?.url}>
							<FieldLabel htmlFor={`${event}-url`}>
								Adres webhooka
							</FieldLabel>
							<Input
								id={`${event}-url`}
								name="url"
								placeholder="https://discord.com/api/webhooks/…"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								aria-invalid={!!errors?.url}
							/>
							<FieldError>
								{errors?.url && errorMessages[errors.url[0]]}
							</FieldError>
						</Field>
						<Field orientation="horizontal">
							<Checkbox
								id={`${event}-enabled`}
								name="enabled"
								defaultChecked={webhook?.enabled ?? true}
							/>
							<FieldLabel htmlFor={`${event}-enabled`}>
								Włączony
							</FieldLabel>
						</Field>
					</FieldGroup>
					{state.error && (
						<p className="mt-4 text-sm text-destructive">
							{errorMessages[state.error]}
						</p>
					)}
				</CardContent>
				<CardFooter className="justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={
							!webhook?.enabled || url !== webhook.url || testing
						}
						onClick={test}
					>
						<SendIcon />
						Wyślij test
					</Button>
					<Button type="submit" disabled={pending}>
						Zapisz
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}

"use client";

import { CircleAlertIcon, LogInIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const errors: Record<string, string> = {
	NOT_EMPLOYEE: "To konto Discord nie jest na liście pracowników.",
};

export function LoginError() {
	const error = useSearchParams().get("error");
	if (!error) return null;

	return (
		<p
			className="flex items-start gap-2 text-sm text-destructive"
			role="alert"
		>
			<CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
			{errors[error] ?? "Nie udało się zalogować. Spróbuj ponownie."}
		</p>
	);
}

export function DiscordSignIn() {
	const [pending, setPending] = useState(false);

	async function signIn() {
		setPending(true);
		await authClient.signIn.social({
			provider: "discord",
			callbackURL: "/dashboard",
			errorCallbackURL: "/login",
		});
	}

	return (
		<Button
			size="lg"
			className="w-full"
			disabled={pending}
			onClick={signIn}
		>
			<LogInIcon />
			Zaloguj przez Discord
		</Button>
	);
}

import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { DiscordSignIn, LoginError } from "@/app/login/login-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
	title: "Panel pracownika — Sinclair & CO.",
};

export default function LoginPage() {
	return (
		<main className="flex min-h-svh items-center justify-center p-6">
			<Card className="w-full max-w-sm">
				<CardHeader className="items-center text-center">
					<Image
						src="/assets/logo.png"
						alt="Logo Sinclair & CO."
						width={72}
						height={75}
						className="mx-auto"
					/>
					<CardTitle className="text-3xl">Panel pracownika</CardTitle>
					<CardDescription>
						Zaloguj się kontem Discord przypisanym do pracownika
						lombardu.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<Suspense>
						<LoginError />
					</Suspense>
					<DiscordSignIn />
				</CardContent>
			</Card>
		</main>
	);
}

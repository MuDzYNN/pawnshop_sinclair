"use client";

import {
	ArrowUpRightIcon,
	CheckIcon,
	XIcon,
	type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSite } from "@/components/site/site-context";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { errorMessages, type ErrorCode } from "@/lib/errors";
import { categories } from "@/lib/site-data";
import { cn } from "@/lib/utils";

type Status = { text: string; className: string; icon?: LucideIcon };

const field = "gap-1.75";
const label = "text-[10px] font-bold tracking-[.14em] text-[#d3bca9] uppercase";
const control =
	"h-auto min-h-11 px-3.25 py-3 text-xs leading-[1.58] text-white placeholder:text-[#807576] md:text-xs dark:bg-[#0f0c0e]";
const option = "bg-card text-foreground";

export function ContactForm() {
	const { nicknameRef, category, setCategory } = useSite();
	const startedAt = useRef(0);
	const [sending, setSending] = useState(false);
	const [status, setStatus] = useState<Status | null>(null);

	useEffect(() => {
		startedAt.current = Date.now();
	}, []);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		const payload = {
			nickname: String(data.get("nickname")).trim(),
			category: data.get("category"),
			details: String(data.get("details")).trim(),
			phone: String(data.get("phone")).trim(),
			website: data.get("website"),
			startedAt: startedAt.current,
		};
		setSending(true);
		setStatus({
			text: "Przekazujemy Twoje zapytanie…",
			className: "text-gold-pale",
		});
		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const result = await response.json();
			if (!response.ok || !result.ok) throw new Error(result.error);
			setStatus({
				text: "Twoje zapytanie dotarło do lombardu. Nasi pracownicy zapoznają się z nim i skontaktują się z Tobą.",
				className: "text-[#8ed9a7]",
				icon: CheckIcon,
			});
			form.reset();
			setCategory("");
		} catch (error) {
			const message =
				error instanceof Error &&
				errorMessages[error.message as ErrorCode];
			setStatus({
				text:
					message ||
					"Nie udało się przekazać zgłoszenia. Spróbuj ponownie.",
				className: "text-[#f3a3a3]",
				icon: XIcon,
			});
		} finally {
			setSending(false);
		}
	}

	return (
		<Card className="gap-0 border border-border p-9 text-base leading-[1.58] shadow-[0_32px_100px_rgba(0,0,0,.4)] ring-0 max-tablet:p-6.75">
			<CardHeader className="gap-0 px-0">
				<CardTitle className="mb-1.25 font-serif text-[34px] leading-[normal]">
					Wyślij zapytanie
				</CardTitle>
				<CardDescription className="mb-6.25 text-xs">
					Masz przedmiot, który chcesz sprzedać? Wypełnij formularz i
					prześlij nam swoją ofertę. Nasi pracownicy zapoznają się ze
					zgłoszeniem i skontaktują się z Tobą w sprawie indywidualnej
					wyceny.
				</CardDescription>
			</CardHeader>
			<CardContent className="px-0">
				<form id="inquiry-form" onSubmit={submit}>
					<div className="sr-only" aria-hidden="true">
						<label htmlFor="website">Pozostaw puste</label>
						<input
							id="website"
							name="website"
							type="text"
							tabIndex={-1}
							autoComplete="off"
						/>
					</div>
					<FieldGroup className="gap-4.25">
						<div className="grid grid-cols-2 gap-4.25 max-phone:grid-cols-1">
							<Field className={field}>
								<FieldLabel
									className={label}
									htmlFor="nickname"
								>
									Imię / pseudonim
								</FieldLabel>
								<Input
									autoComplete="nickname"
									className={control}
									id="nickname"
									ref={nicknameRef}
									name="nickname"
									maxLength={80}
									placeholder="Jak mamy się do Ciebie zwracać?"
									required
									type="text"
								/>
							</Field>
							<Field className={field}>
								<FieldLabel
									className={label}
									htmlFor="category"
								>
									Kategoria przedmiotu
								</FieldLabel>
								<NativeSelect
									className="w-full *:data-[slot=native-select]:h-auto *:data-[slot=native-select]:min-h-11 *:data-[slot=native-select]:bg-[#0f0c0e]! *:data-[slot=native-select]:py-3 *:data-[slot=native-select]:pl-3.25 *:data-[slot=native-select]:text-xs *:data-[slot=native-select]:leading-[1.58] *:data-[slot=native-select]:text-white"
									id="category"
									name="category"
									required
									value={category}
									onChange={(e) =>
										setCategory(e.target.value)
									}
								>
									<NativeSelectOption
										className={option}
										value=""
									>
										Wybierz kategorię
									</NativeSelectOption>
									{categories.map((c) => (
										<NativeSelectOption
											key={c.id}
											className={option}
										>
											{c.name}
										</NativeSelectOption>
									))}
									<NativeSelectOption className={option}>
										Inne przedmioty
									</NativeSelectOption>
								</NativeSelect>
							</Field>
						</div>
						<Field className={field}>
							<FieldLabel className={label} htmlFor="details">
								Krótki opis przedmiotu
							</FieldLabel>
							<Textarea
								className={cn(
									control,
									"field-sizing-fixed min-h-26.25 resize-y",
								)}
								id="details"
								name="details"
								maxLength={1200}
								minLength={5}
								placeholder="Co chcesz sprzedać? Podaj liczbę sztuk i stan przedmiotu."
								required
							/>
						</Field>
						<Field className={field}>
							<FieldLabel className={label} htmlFor="phone">
								Numer telefonu do kontaktu
							</FieldLabel>
							<Input
								className={control}
								id="phone"
								name="phone"
								type="tel"
								autoComplete="tel"
								inputMode="tel"
								maxLength={30}
								placeholder="Wpisz swój numer telefonu"
								aria-describedby="phone-help"
								required
							/>
							<FieldDescription
								id="phone-help"
								className="text-[11px] leading-[1.55] text-[#bba9a3]"
							>
								Podaj numer telefonu, aby pracownik lombardu
								mógł skontaktować się z Tobą w sprawie Twojego
								przedmiotu.
							</FieldDescription>
						</Field>
					</FieldGroup>
					<p className="mt-4.25 mb-5 text-[11px] text-[#ab9995]">
						W wiadomości podaj jedynie informacje potrzebne do oceny
						przedmiotu. Nie przekazuj poufnych danych.
					</p>
					<Button
						size="cta"
						className="border-[#873544] hover:bg-[#8a2b3d] disabled:cursor-wait disabled:opacity-60 max-phone:w-full"
						disabled={sending}
						type="submit"
					>
						Wyślij zapytanie <ArrowUpRightIcon className="size-4" />
					</Button>
					<p
						aria-live="polite"
						className={cn(
							"mt-3.25 flex min-h-4.5 items-start gap-1.5 text-xs",
							status?.className,
						)}
						role="status"
					>
						{status?.icon && (
							<status.icon className="mt-0.5 size-3.5 shrink-0" />
						)}
						{status?.text}
					</p>
				</form>
			</CardContent>
		</Card>
	);
}

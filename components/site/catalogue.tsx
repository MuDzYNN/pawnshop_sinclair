"use client";

import { ArrowUpRightIcon, DiamondIcon } from "lucide-react";
import { useState } from "react";
import { useSite } from "@/components/site/site-context";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { categories } from "@/lib/site-data";

const pad = (n: number) => String(n).padStart(2, "0");

export function Catalogue() {
	const { inquire } = useSite();
	const [selected, setSelected] = useState("all");
	const [query, setQuery] = useState("");

	const q = query.trim().toLocaleLowerCase("pl");
	const shown = categories.filter(
		(c) =>
			(selected === "all" || selected === c.id) &&
			`${c.name} ${c.items.join(" ")}`
				.toLocaleLowerCase("pl")
				.includes(q),
	);
	const filters = [{ id: "all", name: "Wszystkie" }, ...categories];

	return (
		<>
			<div className="mb-6.5 flex flex-wrap items-center gap-2.5">
				<ToggleGroup
					aria-label="Filtruj przedmioty"
					className="flex-wrap"
					spacing={2.5}
					variant="outline"
					value={[selected]}
					onValueChange={(value) => value[0] && setSelected(value[0])}
				>
					{filters.map((f) => (
						<ToggleGroupItem
							key={f.id}
							value={f.id}
							className="h-auto border-border bg-[rgba(33,25,29,.65)] px-4 py-2.5 text-[11px] font-normal tracking-[.07em] text-secondary-foreground hover:border-[#b08760] hover:bg-accent hover:text-accent-foreground aria-pressed:border-[#b08760] aria-pressed:bg-accent aria-pressed:text-accent-foreground"
						>
							{f.name}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
				<Input
					aria-label="Szukaj skupowanych przedmiotów"
					className="ml-auto h-auto w-auto max-w-full min-w-56.25 border-border bg-[#161014] px-3.5 py-2.75 text-xs leading-[1.58] placeholder:text-[#807271] max-tablet:ml-0 max-tablet:w-full md:text-xs dark:bg-[#161014]"
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Wyszukaj przedmiot…"
					type="search"
					value={query}
				/>
			</div>
			<div className="grid grid-cols-2 gap-6 max-[620px]:grid-cols-1">
				{shown.map((c) => (
					<Card
						key={c.id}
						className="min-h-90 min-w-0 gap-0 border text-base leading-[1.58] border-border bg-linear-142/srgb from-[#211317] to-[#120d10] to-68% px-7.75 pt-7.5 pb-5.25 ring-0 transition hover:-translate-y-0.75 hover:border-[rgba(197,167,121,.47)] has-data-[slot=card-footer]:pb-5.25 max-tablet:min-h-0 max-[620px]:p-5.5 max-[620px]:has-data-[slot=card-footer]:pb-5.5"
					>
						<CardHeader className="flex items-center gap-5.25 border-b border-[rgba(197,167,121,.22)] px-0 [--card-spacing:--spacing(5.25)] max-[390px]:gap-3.25">
							<div className="grid size-16 shrink-0 place-items-center rounded-full border border-[#816248] bg-radial/srgb from-[#45222a] to-[#1b1016] text-gold-pale max-[390px]:size-12">
								<c.icon
									className="size-7 max-[390px]:size-5.5"
									strokeWidth={1.4}
								/>
							</div>
							<div className="min-w-0">
								<div className="mb-1.75 text-[10px] tracking-[.17em] text-gold uppercase">
									KATEGORIA {pad(categories.indexOf(c) + 1)} /{" "}
									{pad(categories.length)}
								</div>
								<CardTitle className="font-serif text-[28px] leading-[1.05] tracking-[.01em] text-gold-pale max-[390px]:text-2xl">
									{c.name}
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent className="px-0">
							<ul className="mt-4.5 mb-5.5 grid grid-cols-2 gap-x-4 gap-y-1.25 max-tablet:grid-cols-1 max-[620px]:grid-cols-2 max-[390px]:grid-cols-1">
								{c.items.map((item) => (
									<li
										key={item}
										className="flex min-w-0 items-baseline gap-2 text-xs leading-[1.55] text-[#dfd0c8]"
									>
										<DiamondIcon className="size-1.5 shrink-0 self-center fill-current text-gold" />
										{item}
									</li>
								))}
							</ul>
						</CardContent>
						<CardFooter className="mt-auto block bg-transparent px-0 pt-3.75 pb-0">
							<Button
								variant="link"
								className="h-auto border-0 border-b border-[rgba(197,167,121,.45)] p-0 pb-1.25 text-[10px] font-normal tracking-[.13em] text-gold-pale uppercase hover:no-underline"
								onClick={() => inquire(c.name)}
							>
								Zapytaj o ten skup{" "}
								<ArrowUpRightIcon className="size-3" />
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>
			{!shown.length && (
				<div className="border border-border p-10 text-center text-muted-foreground">
					Nie znaleziono takiej kategorii. Spróbuj innego hasła.
				</div>
			)}
		</>
	);
}

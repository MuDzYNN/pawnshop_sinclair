"use client";

import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { inventoryName } from "@/app/dashboard/buyback/inventory";
import { addIgnored, deleteIgnored } from "@/app/dashboard/ignored/actions";
import type { ItemsData } from "@/app/dashboard/items/data";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { errorMessages } from "@/lib/errors";
import { keys } from "@/lib/swr";

export function IgnoredView({ fallback }: { fallback: ItemsData }) {
	const { data = fallback } = useSWR<ItemsData>(keys.items, {
		fallbackData: fallback,
	});
	const [names, setNames] = useState("");
	const [query, setQuery] = useState("");
	const [pending, startTransition] = useTransition();

	const q = query.trim().toLocaleLowerCase("pl");
	const ignored = data.ignored.filter((entry) =>
		entry.name.toLocaleLowerCase("pl").includes(q),
	);

	function add() {
		startTransition(async () => {
			const result = await addIgnored(
				names.split("\n").map(inventoryName),
			);
			if (result.error) {
				toast.error(
					result.taken
						? `${errorMessages[result.error]}: ${result.taken.join(", ")}`
						: errorMessages[result.error],
				);
				return;
			}
			toast.success(`Dodano do ignorowanych: ${result.created}`);
			mutate(keys.items);
			setNames("");
		});
	}

	function remove(id: string, name: string) {
		startTransition(async () => {
			const result = await deleteIgnored([id]);
			if (result.error) {
				toast.error(errorMessages[result.error]);
				return;
			}
			mutate(keys.items);
			toast.success(`Usunięto z ignorowanych: ${name}`);
		});
	}

	return (
		<div className="flex max-w-3xl flex-col gap-4 p-4 lg:p-6">
			<div>
				<h2 className="text-xl font-semibold">Ignorowane przedmioty</h2>
				<p className="text-sm text-muted-foreground">
					Przedmioty z ekwipunku, których nie skupujemy. Import w
					skupie usuwa je z pola bez doliczania.
				</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Dodaj przedmioty</CardTitle>
					<CardDescription>
						Jedna nazwa na linię, możesz wkleić linie prosto z
						ekwipunku. Wielkość liter nie ma znaczenia.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<Textarea
						aria-label="Nazwy w ekwipunku"
						placeholder={"Gotówka x25\nKluczyk do pojazdu"}
						className="max-h-64 min-h-24"
						value={names}
						onChange={(e) => setNames(e.target.value)}
					/>
					<Button
						className="self-end"
						disabled={pending || !names.trim()}
						onClick={add}
					>
						<PlusIcon />
						Dodaj
					</Button>
				</CardContent>
			</Card>
			<InputGroup className="max-w-sm">
				<InputGroupAddon>
					<SearchIcon />
				</InputGroupAddon>
				<InputGroupInput
					placeholder="Szukaj…"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</InputGroup>
			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader className="bg-muted">
						<TableRow>
							<TableHead>Nazwa w ekwipunku</TableHead>
							<TableHead className="w-0" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{ignored.map((entry) => (
							<TableRow key={entry.id} className="[&>td]:py-1">
								<TableCell className="font-medium">
									{entry.name}
								</TableCell>
								<TableCell>
									<Button
										variant="ghost"
										size="icon-sm"
										disabled={pending}
										onClick={() =>
											remove(entry.id, entry.name)
										}
									>
										<Trash2Icon />
										<span className="sr-only">
											Usuń {entry.name}
										</span>
									</Button>
								</TableCell>
							</TableRow>
						))}
						{!ignored.length && (
							<TableRow>
								<TableCell
									colSpan={2}
									className="h-24 text-center text-muted-foreground"
								>
									{data.ignored.length
										? `Brak pozycji pasujących do „${query}”.`
										: "Lista ignorowanych jest pusta."}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

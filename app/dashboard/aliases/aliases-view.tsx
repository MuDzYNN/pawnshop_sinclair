"use client";

import { PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { addAliases, deleteAliases } from "@/app/dashboard/aliases/actions";
import type { ItemsData } from "@/app/dashboard/items/data";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { itemLabel } from "@/lib/format";
import { keys } from "@/lib/swr";

export function AliasesView({ fallback }: { fallback: ItemsData }) {
	const { data = fallback } = useSWR<ItemsData>(keys.items, {
		fallbackData: fallback,
	});
	const [names, setNames] = useState("");
	const [itemId, setItemId] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [pending, startTransition] = useTransition();

	const items = new Map(data.items.map((item) => [item.id, item]));
	const q = query.trim().toLocaleLowerCase("pl");
	const aliases = data.aliases
		.map((alias) => ({ ...alias, item: items.get(alias.itemId)! }))
		.filter((alias) =>
			`${alias.name} ${itemLabel(alias.item)}`
				.toLocaleLowerCase("pl")
				.includes(q),
		)
		.sort(
			(a, b) =>
				itemLabel(a.item).localeCompare(itemLabel(b.item), "pl") ||
				a.name.localeCompare(b.name, "pl"),
		);

	function add() {
		startTransition(async () => {
			const result = await addAliases({
				names: names.split("\n"),
				itemId: itemId ?? "",
			});
			if (result.error) {
				toast.error(
					result.taken
						? `${errorMessages[result.error]}: ${result.taken.join(", ")}`
						: errorMessages[result.error],
				);
				return;
			}
			toast.success(`Dodano aliasy: ${result.created}`);
			mutate(keys.items);
			setNames("");
		});
	}

	function remove(id: string, name: string) {
		startTransition(async () => {
			const result = await deleteAliases([id]);
			if (result.error) {
				toast.error(errorMessages[result.error]);
				return;
			}
			mutate(keys.items);
			toast.success(`Usunięto alias: ${name}`);
		});
	}

	return (
		<div className="flex max-w-4xl flex-col gap-4 p-4 lg:p-6">
			<div>
				<h2 className="text-xl font-semibold">Aliasy przedmiotów</h2>
				<p className="text-sm text-muted-foreground">
					Nazwy z ekwipunku, które przy imporcie w skupie liczą się
					jako przedmiot z cennika.
				</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Dodaj aliasy</CardTitle>
					<CardDescription>
						Jedna nazwa na linię, dokładnie jak w ekwipunku.
						Wielkość liter nie ma znaczenia.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-[1fr_16rem]">
					<Field>
						<FieldLabel htmlFor="names">
							Nazwy w ekwipunku
						</FieldLabel>
						<Textarea
							id="names"
							placeholder={"Andrew Johnson\nWarren G. Harding"}
							className="max-h-64 min-h-24"
							value={names}
							onChange={(e) => setNames(e.target.value)}
						/>
					</Field>
					<div className="flex flex-col gap-4">
						<Field>
							<FieldLabel>Liczone jako</FieldLabel>
							<Select
								items={data.items.map((item) => ({
									value: item.id,
									label: itemLabel(item),
								}))}
								value={itemId}
								onValueChange={setItemId}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Wybierz przedmiot" />
								</SelectTrigger>
								<SelectContent>
									{data.items.map((item) => (
										<SelectItem
											key={item.id}
											value={item.id}
										>
											{itemLabel(item)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
						<Button
							className="mt-auto"
							disabled={pending || !names.trim() || !itemId}
							onClick={add}
						>
							<PlusIcon />
							Dodaj
						</Button>
					</div>
				</CardContent>
			</Card>
			<InputGroup className="max-w-sm">
				<InputGroupAddon>
					<SearchIcon />
				</InputGroupAddon>
				<InputGroupInput
					placeholder="Szukaj aliasu…"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</InputGroup>
			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader className="bg-muted">
						<TableRow>
							<TableHead>Nazwa w ekwipunku</TableHead>
							<TableHead>Liczone jako</TableHead>
							<TableHead className="w-0" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{aliases.map((alias) => (
							<TableRow key={alias.id} className="[&>td]:py-1">
								<TableCell className="font-medium">
									{alias.name}
								</TableCell>
								<TableCell>{itemLabel(alias.item)}</TableCell>
								<TableCell>
									<Button
										variant="ghost"
										size="icon-sm"
										disabled={pending}
										onClick={() =>
											remove(alias.id, alias.name)
										}
									>
										<Trash2Icon />
										<span className="sr-only">
											Usuń alias {alias.name}
										</span>
									</Button>
								</TableCell>
							</TableRow>
						))}
						{!aliases.length && (
							<TableRow>
								<TableCell
									colSpan={3}
									className="h-24 text-center text-muted-foreground"
								>
									{data.aliases.length
										? `Brak aliasów pasujących do „${query}”.`
										: "Nie dodano jeszcze żadnych aliasów."}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

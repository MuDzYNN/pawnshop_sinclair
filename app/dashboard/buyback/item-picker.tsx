"use client";

import { MinusIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import type { ItemsData } from "@/app/dashboard/items/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatPrice } from "@/lib/format";

type Item = ItemsData["items"][number];

const MAX_QUANTITY = 9999;

// Quantities by item id, items without a quantity are left out
export function useQuantities() {
	const [quantities, setQuantities] = useState<Record<string, number>>({});

	function setQuantity(id: string, quantity: number) {
		const value = Math.min(
			Math.max(Math.trunc(quantity) || 0, 0),
			MAX_QUANTITY,
		);
		setQuantities((current) => {
			const next = { ...current, [id]: value };
			if (!value) delete next[id];
			return next;
		});
	}

	function addQuantities(added: Record<string, number>) {
		for (const [id, quantity] of Object.entries(added)) {
			setQuantity(id, (quantities[id] ?? 0) + quantity);
		}
	}

	return {
		quantities,
		setQuantity,
		addQuantities,
		clear: () => setQuantities({}),
	};
}

type Props = {
	title: string;
	description: string;
	items: Item[];
	quantities: Record<string, number>;
	onChange: (id: string, quantity: number) => void;
	priceLabel: string;
	price: (item: Item) => number;
};

export function ItemPicker({
	title,
	description,
	items,
	quantities,
	onChange,
	priceLabel,
	price,
}: Props) {
	const [query, setQuery] = useState("");

	const q = query.trim().toLocaleLowerCase("pl");
	const shown = items.filter((item) =>
		`${item.name} ${item.note}`.toLocaleLowerCase("pl").includes(q),
	);

	return (
		<div className="flex min-w-0 flex-col gap-4 lg:h-[calc(100svh-var(--header-height)-4rem)]">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold">{title}</h2>
					<p className="text-sm text-muted-foreground">
						{description}
					</p>
				</div>
				<InputGroup className="max-w-xs">
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
					<InputGroupInput
						placeholder="Szukaj przedmiotu…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</InputGroup>
			</div>
			<div className="overflow-hidden rounded-lg border lg:min-h-0 lg:flex-1 lg:*:data-[slot=table-container]:h-full">
				<Table>
					<TableHeader className="sticky top-0 z-10 bg-muted">
						<TableRow>
							<TableHead>Przedmiot</TableHead>
							<TableHead>{priceLabel}</TableHead>
							<TableHead className="w-0 text-center">
								Ilość
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{shown.map((item) => {
							const quantity = quantities[item.id] ?? 0;
							return (
								<TableRow
									key={item.id}
									data-state={
										quantity ? "selected" : undefined
									}
									className="[&>td]:py-1"
								>
									<TableCell className="font-medium">
										{item.name}
										{item.note && (
											<span className="ml-2 text-xs font-normal text-muted-foreground">
												{item.note}
											</span>
										)}
									</TableCell>
									<TableCell className="tabular-nums">
										{formatPrice(price(item))}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1">
											<Button
												variant="outline"
												size="icon-sm"
												disabled={!quantity}
												onClick={() =>
													onChange(
														item.id,
														quantity - 1,
													)
												}
											>
												<MinusIcon />
												<span className="sr-only">
													Mniej
												</span>
											</Button>
											<Input
												aria-label={`Ilość: ${item.name}`}
												type="number"
												min={0}
												max={MAX_QUANTITY}
												inputMode="numeric"
												className="h-7 w-16 [appearance:textfield] text-center tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
												value={quantity}
												onFocus={(e) =>
													e.target.select()
												}
												onChange={(e) =>
													onChange(
														item.id,
														Number(e.target.value),
													)
												}
											/>
											<Button
												variant="outline"
												size="icon-sm"
												onClick={() =>
													onChange(
														item.id,
														quantity + 1,
													)
												}
											>
												<PlusIcon />
												<span className="sr-only">
													Więcej
												</span>
											</Button>
										</div>
									</TableCell>
								</TableRow>
							);
						})}
						{!shown.length && (
							<TableRow>
								<TableCell
									colSpan={3}
									className="h-24 text-center text-muted-foreground"
								>
									{items.length
										? `Brak przedmiotów pasujących do „${query}”.`
										: "Cennik jest pusty."}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

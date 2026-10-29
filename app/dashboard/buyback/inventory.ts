import type { ItemsData } from "@/app/dashboard/items/data";

type Item = ItemsData["items"][number];

export type InventoryEntry = { name: string; quantity: number } & (
	| { status: "added"; item: Item }
	| { status: "ambiguous"; matches: number }
	| { status: "ignored" }
	| { status: "unknown" }
);

// "Paczka papierosów Redwood x2", a line without a count is one piece
const LINE = /^(.+?)(?:\s+[x×]\s*(\d+))?$/i;

const key = (name: string) => name.trim().toLocaleLowerCase("pl");

// Name without the count, "Gotówka x25" becomes "Gotówka"
export const inventoryName = (line: string) =>
	line.trim().match(LINE)?.[1] ?? "";

// Aliases win over item names, a name shared by several items is left to the employee
export function readInventory(
	text: string,
	{
		items,
		aliases,
		ignored,
	}: Pick<ItemsData, "items" | "aliases" | "ignored">,
) {
	const rows = text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const [, name, count] = line.match(LINE)!;
			return { line, name, quantity: Number(count ?? 1) };
		});
	const lines = new Map<string, { name: string; quantity: number }>();
	for (const { name, quantity } of rows) {
		const entry = lines.get(key(name)) ?? { name, quantity: 0 };
		entry.quantity += quantity;
		lines.set(key(name), entry);
	}

	const entries = [...lines.entries()].map(
		([name, entry]): InventoryEntry => {
			const alias = aliases.find((alias) => key(alias.name) === name);
			const matches = alias
				? items.filter((item) => item.id === alias.itemId)
				: items.filter((item) => key(item.name) === name);
			if (matches.length === 1)
				return { ...entry, status: "added", item: matches[0] };
			if (matches.length > 1)
				return {
					...entry,
					status: "ambiguous",
					matches: matches.length,
				};
			if (ignored.some((ignored) => key(ignored.name) === name))
				return { ...entry, status: "ignored" };
			return { ...entry, status: "unknown" };
		},
	);
	const handled = new Set(
		entries
			.filter(
				(entry) =>
					entry.status === "added" || entry.status === "ignored",
			)
			.map((entry) => key(entry.name)),
	);
	// Lines that were neither counted nor ignored stay for the employee
	const rest = rows
		.filter((row) => !handled.has(key(row.name)))
		.map((row) => row.line);
	return { entries, rest: rest.join("\n") };
}

type Line = { name: string; quantity: number };

// Text pasted to PostOP, lines with the same name are counted together
export function purchaseList(lines: Line[]) {
	const totals = new Map<string, number>();
	for (const line of lines) {
		totals.set(line.name, (totals.get(line.name) ?? 0) + line.quantity);
	}
	const rows = [...totals]
		.sort(([a], [b]) => a.localeCompare(b, "pl"))
		.map(([name, quantity]) => `• ${name} x${quantity}`);
	return ["PRZYGOTOWANIE SKUPU", ...rows].join("\n");
}

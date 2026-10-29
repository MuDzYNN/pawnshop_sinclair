import type { ItemInput } from "@/app/dashboard/items/actions";

// Excel saves CSV as UTF-8 or Windows-1250 depending on the chosen format
export async function readCsv(file: File) {
	const bytes = await file.arrayBuffer();
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return new TextDecoder("windows-1250").decode(bytes);
	}
}

// Columns found by header names, otherwise name, buy price, sell price, note in that order
export function parseItems(text: string): ItemInput[] {
	const rows = parseRows(text);
	const header = rows[0]?.map((cell) => cell.toLocaleLowerCase("pl")) ?? [];
	const hasHeader = header.length > 1 && !/\d/.test(header.slice(1).join(""));
	const find = (pattern: RegExp) =>
		header.findIndex((cell) => pattern.test(cell));
	const found = hasHeader
		? [
				find(/nazwa|przedmiot|name|item/),
				find(/skup|buy/),
				find(/sprzeda|sell/),
			]
		: [];
	const [name, buy, sell] =
		found.length && !found.includes(-1) ? found : [0, 1, 2];
	const note =
		found.length && !found.includes(-1) ? find(/notat|uwag|opis|note/) : 3;

	return rows.slice(hasHeader ? 1 : 0).map((row) => ({
		name: row[name]?.trim() ?? "",
		note: row[note]?.trim() ?? "",
		buyPrice: normalizePrice(row[buy] ?? ""),
		sellPrice: normalizePrice(row[sell] ?? ""),
	}));
}

function parseRows(text: string) {
	const [firstLine] = text.split("\n", 1);
	const delimiter = [";", "\t", ","].reduce((best, char) =>
		firstLine.split(char).length > firstLine.split(best).length
			? char
			: best,
	);

	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (quoted) {
			if (char === '"' && text[i + 1] === '"') field += text[++i];
			else if (char === '"') quoted = false;
			else field += char;
		} else if (char === '"') quoted = true;
		else if (char === delimiter) {
			row.push(field);
			field = "";
		} else if (char === "\n") {
			rows.push([...row, field]);
			row = [];
			field = "";
		} else if (char !== "\r") field += char;
	}
	rows.push([...row, field]);
	return rows.filter((cells) => cells.some((cell) => cell.trim()));
}

// "1 200,00 $" and "1,200.00" both become "1200.00", a trailing 1-2 digit group is decimals
function normalizePrice(value: string) {
	const clean = value.replace(/[^\d,.-]/g, "");
	const match = clean.match(/^(-?[\d.,]*?)[.,](\d{1,2})$/);
	return match
		? `${match[1].replace(/[.,]/g, "")}.${match[2]}`
		: clean.replace(/[.,]/g, "");
}

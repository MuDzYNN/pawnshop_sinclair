import "server-only";
import writeExcelFile from "write-excel-file/node";

export type Column = { header: string; width?: number };
type Cell = string | number | Date | null;

// Warsaw time as "2026-10-30 14:05:00"
const dateFormat = new Intl.DateTimeFormat("sv-SE", {
	dateStyle: "short",
	timeStyle: "medium",
	timeZone: "Europe/Warsaw",
});

function csvCell(value: Cell) {
	if (value === null) return "";
	if (value instanceof Date) return dateFormat.format(value);
	// Decimal comma, Polish Excel reads "2.5" as a date
	if (typeof value === "number") return String(value).replace(".", ",");
	// Leading = + - @ would run as a formula
	const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
	return /[";\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

// Excel dates have no time zone, the UTC fields carry the Warsaw time
const xlsxCell = (value: Cell) =>
	value instanceof Date
		? new Date(`${dateFormat.format(value).replace(" ", "T")}Z`)
		: value;

// CSV with semicolons and a BOM, so Polish Excel opens it straight into columns
export async function exportResponse(
	params: URLSearchParams,
	name: string,
	columns: Column[],
	rows: Cell[][],
) {
	const fileName = `${name}-${dateFormat.format(new Date()).slice(0, 10)}`;
	if (params.get("format") === "xlsx") {
		const sheetData = [
			columns.map((column) => ({
				value: column.header,
				fontWeight: "bold" as const,
			})),
			...rows.map((row) => row.map(xlsxCell)),
		];
		const file = await writeExcelFile(sheetData, {
			columns: columns.map((column) => ({
				width: column.width ?? Math.max(column.header.length + 2, 12),
			})),
			dateFormat: "yyyy-mm-dd hh:mm:ss",
			stickyRowsCount: 1,
		}).toBuffer();
		return new Response(new Uint8Array(file), {
			headers: {
				"Content-Type":
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
			},
		});
	}

	const lines = [columns.map((column) => column.header), ...rows].map(
		(row) => row.map(csvCell).join(";"),
	);
	return new Response(`﻿${lines.join("\r\n")}\r\n`, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="${fileName}.csv"`,
		},
	});
}

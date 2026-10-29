import { salesQuery } from "@/app/dashboard/sales/data";
import { statusLabels } from "@/app/dashboard/sales/sale-status";
import { exportResponse } from "@/lib/export";
import { itemLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { authorizeApi } from "@/lib/session";

// CSV or XLSX of every sale matching the filters, not just the current page
export async function GET(request: Request) {
	const { employee, response } = await authorizeApi();
	if (!employee) return response;

	const params = new URL(request.url).searchParams;
	const { shown, orderBy } = salesQuery(employee, params);
	const sales = await prisma.sale.findMany({
		where: shown,
		orderBy,
		include: {
			employee: { select: { name: true } },
			settledBy: { select: { name: true } },
			lines: true,
		},
	});

	return exportResponse(
		params,
		"sprzedaze-postop",
		[
			{ header: "Numer", width: 26 },
			{ header: "Data", width: 20 },
			{ header: "Pracownik", width: 20 },
			{ header: "Sztuk" },
			{ header: "Przedmioty", width: 60 },
			{ header: "Wartość ($)" },
			{ header: "Status" },
			{ header: "Rozliczył", width: 20 },
			{ header: "Data rozliczenia", width: 20 },
		],
		sales.map((sale) => [
			sale.number,
			sale.createdAt,
			sale.employee.name,
			sale.lines.reduce((sum, line) => sum + line.quantity, 0),
			sale.lines
				.map((line) => `${itemLabel(line)} ×${line.quantity}`)
				.join(", "),
			sale.value,
			statusLabels[sale.status],
			sale.settledBy?.name ?? null,
			sale.settledAt,
		]),
	);
}

import { buybacksQuery } from "@/app/dashboard/buybacks/data";
import { exportResponse } from "@/lib/export";
import { itemLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { authorizeApi } from "@/lib/session";

// CSV or XLSX of every buyback matching the filters, not just the current page
export async function GET(request: Request) {
	const { employee, response } = await authorizeApi();
	if (!employee) return response;

	const params = new URL(request.url).searchParams;
	const { where, orderBy } = buybacksQuery(employee, params);
	const buybacks = await prisma.buyback.findMany({
		where,
		orderBy,
		include: { employee: { select: { name: true } }, lines: true },
	});

	return exportResponse(
		params,
		"skupy",
		[
			{ header: "Numer", width: 26 },
			{ header: "Data", width: 20 },
			{ header: "Pracownik", width: 20 },
			{ header: "Sztuk" },
			{ header: "Przedmioty", width: 60 },
			{ header: "Wartość skupu ($)" },
			{ header: "Bonus (%)" },
			{ header: "Bonus kwotowy ($)" },
			{ header: "Bonus ($)" },
			{ header: "Wypłata ($)" },
			{ header: "Wartość sprzedaży ($)" },
			{ header: "Zysk ($)" },
		],
		buybacks.map((buyback) => [
			buyback.number,
			buyback.createdAt,
			buyback.employee.name,
			buyback.lines.reduce((sum, line) => sum + line.quantity, 0),
			buyback.lines
				.map((line) => `${itemLabel(line)} ×${line.quantity}`)
				.join(", "),
			buyback.subtotal,
			buyback.bonusPercent,
			buyback.bonusAmount,
			buyback.bonus,
			buyback.payout,
			buyback.saleValue,
			buyback.profit,
		]),
	);
}

import "server-only";
import { z } from "zod";
import { warsawMidnight } from "@/app/dashboard/buybacks/data";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { CurrentEmployee } from "@/lib/session";

const RECENT = 5;

const filtersSchema = z.object({
	range: z.enum(["7", "30", "90"]).catch("30"),
});

// Day in Warsaw as YYYY-MM-DD
const warsawDate = new Intl.DateTimeFormat("en-CA", {
	timeZone: "Europe/Warsaw",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

export type OverviewData = Awaited<ReturnType<typeof getOverviewData>>;

export async function getOverviewData(
	actor: CurrentEmployee,
	params: URLSearchParams,
) {
	const days = Number(filtersSchema.parse(Object.fromEntries(params)).range);
	const today = warsawDate.format(new Date());
	const createdAt = {
		gte: warsawMidnight(today, 1 - days),
		lt: warsawMidnight(today, 1),
	};
	// Without the permission an employee only sees their own
	const buybackEmployee = hasPermission(actor, "VIEW_BUYBACKS")
		? undefined
		: actor.id;
	const saleEmployee = hasPermission(actor, "VIEW_SALES")
		? undefined
		: actor.id;

	const [buybacks, sales, pending, recentBuybacks, recentSales] =
		await Promise.all([
			prisma.buyback.findMany({
				where: { employeeId: buybackEmployee, createdAt },
				select: { payout: true, profit: true, createdAt: true },
			}),
			prisma.sale.findMany({
				where: { employeeId: saleEmployee, createdAt },
				select: { value: true, createdAt: true },
			}),
			prisma.sale.aggregate({
				where: { employeeId: saleEmployee, status: "PENDING" },
				_sum: { value: true },
				_count: true,
			}),
			prisma.buyback.findMany({
				where: { employeeId: buybackEmployee },
				orderBy: { createdAt: "desc" },
				take: RECENT,
				select: {
					id: true,
					number: true,
					payout: true,
					profit: true,
					createdAt: true,
					employee: { select: { name: true } },
				},
			}),
			prisma.sale.findMany({
				where: { employeeId: saleEmployee },
				orderBy: { createdAt: "desc" },
				take: RECENT,
				select: {
					id: true,
					number: true,
					value: true,
					status: true,
					createdAt: true,
					employee: { select: { name: true } },
				},
			}),
		]);

	// One point per day, days without transactions included
	const start = new Date(`${today}T00:00:00Z`);
	const chart = Array.from({ length: days }, (_, index) => {
		const date = new Date(start);
		date.setUTCDate(date.getUTCDate() + index + 1 - days);
		return {
			date: date.toISOString().slice(0, 10),
			payout: 0,
			profit: 0,
			sales: 0,
		};
	});
	const byDate = new Map(chart.map((point) => [point.date, point]));
	for (const buyback of buybacks) {
		const point = byDate.get(warsawDate.format(buyback.createdAt))!;
		point.payout += buyback.payout;
		point.profit += buyback.profit;
	}
	for (const sale of sales)
		byDate.get(warsawDate.format(sale.createdAt))!.sales += sale.value;

	return {
		totals: {
			buybacks: buybacks.length,
			payout: chart.reduce((sum, point) => sum + point.payout, 0),
			profit: chart.reduce((sum, point) => sum + point.profit, 0),
			sales: sales.length,
			salesValue: chart.reduce((sum, point) => sum + point.sales, 0),
		},
		pending: { value: pending._sum.value ?? 0, count: pending._count },
		chart,
		recentBuybacks: recentBuybacks.map((buyback) => ({
			...buyback,
			createdAt: buyback.createdAt.toISOString(),
		})),
		recentSales: recentSales.map((sale) => ({
			...sale,
			createdAt: sale.createdAt.toISOString(),
		})),
	};
}

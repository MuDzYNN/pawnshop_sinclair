import "server-only";
import { z } from "zod";
import type { Prisma } from "@/app/generated/prisma/client";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { CurrentEmployee } from "@/lib/session";

const PAGE_SIZE = 50;

const filtersSchema = z.object({
	from: z.iso.date().optional().catch(undefined),
	to: z.iso.date().optional().catch(undefined),
	employee: z.string().optional().catch(undefined),
	q: z.string().trim().max(80).optional().catch(undefined),
	sort: z.enum(["createdAt", "payout", "profit"]).catch("createdAt"),
	order: z.enum(["asc", "desc"]).catch("desc"),
	page: z.coerce.number().int().min(1).catch(1),
});

export type BuybacksData = Awaited<ReturnType<typeof getBuybacksData>>;

// Shared by the list and the CSV export
export function buybacksQuery(actor: CurrentEmployee, params: URLSearchParams) {
	const filters = filtersSchema.parse(Object.fromEntries(params));
	const where: Prisma.BuybackWhereInput = {
		// Without the permission an employee only sees their own buybacks
		employeeId: hasPermission(actor, "VIEW_BUYBACKS")
			? filters.employee
			: actor.id,
		createdAt: {
			gte: filters.from && warsawMidnight(filters.from),
			lt: filters.to && warsawMidnight(filters.to, 1),
		},
		...(filters.q && {
			OR: [
				{ number: { contains: filters.q, mode: "insensitive" } },
				{
					lines: {
						some: {
							name: { contains: filters.q, mode: "insensitive" },
						},
					},
				},
				{
					lines: {
						some: {
							note: { contains: filters.q, mode: "insensitive" },
						},
					},
				},
			],
		}),
	};
	const orderBy: Prisma.BuybackOrderByWithRelationInput[] = [
		{ [filters.sort]: filters.order },
		{ createdAt: "desc" },
	];
	return { filters, where, orderBy };
}

export async function getBuybacksData(
	actor: CurrentEmployee,
	params: URLSearchParams,
) {
	const { filters, where, orderBy } = buybacksQuery(actor, params);
	const [buybacks, total, sums] = await Promise.all([
		prisma.buyback.findMany({
			where,
			orderBy,
			skip: (filters.page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
			select: {
				id: true,
				number: true,
				bonusPercent: true,
				bonusAmount: true,
				subtotal: true,
				bonus: true,
				payout: true,
				saleValue: true,
				profit: true,
				createdAt: true,
				employee: { select: { name: true } },
				lines: {
					select: {
						id: true,
						name: true,
						note: true,
						quantity: true,
						buyPrice: true,
						sellPrice: true,
					},
				},
			},
		}),
		prisma.buyback.count({ where }),
		prisma.buyback.aggregate({
			where,
			_sum: { payout: true, profit: true },
		}),
	]);

	return {
		buybacks: buybacks.map((buyback) => ({
			...buyback,
			createdAt: buyback.createdAt.toISOString(),
		})),
		total,
		pageSize: PAGE_SIZE,
		sums: { payout: sums._sum.payout ?? 0, profit: sums._sum.profit ?? 0 },
	};
}

// Midnight in Warsaw, so date filters match the dates shown in the panel
export function warsawMidnight(date: string, addDays = 0) {
	const utc = new Date(`${date}T00:00:00Z`);
	utc.setUTCDate(utc.getUTCDate() + addDays);
	const offset =
		new Date(
			utc.toLocaleString("en-US", { timeZone: "Europe/Warsaw" }),
		).getTime() -
		new Date(utc.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
	return new Date(utc.getTime() - offset);
}

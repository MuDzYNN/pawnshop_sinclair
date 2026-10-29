import "server-only";
import { z } from "zod";
import { warsawMidnight } from "@/app/dashboard/buybacks/data";
import type { Prisma } from "@/app/generated/prisma/client";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { CurrentEmployee } from "@/lib/session";

const PAGE_SIZE = 50;

const filtersSchema = z.object({
	from: z.iso.date().optional().catch(undefined),
	to: z.iso.date().optional().catch(undefined),
	employee: z.string().optional().catch(undefined),
	status: z.enum(["PENDING", "SETTLED"]).optional().catch(undefined),
	q: z.string().trim().max(80).optional().catch(undefined),
	sort: z.enum(["createdAt", "value"]).catch("createdAt"),
	order: z.enum(["asc", "desc"]).catch("desc"),
	page: z.coerce.number().int().min(1).catch(1),
});

export type SalesData = Awaited<ReturnType<typeof getSalesData>>;

export async function getSalesData(
	actor: CurrentEmployee,
	params: URLSearchParams,
) {
	const filters = filtersSchema.parse(Object.fromEntries(params));
	const where: Prisma.SaleWhereInput = {
		// Without the permission an employee only sees their own sales
		employeeId: hasPermission(actor, "VIEW_SALES")
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

	const shown = { ...where, status: filters.status };

	const [sales, total, sums, pending] = await Promise.all([
		prisma.sale.findMany({
			where: shown,
			orderBy: [{ [filters.sort]: filters.order }, { createdAt: "desc" }],
			skip: (filters.page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
			select: {
				id: true,
				number: true,
				value: true,
				status: true,
				settledAt: true,
				createdAt: true,
				employee: { select: { name: true } },
				settledBy: { select: { name: true } },
				lines: {
					select: {
						id: true,
						name: true,
						note: true,
						quantity: true,
						sellPrice: true,
					},
				},
			},
		}),
		prisma.sale.count({ where: shown }),
		prisma.sale.aggregate({ where: shown, _sum: { value: true } }),
		// Outstanding from PostOP regardless of the status filter
		prisma.sale.aggregate({
			where: { ...where, status: "PENDING" },
			_sum: { value: true },
			_count: true,
		}),
	]);

	return {
		sales: sales.map((sale) => ({
			...sale,
			settledAt: sale.settledAt?.toISOString() ?? null,
			createdAt: sale.createdAt.toISOString(),
		})),
		total,
		pageSize: PAGE_SIZE,
		sums: {
			value: sums._sum.value ?? 0,
			pending: pending._sum.value ?? 0,
			pendingCount: pending._count,
		},
		canSettle: hasPermission(actor, "SETTLE_SALES"),
	};
}

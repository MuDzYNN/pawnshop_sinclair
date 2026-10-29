import "server-only";
import { z } from "zod";
import type { Prisma } from "@/app/generated/prisma/client";
import { warsawMidnight } from "@/app/dashboard/buybacks/data";
import { categories, type Category } from "@/app/dashboard/logs/labels";
import type { Changes } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 50;

const filtersSchema = z.object({
	from: z.iso.date().optional().catch(undefined),
	to: z.iso.date().optional().catch(undefined),
	employee: z.string().optional().catch(undefined),
	category: z
		.enum(Object.keys(categories) as [Category, ...Category[]])
		.optional()
		.catch(undefined),
	q: z.string().trim().max(80).optional().catch(undefined),
	page: z.coerce.number().int().min(1).catch(1),
});

export type LogsData = Awaited<ReturnType<typeof getLogsData>>;

export async function getLogsData(params: URLSearchParams) {
	const filters = filtersSchema.parse(Object.fromEntries(params));
	const where: Prisma.AuditLogWhereInput = {
		employeeId: filters.employee,
		action: filters.category && {
			in: categories[filters.category].actions,
		},
		createdAt: {
			gte: filters.from && warsawMidnight(filters.from),
			lt: filters.to && warsawMidnight(filters.to, 1),
		},
		...(filters.q && {
			OR: [
				{ target: { contains: filters.q, mode: "insensitive" } },
				{ actorName: { contains: filters.q, mode: "insensitive" } },
			],
		}),
	};

	const [logs, total] = await Promise.all([
		prisma.auditLog.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip: (filters.page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
			select: {
				id: true,
				actorName: true,
				action: true,
				target: true,
				changes: true,
				createdAt: true,
			},
		}),
		prisma.auditLog.count({ where }),
	]);

	return {
		logs: logs.map((log) => ({
			...log,
			changes: log.changes as Changes | null,
			createdAt: log.createdAt.toISOString(),
		})),
		total,
		pageSize: PAGE_SIZE,
	};
}

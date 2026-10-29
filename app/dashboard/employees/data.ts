import "server-only";
import { canManageRank } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { CurrentEmployee } from "@/lib/session";

export type EmployeesData = Awaited<ReturnType<typeof getEmployeesData>>;

export async function getEmployeesData(actor: CurrentEmployee) {
	const [employees, ranks] = await Promise.all([
		prisma.employee.findMany({
			orderBy: [{ rank: { position: "asc" } }, { name: "asc" }],
			select: {
				id: true,
				discordId: true,
				name: true,
				active: true,
				userId: true,
				rank: { select: { id: true, name: true, position: true } },
			},
		}),
		prisma.rank.findMany({
			orderBy: { position: "asc" },
			select: { id: true, name: true, position: true },
		}),
	]);

	return {
		ranks: ranks.filter((rank) => canManageRank(actor, rank.position)),
		employees: employees.map(({ userId, ...employee }) => ({
			...employee,
			linked: userId !== null,
			manageable:
				employee.id !== actor.id &&
				canManageRank(actor, employee.rank.position),
		})),
	};
}

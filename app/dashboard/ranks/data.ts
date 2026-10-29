import "server-only";
import { prisma } from "@/lib/prisma";
import type { CurrentEmployee } from "@/lib/session";

export type RanksData = Awaited<ReturnType<typeof getRanksData>>;

export async function getRanksData(actor: CurrentEmployee) {
	const ranks = await prisma.rank.findMany({
		orderBy: { position: "asc" },
		select: {
			id: true,
			name: true,
			permissions: true,
			_count: { select: { employees: true } },
		},
	});

	return {
		ownRankId: actor.rank.id,
		ranks: ranks.map(({ _count, ...rank }) => ({
			...rank,
			employees: _count.employees,
		})),
	};
}

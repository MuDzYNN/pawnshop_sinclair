import "server-only";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { CurrentEmployee } from "@/lib/session";

export type ItemsData = Awaited<ReturnType<typeof getItemsData>>;

export async function getItemsData(actor: CurrentEmployee) {
	const [items, aliases, ignored] = await Promise.all([
		prisma.item.findMany({
			orderBy: [{ position: "asc" }, { name: "asc" }],
			select: {
				id: true,
				name: true,
				note: true,
				buyPrice: true,
				sellPrice: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		prisma.itemAlias.findMany({
			orderBy: { name: "asc" },
			select: { id: true, name: true, itemId: true },
		}),
		prisma.ignoredItem.findMany({
			orderBy: { name: "asc" },
			select: { id: true, name: true },
		}),
	]);
	return {
		// ISO strings, same as what the API route returns as JSON
		items: items.map((item) => ({
			...item,
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
		})),
		aliases,
		ignored,
		canManage: hasPermission(actor, "MANAGE_ITEMS"),
	};
}

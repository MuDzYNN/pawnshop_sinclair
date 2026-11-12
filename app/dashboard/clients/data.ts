import "server-only";
import { prisma } from "@/lib/prisma";

export type ClientsData = Awaited<ReturnType<typeof getClientsData>>;
export type ClientEntriesData = Awaited<ReturnType<typeof getClientEntries>>;

export async function getClientsData() {
	const clients = await prisma.client.findMany({
		orderBy: [{ archived: "asc" }, { name: "asc" }],
		select: {
			id: true,
			name: true,
			phone: true,
			notes: true,
			balance: true,
			archived: true,
		},
	});
	return { clients };
}

export async function getClientEntries(clientId: string) {
	const entries = await prisma.clientEntry.findMany({
		where: { clientId },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			type: true,
			amount: true,
			deposit: true,
			commissionPercent: true,
			commission: true,
			note: true,
			createdAt: true,
			employee: { select: { name: true } },
			buyback: { select: { number: true } },
		},
	});
	return {
		entries: entries.map((entry) => ({
			...entry,
			createdAt: entry.createdAt.toISOString(),
		})),
	};
}

import "server-only";
import type { Prisma } from "@/app/generated/prisma/client";

// Null when the client is archived or the balance would go below zero
export async function changeBalance(
	tx: Prisma.TransactionClient,
	clientId: string,
	amount: number,
) {
	const { count } = await tx.client.updateMany({
		where: { id: clientId, archived: false, balance: { gte: -amount } },
		data: { balance: { increment: amount } },
	});
	return count ? tx.client.findUniqueOrThrow({ where: { id: clientId } }) : null;
}

"use server";

import { z } from "zod";
import { transactionNumber, warsawParts } from "@/app/dashboard/buyback/number";
import { calculateTotals, formatBonus } from "@/app/dashboard/buyback/totals";
import { changeBalance } from "@/app/dashboard/clients/balance";
import { audit } from "@/lib/audit";
import type { ErrorCode } from "@/lib/errors";
import { hasPermission, visibleItems } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/session";
import { sendWebhook } from "@/lib/webhooks";

export type BuybackState = {
	ok?: boolean;
	error?: ErrorCode;
	number?: string;
	webhookFailed?: boolean;
};

const buybackSchema = z.object({
	lines: z
		.array(
			z.object({
				itemId: z.string(),
				quantity: z.number().int().min(1).max(9999),
			}),
		)
		.min(1)
		.refine(
			(lines) =>
				new Set(lines.map((line) => line.itemId)).size === lines.length,
		),
	bonus: z.object({
		percent: z.number().min(0).max(100),
		amount: z.number().int().min(0).max(100_000_000),
	}),
	// Payout shown to the employee, rejected if prices changed since
	payout: z.number().int(),
	// Paid on top of the payout from the client's balance
	client: z
		.object({
			id: z.string(),
			amount: z.number().int().min(1).max(100_000_000),
		})
		.optional(),
});

export type BuybackInput = z.infer<typeof buybackSchema>;

const DISCORD_LIMIT = 2000;

export async function completeBuyback(
	input: BuybackInput,
): Promise<BuybackState> {
	const employee = await getCurrentEmployee();
	if (!hasPermission(employee, "CREATE_BUYBACKS"))
		return { error: "BUYBACKS_FORBIDDEN" };
	const parsed = buybackSchema.safeParse(input);
	if (!parsed.success) return { error: "BUYBACK_INVALID" };
	const { bonus, client } = parsed.data;
	if (client && !hasPermission(employee, "USE_CLIENTS"))
		return { error: "CLIENTS_FORBIDDEN" };

	const items = await prisma.item.findMany({
		where: {
			id: { in: parsed.data.lines.map((line) => line.itemId) },
			...visibleItems(employee),
		},
	});
	const lines = parsed.data.lines.flatMap(({ itemId, quantity }) => {
		const item = items.find((item) => item.id === itemId);
		return item ? [{ ...item, quantity }] : [];
	});
	const totals = calculateTotals(lines, bonus);
	if (
		lines.length !== parsed.data.lines.length ||
		totals.payout !== parsed.data.payout
	) {
		return { error: "PRICES_CHANGED" };
	}

	const now = new Date();
	const { year, month, day, hour, minute, second } = warsawParts(now);
	const number = transactionNumber(now, employee.name);

	if (client) {
		const exists = await prisma.client.count({
			where: { id: client.id, archived: false },
		});
		if (!exists) return { error: "CLIENT_NOT_FOUND" };
	}

	const result = await prisma.$transaction(async (tx) => {
		const balance = client
			? await changeBalance(tx, client.id, -client.amount)
			: null;
		if (client && !balance) return null;
		const buyback = await tx.buyback.create({
			data: {
				number,
				employeeId: employee.id,
				bonusPercent: bonus.percent,
				bonusAmount: bonus.amount,
				subtotal: totals.subtotal,
				bonus: totals.bonus,
				payout: totals.payout,
				saleValue: totals.saleValue,
				profit: totals.profit,
				balancePayout: client?.amount ?? 0,
				createdAt: now,
				lines: {
					create: lines.map(
						({ id, name, note, quantity, buyPrice, sellPrice }) => ({
							itemId: id,
							name,
							note,
							quantity,
							buyPrice,
							sellPrice,
						}),
					),
				},
				...(client && {
					clientEntry: {
						create: {
							clientId: client.id,
							employeeId: employee.id,
							type: "BUYBACK",
							amount: -client.amount,
							createdAt: now,
						},
					},
				}),
			},
		});
		return { buyback, balance };
	});
	if (!result) return { error: "BALANCE_TOO_LOW" };
	const { buyback, balance } = result;

	await audit(employee, [
		{
			action: "BUYBACK_COMPLETED",
			target: number,
			targetId: buyback.id,
			changes: {
				pieces: [null, totals.pieces],
				payout: [null, totals.payout],
				bonus: [null, totals.bonus],
				profit: [null, totals.profit],
				...(client && {
					client: [null, balance!.name],
					balancePayout: [null, client.amount],
				}),
			},
		},
	]);

	// Message format of the old system, kept for whoever still reads it
	const message = (shown: number) =>
		[
			"ROZLICZENIE SKUPU",
			"",
			...lines
				.slice(0, shown)
				.map(
					(line) =>
						`• ${line.name} ×${line.quantity} — $${line.buyPrice * line.quantity}`,
				),
			...(shown < lines.length
				? [`• … i ${lines.length - shown} więcej`]
				: []),
			"",
			`Obsługa: ${employee.name}`,
			"",
			`Dla klienta: $${totals.payout}`,
			"",
			`Zysk lombardu: $${totals.profit}`,
			...(totals.bonus
				? [
						"",
						`Bonus VIP: +${formatBonus(bonus.percent, bonus.amount, (amount) => `$${amount}`)} (przed bonusem: $${totals.subtotal})`,
					]
				: []),
			"",
			`Łączna liczba sztuk: ${totals.pieces}`,
			"",
			`Numer transakcji: ${number}`,
			"",
			`${day}.${month}.${year} ${hour}:${minute}:${second}`,
		].join("\n");

	let shown = lines.length;
	while (shown > 0 && message(shown).length > DISCORD_LIMIT) shown--;
	const webhook = await sendWebhook("BUYBACK", { content: message(shown) });

	return { ok: true, number, webhookFailed: webhook === "failed" };
}

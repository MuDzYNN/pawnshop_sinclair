"use server";

import { z } from "zod";
import { transactionNumber, warsawParts } from "@/app/dashboard/buyback/number";
import { calculateTotals, formatBonus } from "@/app/dashboard/buyback/totals";
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
	const { bonus } = parsed.data;

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

	const buyback = await prisma.buyback.create({
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
		},
	});

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

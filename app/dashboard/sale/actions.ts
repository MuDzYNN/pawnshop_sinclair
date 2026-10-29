"use server";

import { z } from "zod";
import { transactionNumber } from "@/app/dashboard/buyback/number";
import { calculateTotals } from "@/app/dashboard/buyback/totals";
import { audit } from "@/lib/audit";
import type { ErrorCode } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/session";

export type SaleState = { ok?: boolean; error?: ErrorCode; number?: string };

const saleSchema = z.object({
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
	// Value shown to the employee, rejected if prices changed since
	value: z.number().int(),
});

export type SaleInput = z.infer<typeof saleSchema>;

export async function completeSale(input: SaleInput): Promise<SaleState> {
	const employee = await getCurrentEmployee();
	if (!hasPermission(employee, "CREATE_SALES"))
		return { error: "SALES_FORBIDDEN" };
	const parsed = saleSchema.safeParse(input);
	if (!parsed.success) return { error: "SALE_INVALID" };

	const items = await prisma.item.findMany({
		where: { id: { in: parsed.data.lines.map((line) => line.itemId) } },
	});
	const lines = parsed.data.lines.flatMap(({ itemId, quantity }) => {
		const item = items.find((item) => item.id === itemId);
		return item ? [{ ...item, quantity }] : [];
	});
	const { saleValue: value, pieces } = calculateTotals(lines, {
		percent: 0,
		amount: 0,
	});
	if (
		lines.length !== parsed.data.lines.length ||
		value !== parsed.data.value
	)
		return { error: "PRICES_CHANGED" };

	const now = new Date();
	const number = transactionNumber(now, employee.name);
	const sale = await prisma.sale.create({
		data: {
			number,
			employeeId: employee.id,
			value,
			createdAt: now,
			lines: {
				create: lines.map(
					({ id, name, note, quantity, sellPrice }) => ({
						itemId: id,
						name,
						note,
						quantity,
						sellPrice,
					}),
				),
			},
		},
	});

	await audit(employee, [
		{
			action: "SALE_COMPLETED",
			target: number,
			targetId: sale.id,
			changes: {
				pieces: [null, pieces],
				value: [null, value],
			},
		},
	]);
	return { ok: true, number };
}

// Marks the sale as accepted and paid by PostOP, or takes that back after a mistake
export async function setSaleSettled(
	id: string,
	settled: boolean,
): Promise<SaleState> {
	const employee = await getCurrentEmployee();
	if (!hasPermission(employee, "SETTLE_SALES"))
		return { error: "SETTLE_FORBIDDEN" };
	if (!z.string().safeParse(id).success || typeof settled !== "boolean")
		return { error: "INVALID_REQUEST" };

	const { count } = await prisma.sale.updateMany({
		where: { id, status: settled ? "PENDING" : "SETTLED" },
		data: settled
			? {
					status: "SETTLED",
					settledById: employee.id,
					settledAt: new Date(),
				}
			: { status: "PENDING", settledById: null, settledAt: null },
	});
	const sale = await prisma.sale.findUnique({
		where: { id },
		select: { number: true },
	});
	if (!sale) return { error: "SALE_NOT_FOUND" };
	// Already in that state, e.g. settled from another tab
	if (!count) return { ok: true };

	await audit(employee, [
		{
			action: settled ? "SALE_SETTLED" : "SALE_REOPENED",
			target: sale.number,
			targetId: id,
		},
	]);
	return { ok: true };
}

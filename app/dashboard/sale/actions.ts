"use server";

import { z } from "zod";
import { transactionNumber } from "@/app/dashboard/buyback/number";
import { calculateTotals } from "@/app/dashboard/buyback/totals";
import { audit } from "@/lib/audit";
import type { ErrorCode } from "@/lib/errors";
import { hasPermission, visibleItems } from "@/lib/permissions";
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
		where: {
			id: { in: parsed.data.lines.map((line) => line.itemId) },
			...visibleItems(employee),
		},
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

const editSchema = z.object({
	lines: z
		.array(
			z.union([
				// Line already in the sale, keeps the price it was sold at
				z.object({
					lineId: z.string(),
					quantity: z.number().int().min(1).max(9999),
				}),
				// Item added from the price list at its current price
				z.object({
					itemId: z.string(),
					quantity: z.number().int().min(1).max(9999),
				}),
			]),
		)
		.min(1),
	// Value shown to the employee, rejected if prices changed since
	value: z.number().int(),
});

export type SaleEditInput = z.infer<typeof editSchema>;

type SummaryLine = { name: string; note: string; quantity: number };

const summarize = (lines: SummaryLine[]) =>
	lines
		.map(
			(line) =>
				`${line.name}${line.note ? ` (${line.note})` : ""} ×${line.quantity}`,
		)
		.join(", ");

const pieceCount = (lines: { quantity: number }[]) =>
	lines.reduce((sum, line) => sum + line.quantity, 0);

// Sale the employee may manage, without VIEW_SALES only their own
async function findManagedSale(id: string) {
	const employee = await getCurrentEmployee();
	if (!hasPermission(employee, "MANAGE_SALES"))
		return { error: "SALE_MANAGE_FORBIDDEN" as const };
	if (!z.string().min(1).safeParse(id).success)
		return { error: "INVALID_REQUEST" as const };
	const sale = await prisma.sale.findFirst({
		where: {
			id,
			...(!hasPermission(employee, "VIEW_SALES") && {
				employeeId: employee.id,
			}),
		},
		include: { lines: true },
	});
	if (!sale) return { error: "SALE_NOT_FOUND" as const };
	return { employee, sale };
}

export async function updateSale(
	id: string,
	input: SaleEditInput,
): Promise<SaleState> {
	const found = await findManagedSale(id);
	if ("error" in found) return { error: found.error };
	const { employee, sale } = found;
	// Changing the amount after PostOP paid would break the settlement
	if (sale.status !== "PENDING") return { error: "SALE_SETTLED_LOCKED" };
	const parsed = editSchema.safeParse(input);
	if (!parsed.success) return { error: "SALE_INVALID" };

	const kept = parsed.data.lines.flatMap((line) => {
		if (!("lineId" in line)) return [];
		const existing = sale.lines.find((l) => l.id === line.lineId);
		return existing ? [{ ...existing, quantity: line.quantity }] : [];
	});
	const addedInput = parsed.data.lines.flatMap((line) =>
		"itemId" in line ? [line] : [],
	);
	const items = await prisma.item.findMany({
		where: {
			id: { in: addedInput.map((line) => line.itemId) },
			...visibleItems(employee),
		},
	});
	const added = addedInput.flatMap(({ itemId, quantity }) => {
		const item = items.find((item) => item.id === itemId);
		return item ? [{ ...item, quantity }] : [];
	});

	const itemIds = [
		...kept.flatMap((line) => (line.itemId ? [line.itemId] : [])),
		...added.map((item) => item.id),
	];
	if (
		new Set(kept.map((line) => line.id)).size !== kept.length ||
		new Set(itemIds).size !== itemIds.length ||
		kept.length + added.length !== parsed.data.lines.length
	)
		return { error: "SALE_INVALID" };

	const after = [...kept, ...added];
	const value = after.reduce(
		(sum, line) => sum + line.sellPrice * line.quantity,
		0,
	);
	if (value !== parsed.data.value) return { error: "PRICES_CHANGED" };

	const removed = sale.lines.filter(
		(line) => !kept.some((k) => k.id === line.id),
	);
	const updated = await prisma.$transaction(async (tx) => {
		// Guards against settling from another tab in the meantime
		const { count } = await tx.sale.updateMany({
			where: { id, status: "PENDING" },
			data: { value },
		});
		if (!count) return false;
		await tx.saleLine.deleteMany({
			where: { saleId: id, id: { in: removed.map((line) => line.id) } },
		});
		for (const line of kept) {
			await tx.saleLine.update({
				where: { id: line.id },
				data: { quantity: line.quantity },
			});
		}
		await tx.saleLine.createMany({
			data: added.map(({ id: itemId, name, note, quantity, sellPrice }) => ({
				saleId: id,
				itemId,
				name,
				note,
				quantity,
				sellPrice,
			})),
		});
		return true;
	});
	if (!updated) return { error: "SALE_SETTLED_LOCKED" };

	const before = summarize(sale.lines);
	const afterSummary = summarize(after);
	if (before !== afterSummary)
		await audit(employee, [
			{
				action: "SALE_UPDATED",
				target: sale.number,
				targetId: id,
				changes: {
					lines: [before, afterSummary],
					pieces: [pieceCount(sale.lines), pieceCount(after)],
					value: [sale.value, value],
				},
			},
		]);
	return { ok: true, number: sale.number };
}

// Removes the sale with all its lines for good
export async function deleteSale(id: string): Promise<SaleState> {
	const found = await findManagedSale(id);
	if ("error" in found) return { error: found.error };
	const { employee, sale } = found;

	const { count } = await prisma.sale.deleteMany({ where: { id } });
	// Already deleted, e.g. from another tab
	if (!count) return { ok: true, number: sale.number };
	await audit(employee, [
		{
			action: "SALE_DELETED",
			target: sale.number,
			targetId: id,
			changes: {
				lines: [summarize(sale.lines), null],
				pieces: [pieceCount(sale.lines), null],
				value: [sale.value, null],
				status: [sale.status, null],
			},
		},
	]);
	return { ok: true, number: sale.number };
}

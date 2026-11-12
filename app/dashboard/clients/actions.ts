"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { changeBalance } from "@/app/dashboard/clients/balance";
import { audit, diff } from "@/lib/audit";
import type { ErrorCode } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/session";

export type FormState = {
	ok?: boolean;
	error?: ErrorCode;
	fieldErrors?: Partial<
		Record<
			| "name"
			| "phone"
			| "notes"
			| "deposit"
			| "commissionPercent"
			| "amount"
			| "note",
			ErrorCode[]
		>
	>;
};

const MAX_AMOUNT = 100_000_000;

const clientSchema = z.object({
	id: z.string().optional(),
	name: z
		.string()
		.trim()
		.min(2, "CLIENT_NAME_REQUIRED")
		.max(80, "CLIENT_NAME_TOO_LONG"),
	phone: z.string().trim().max(20, "CLIENT_PHONE_TOO_LONG"),
	notes: z.string().trim().max(1000, "CLIENT_NOTES_TOO_LONG"),
});

const depositSchema = z.object({
	clientId: z.string(),
	deposit: z.coerce
		.number()
		.int("AMOUNT_INVALID")
		.min(1, "AMOUNT_INVALID")
		.max(MAX_AMOUNT, "AMOUNT_INVALID"),
	commissionPercent: z.coerce
		.number()
		.min(0, "COMMISSION_INVALID")
		.max(100, "COMMISSION_INVALID"),
});

const adjustmentSchema = z.object({
	clientId: z.string(),
	amount: z.coerce
		.number()
		.int("AMOUNT_INVALID")
		.min(-MAX_AMOUNT, "AMOUNT_INVALID")
		.max(MAX_AMOUNT, "AMOUNT_INVALID")
		.refine((amount) => amount !== 0, "AMOUNT_INVALID"),
	note: z
		.string()
		.trim()
		.min(1, "ADJUSTMENT_NOTE_REQUIRED")
		.max(200, "CLIENT_NOTES_TOO_LONG"),
});

async function authorize() {
	const actor = await getCurrentEmployee();
	if (!hasPermission(actor, "MANAGE_CLIENTS"))
		return { error: "CLIENTS_FORBIDDEN" } as const;
	return { actor };
}

function fieldErrors(error: z.ZodError): FormState {
	return {
		fieldErrors: z.flattenError(error, (issue) => issue.message as ErrorCode)
			.fieldErrors,
	};
}

export async function saveClient(
	_: FormState,
	formData: FormData,
): Promise<FormState> {
	const parsed = clientSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success) return fieldErrors(parsed.error);
	const { id, ...data } = parsed.data;

	const { actor, error } = await authorize();
	if (!actor) return { error };

	const before = id ? await prisma.client.findUnique({ where: { id } }) : null;
	if (id && !before) return { error: "CLIENT_NOT_FOUND" };
	const client = id
		? await prisma.client.update({ where: { id }, data })
		: await prisma.client.create({ data });

	const changes = diff(before, client, ["name", "phone", "notes"]);
	if (Object.keys(changes).length) {
		await audit(actor, [
			{
				action: id ? "CLIENT_UPDATED" : "CLIENT_CREATED",
				target: client.name,
				targetId: client.id,
				changes,
			},
		]);
	}

	revalidatePath("/dashboard/clients");
	return { ok: true };
}

export async function setClientArchived(
	id: string,
	archived: boolean,
): Promise<FormState> {
	const { actor, error } = await authorize();
	if (!actor) return { error };

	const client = await prisma.client.findUnique({ where: { id } });
	if (!client) return { error: "CLIENT_NOT_FOUND" };
	await prisma.client.update({ where: { id }, data: { archived } });
	await audit(actor, [
		{
			action: archived ? "CLIENT_ARCHIVED" : "CLIENT_RESTORED",
			target: client.name,
			targetId: id,
		},
	]);

	revalidatePath("/dashboard/clients");
	return { ok: true };
}

export async function depositClient(
	_: FormState,
	formData: FormData,
): Promise<FormState> {
	const parsed = depositSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success) return fieldErrors(parsed.error);
	const { clientId, deposit, commissionPercent } = parsed.data;

	const { actor, error } = await authorize();
	if (!actor) return { error };

	const commission = Math.round((deposit * commissionPercent) / 100);
	const amount = deposit - commission;
	const client = await prisma.$transaction(async (tx) => {
		const client = await changeBalance(tx, clientId, amount);
		if (client)
			await tx.clientEntry.create({
				data: {
					clientId,
					employeeId: actor.id,
					type: "DEPOSIT",
					amount,
					deposit,
					commissionPercent,
					commission,
				},
			});
		return client;
	});
	if (!client) return { error: "CLIENT_NOT_FOUND" };

	await audit(actor, [
		{
			action: "CLIENT_DEPOSIT",
			target: client.name,
			targetId: client.id,
			changes: {
				deposit: [null, deposit],
				commission: [null, commission],
				balance: [client.balance - amount, client.balance],
			},
		},
	]);

	revalidatePath("/dashboard/clients");
	return { ok: true };
}

export async function adjustClient(
	_: FormState,
	formData: FormData,
): Promise<FormState> {
	const parsed = adjustmentSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success) return fieldErrors(parsed.error);
	const { clientId, amount, note } = parsed.data;

	const { actor, error } = await authorize();
	if (!actor) return { error };

	const exists = await prisma.client.count({
		where: { id: clientId, archived: false },
	});
	if (!exists) return { error: "CLIENT_NOT_FOUND" };
	const client = await prisma.$transaction(async (tx) => {
		const client = await changeBalance(tx, clientId, amount);
		if (client)
			await tx.clientEntry.create({
				data: {
					clientId,
					employeeId: actor.id,
					type: "ADJUSTMENT",
					amount,
					note,
				},
			});
		return client;
	});
	if (!client) return { fieldErrors: { amount: ["BALANCE_TOO_LOW"] } };

	await audit(actor, [
		{
			action: "CLIENT_ADJUSTED",
			target: client.name,
			targetId: client.id,
			changes: {
				balance: [client.balance - amount, client.balance],
				note: [null, note],
			},
		},
	]);

	revalidatePath("/dashboard/clients");
	return { ok: true };
}

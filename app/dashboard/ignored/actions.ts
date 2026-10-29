"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { namesSchema } from "@/app/dashboard/aliases/names";
import { audit } from "@/lib/audit";
import type { ErrorCode } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/session";

export type IgnoredState = {
	ok?: boolean;
	error?: ErrorCode;
	taken?: string[];
	created?: number;
};

async function authorize() {
	const actor = await getCurrentEmployee();
	return hasPermission(actor, "MANAGE_IGNORED") ? actor : null;
}

export async function addIgnored(input: string[]): Promise<IgnoredState> {
	const actor = await authorize();
	if (!actor) return { error: "IGNORED_FORBIDDEN" };

	const parsed = namesSchema.safeParse(input);
	if (!parsed.success)
		return { error: parsed.error.issues[0].message as ErrorCode };
	const names = parsed.data;

	// Inventory names are matched case-insensitively
	const taken = await prisma.ignoredItem.findMany({
		where: {
			OR: names.map((name) => ({
				name: { equals: name, mode: "insensitive" },
			})),
		},
		select: { name: true },
	});
	if (taken.length)
		return {
			error: "IGNORED_TAKEN",
			taken: taken.map((ignored) => ignored.name),
		};

	const ignored = await prisma.ignoredItem.createManyAndReturn({
		data: names.map((name) => ({ name })),
	});
	await audit(
		actor,
		ignored.map((entry) => ({
			action: "IGNORED_CREATED",
			target: entry.name,
			targetId: entry.id,
		})),
	);
	revalidatePath("/dashboard/ignored");
	return { ok: true, created: names.length };
}

export async function deleteIgnored(ids: string[]): Promise<IgnoredState> {
	const actor = await authorize();
	if (!actor) return { error: "IGNORED_FORBIDDEN" };
	if (!z.array(z.string()).safeParse(ids).success)
		return { error: "INVALID_REQUEST" };

	const ignored = await prisma.ignoredItem.findMany({
		where: { id: { in: ids } },
	});
	await prisma.ignoredItem.deleteMany({ where: { id: { in: ids } } });
	await audit(
		actor,
		ignored.map((entry) => ({
			action: "IGNORED_DELETED",
			target: entry.name,
			targetId: entry.id,
		})),
	);
	revalidatePath("/dashboard/ignored");
	return { ok: true };
}

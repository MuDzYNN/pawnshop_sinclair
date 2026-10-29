"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { namesSchema } from "@/app/dashboard/aliases/names";
import { audit } from "@/lib/audit";
import type { ErrorCode } from "@/lib/errors";
import { itemLabel } from "@/lib/format";
import { hasPermission, visibleItems } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/session";

export type AliasState = {
	ok?: boolean;
	error?: ErrorCode;
	taken?: string[];
	created?: number;
};

const aliasesSchema = z.object({
	names: namesSchema,
	itemId: z.string().min(1, "ALIAS_ITEM_REQUIRED"),
});

async function authorize() {
	const actor = await getCurrentEmployee();
	return hasPermission(actor, "MANAGE_ALIASES") ? actor : null;
}

export async function addAliases(input: {
	names: string[];
	itemId: string;
}): Promise<AliasState> {
	const actor = await authorize();
	if (!actor) return { error: "ALIASES_FORBIDDEN" };

	const parsed = aliasesSchema.safeParse(input);
	if (!parsed.success)
		return { error: parsed.error.issues[0].message as ErrorCode };
	const { names, itemId } = parsed.data;

	// Inventory names are matched case-insensitively
	const taken = await prisma.itemAlias.findMany({
		where: {
			OR: names.map((name) => ({
				name: { equals: name, mode: "insensitive" },
			})),
		},
		select: { name: true },
	});
	if (taken.length)
		return {
			error: "ALIAS_TAKEN",
			taken: taken.map((alias) => alias.name),
		};
	const item = await prisma.item.findFirst({
		where: { id: itemId, ...visibleItems(actor) },
	});
	if (!item) return { error: "ALIAS_ITEM_REQUIRED" };

	const aliases = await prisma.itemAlias.createManyAndReturn({
		data: names.map((name) => ({ name, itemId })),
	});
	await audit(
		actor,
		aliases.map((alias) => ({
			action: "ALIAS_CREATED",
			target: alias.name,
			targetId: alias.id,
			changes: { item: [null, itemLabel(item)] },
		})),
	);
	revalidatePath("/dashboard/aliases");
	return { ok: true, created: names.length };
}

export async function deleteAliases(ids: string[]): Promise<AliasState> {
	const actor = await authorize();
	if (!actor) return { error: "ALIASES_FORBIDDEN" };
	if (!z.array(z.string()).safeParse(ids).success)
		return { error: "INVALID_REQUEST" };

	const aliases = await prisma.itemAlias.findMany({
		where: { id: { in: ids } },
		include: { item: true },
	});
	await prisma.itemAlias.deleteMany({ where: { id: { in: ids } } });
	await audit(
		actor,
		aliases.map((alias) => ({
			action: "ALIAS_DELETED",
			target: alias.name,
			targetId: alias.id,
			changes: { item: [itemLabel(alias.item), null] },
		})),
	);
	revalidatePath("/dashboard/aliases");
	return { ok: true };
}

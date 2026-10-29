"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { audit, diff } from "@/lib/audit";
import type { ErrorCode } from "@/lib/errors";
import { itemLabel } from "@/lib/format";
import { withOrder } from "@/app/dashboard/items/order";
import { hasPermission, visibleItems } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/session";

type ItemField = "name" | "note" | "buyPrice" | "sellPrice";

export type FormState = {
	ok?: boolean;
	error?: ErrorCode;
	fieldErrors?: Partial<Record<ItemField, ErrorCode[]>>;
};

export type ItemInput = Record<ItemField, string>;

export type BulkState = {
	ok?: boolean;
	error?: ErrorCode;
	rowErrors?: Partial<Record<ItemField, ErrorCode>>[];
	created?: number;
	updated?: number;
};

const ITEM_FIELDS: (ItemField | "restricted")[] = [
	"name",
	"note",
	"buyPrice",
	"sellPrice",
	"restricted",
];

// Empty input is a missing price, not 0
const price = z.preprocess(
	(value) => (value === "" ? undefined : value),
	z.coerce
		.number({ error: "PRICE_REQUIRED" })
		.int("PRICE_NOT_INTEGER")
		.min(0, "PRICE_NEGATIVE")
		.max(100_000_000, "PRICE_TOO_HIGH"),
);

const itemFields = z.object({
	name: z
		.string()
		.trim()
		.min(2, "ITEM_NAME_REQUIRED")
		.max(80, "ITEM_NAME_TOO_LONG"),
	note: z.string().trim().max(80, "ITEM_NOTE_TOO_LONG"),
	buyPrice: price,
	sellPrice: price,
});

const itemSchema = itemFields.extend({
	id: z.string().optional(),
	// Unchecked checkbox is missing from the form
	restricted: z.stringbool().default(false),
});

const itemsSchema = z
	.array(itemFields)
	.min(1, "ITEMS_EMPTY")
	.max(500, "ITEMS_TOO_MANY");

async function authorize() {
	const actor = await getCurrentEmployee();
	return hasPermission(actor, "MANAGE_ITEMS") ? actor : null;
}

export async function saveItem(
	_: FormState,
	formData: FormData,
): Promise<FormState> {
	const actor = await authorize();
	if (!actor) return { error: "ITEMS_FORBIDDEN" };

	const parsed = itemSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success)
		return {
			fieldErrors: z.flattenError(
				parsed.error,
				(issue) => issue.message as ErrorCode,
			).fieldErrors,
		};
	const { id, restricted, ...fields } = parsed.data;
	// Only employees who see restricted items can change the flag
	const data = hasPermission(actor, "VIEW_RESTRICTED_ITEMS")
		? { ...fields, restricted }
		: fields;

	const before = id
		? await prisma.item.findFirst({ where: { id, ...visibleItems(actor) } })
		: null;
	if (id && !before) return { error: "ITEMS_FORBIDDEN" };
	try {
		const item = id
			? await prisma.item.update({ where: { id }, data })
			: await prisma.item.create({
					data: { ...data, position: await nextPosition() },
				});
		const changes = diff(before, item, ITEM_FIELDS);
		if (Object.keys(changes).length) {
			await audit(actor, [
				{
					action: id ? "ITEM_UPDATED" : "ITEM_CREATED",
					target: itemLabel(item),
					targetId: item.id,
					changes,
				},
			]);
		}
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			return { fieldErrors: { name: ["ITEM_NAME_TAKEN"] } };
		}
		throw error;
	}

	revalidatePath("/dashboard/items");
	return { ok: true };
}

// Adds new items and updates prices of those already on the list, matched by name and note
export async function saveItems(
	rows: ItemInput[],
	restricted: boolean,
): Promise<BulkState> {
	const actor = await authorize();
	if (!actor) return { error: "ITEMS_FORBIDDEN" };

	const parsed = itemsSchema.safeParse(rows);
	const rowErrors: BulkState["rowErrors"] = [];
	for (const issue of parsed.error?.issues ?? []) {
		const [index, field] = issue.path as [number?, ItemField?];
		if (index === undefined || !field)
			return { error: issue.message as ErrorCode };
		rowErrors[index] ??= {};
		rowErrors[index][field] ??= issue.message as ErrorCode;
	}

	const keys = parsed.data?.map((item) => `${item.name}\n${item.note}`) ?? [];
	keys.forEach((key, index) => {
		if (keys.indexOf(key) !== index)
			(rowErrors[index] ??= {}).name ??= "ITEM_NAME_DUPLICATE";
	});
	if (!parsed.success || rowErrors.length) return { rowErrors };
	const seesRestricted = hasPermission(actor, "VIEW_RESTRICTED_ITEMS");
	if (restricted && !seesRestricted) return { error: "ITEMS_FORBIDDEN" };

	const existing = await prisma.item.findMany({
		where: { OR: parsed.data.map(({ name, note }) => ({ name, note })) },
	});
	// Hidden items can't be overwritten by name
	const hidden = new Set(
		existing
			.filter((item) => item.restricted && !seesRestricted)
			.map((item) => `${item.name}\n${item.note}`),
	);
	keys.forEach((key, index) => {
		if (hidden.has(key)) (rowErrors[index] ??= {}).name = "ITEM_NAME_TAKEN";
	});
	if (rowErrors.length) return { rowErrors };

	// New items go to the end of the list in the order they were entered
	const position = await nextPosition();
	const saved = await prisma.$transaction(
		parsed.data.map((item, index) =>
			prisma.item.upsert({
				where: { name_note: { name: item.name, note: item.note } },
				create: { ...item, restricted, position: position + index },
				update: item,
			}),
		),
	);

	await audit(
		actor,
		saved.flatMap((item) => {
			const before = existing.find((old) => old.id === item.id) ?? null;
			const changes = diff(before, item, ITEM_FIELDS);
			if (!Object.keys(changes).length) return [];
			return [
				{
					action: before ? "ITEM_UPDATED" : "ITEM_CREATED",
					target: itemLabel(item),
					targetId: item.id,
					changes,
				},
			];
		}),
	);

	revalidatePath("/dashboard/items");
	return {
		ok: true,
		created: keys.length - existing.length,
		updated: existing.length,
	};
}

export async function reorderItems(ids: string[]): Promise<FormState> {
	const actor = await authorize();
	if (!actor) return { error: "ITEMS_FORBIDDEN" };
	if (!z.array(z.string()).safeParse(ids).success)
		return { error: "INVALID_REQUEST" };

	// Items missing from the list, e.g. added meanwhile or hidden, keep their places
	const items = await prisma.item.findMany({
		orderBy: [{ position: "asc" }, { name: "asc" }],
	});
	const seesRestricted = hasPermission(actor, "VIEW_RESTRICTED_ITEMS");
	const visible = new Set(
		items
			.filter((item) => seesRestricted || !item.restricted)
			.map((item) => item.id),
	);
	const order = withOrder(
		items,
		ids.filter((id) => visible.has(id)),
	).map((item) => item.id);
	await prisma.$transaction(
		order.map((id, position) =>
			prisma.item.update({ where: { id }, data: { position } }),
		),
	);

	await audit(
		actor,
		movedItems(
			items.map((item) => item.id),
			order,
		).map((id) => {
			const item = items.find((item) => item.id === id)!;
			const from = items.indexOf(item) + 1;
			const to = order.indexOf(id) + 1;
			return {
				action: "ITEM_MOVED",
				target: itemLabel(item),
				targetId: id,
				changes: { position: [from, to] },
			};
		}),
	);

	revalidatePath("/dashboard/items");
	return { ok: true };
}

export async function deleteItems(ids: string[]): Promise<FormState> {
	const actor = await authorize();
	if (!actor) return { error: "ITEMS_FORBIDDEN" };
	if (!z.array(z.string()).safeParse(ids).success)
		return { error: "INVALID_REQUEST" };

	const items = await prisma.item.findMany({
		where: { id: { in: ids }, ...visibleItems(actor) },
		include: { aliases: true },
	});
	await prisma.item.deleteMany({
		where: { id: { in: items.map((item) => item.id) } },
	});
	await audit(
		actor,
		items.map((item) => ({
			action: "ITEM_DELETED",
			target: itemLabel(item),
			targetId: item.id,
			changes: {
				...diff(item, null, ITEM_FIELDS),
				...(item.aliases.length && {
					aliases: [item.aliases.map((alias) => alias.name), null],
				}),
			},
		})),
	);

	revalidatePath("/dashboard/items");
	return { ok: true };
}

async function nextPosition() {
	const last = await prisma.item.aggregate({ _max: { position: true } });
	return (last._max.position ?? -1) + 1;
}

// A drag moves one item and shifts the ones between, only that one is reported
function movedItems(before: string[], after: string[]) {
	let start = 0;
	let end = before.length - 1;
	while (start <= end && before[start] === after[start]) start++;
	while (end >= start && before[end] === after[end]) end--;
	if (start > end) return [];
	if (after[start] === before[end]) return [before[end]];
	if (after[end] === before[start]) return [before[start]];
	return after.slice(start, end + 1);
}

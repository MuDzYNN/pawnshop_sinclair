"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Permission, Prisma } from "@/app/generated/prisma/client";
import { audit, diff } from "@/lib/audit";
import type { ErrorCode } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/session";

export type FormState = {
	ok?: boolean;
	error?: ErrorCode;
	fieldErrors?: Partial<Record<"name" | "permissions", ErrorCode[]>>;
};

const rankSchema = z.object({
	id: z.string().optional(),
	name: z
		.string()
		.trim()
		.min(2, "RANK_NAME_REQUIRED")
		.max(40, "RANK_NAME_TOO_LONG"),
	permissions: z.array(z.enum(Permission)),
});

async function authorize() {
	const actor = await getCurrentEmployee();
	return hasPermission(actor, "MANAGE_RANKS") ? actor : null;
}

function revalidate() {
	revalidatePath("/dashboard/ranks");
	revalidatePath("/dashboard/employees");
}

export async function saveRank(
	_: FormState,
	formData: FormData,
): Promise<FormState> {
	const actor = await authorize();
	if (!actor) return { error: "RANKS_FORBIDDEN" };

	const parsed = rankSchema.safeParse({
		id: formData.get("id") || undefined,
		name: formData.get("name"),
		permissions: formData.getAll("permissions"),
	});
	if (!parsed.success)
		return {
			fieldErrors: z.flattenError(
				parsed.error,
				(issue) => issue.message as ErrorCode,
			).fieldErrors,
		};
	const { id, ...data } = parsed.data;

	if (id === actor.rank.id && !data.permissions.includes("MANAGE_RANKS")) {
		return { fieldErrors: { permissions: ["OWN_RANK_PERMISSION"] } };
	}

	const before = id ? await prisma.rank.findUnique({ where: { id } }) : null;
	try {
		let rank;
		if (id) {
			rank = await prisma.rank.update({ where: { id }, data });
		} else {
			const last = await prisma.rank.aggregate({
				_max: { position: true },
			});
			rank = await prisma.rank.create({
				data: { ...data, position: (last._max.position ?? -1) + 1 },
			});
		}
		const changes = diff(before, rank, ["name", "permissions"]);
		if (Object.keys(changes).length) {
			await audit(actor, [
				{
					action: id ? "RANK_UPDATED" : "RANK_CREATED",
					target: rank.name,
					targetId: rank.id,
					changes,
				},
			]);
		}
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			return { fieldErrors: { name: ["RANK_NAME_TAKEN"] } };
		}
		throw error;
	}

	revalidate();
	return { ok: true };
}

export async function moveRank(
	id: string,
	direction: "up" | "down",
): Promise<FormState> {
	const actor = await authorize();
	if (!actor) return { error: "RANKS_FORBIDDEN" };

	const ranks = await prisma.rank.findMany({
		orderBy: { position: "asc" },
		select: { id: true, name: true },
	});
	const index = ranks.findIndex((rank) => rank.id === id);
	const target = direction === "up" ? index - 1 : index + 1;
	if (index === -1 || !ranks[target]) return { error: "RANK_NOT_MOVABLE" };

	// Renumber the whole list so positions stay consecutive
	[ranks[index], ranks[target]] = [ranks[target], ranks[index]];
	await prisma.$transaction(
		ranks.map((rank, position) =>
			prisma.rank.update({ where: { id: rank.id }, data: { position } }),
		),
	);
	await audit(actor, [
		{
			action: "RANK_MOVED",
			target: ranks[target].name,
			targetId: id,
			changes: { position: [index + 1, target + 1] },
		},
	]);

	revalidate();
	return { ok: true };
}

export async function deleteRank(id: string): Promise<FormState> {
	const actor = await authorize();
	if (!actor) return { error: "RANKS_FORBIDDEN" };

	const employees = await prisma.employee.count({ where: { rankId: id } });
	if (employees) return { error: "RANK_HAS_EMPLOYEES" };

	const rank = await prisma.rank.delete({ where: { id } });
	await audit(actor, [
		{
			action: "RANK_DELETED",
			target: rank.name,
			targetId: id,
			changes: diff(rank, null, ["name", "permissions"]),
		},
	]);
	revalidate();
	return { ok: true };
}

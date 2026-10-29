"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { audit, diff } from "@/lib/audit";
import type { ErrorCode } from "@/lib/errors";
import { canManageRank, hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/session";

export type FormState = {
	ok?: boolean;
	error?: ErrorCode;
	fieldErrors?: Partial<Record<"discordId" | "name" | "rankId", ErrorCode[]>>;
};

const employeeSchema = z.object({
	id: z.string().optional(),
	discordId: z
		.string()
		.trim()
		.regex(/^\d{17,20}$/, "DISCORD_ID_INVALID"),
	name: z
		.string()
		.trim()
		.min(2, "EMPLOYEE_NAME_REQUIRED")
		.max(80, "EMPLOYEE_NAME_TOO_LONG"),
	rankId: z.string().min(1, "RANK_REQUIRED"),
});

// Returns the employee the actor may manage, or an error code
async function authorize(employeeId?: string) {
	const actor = await getCurrentEmployee();
	if (!hasPermission(actor, "MANAGE_EMPLOYEES"))
		return { error: "EMPLOYEES_FORBIDDEN" } as const;
	if (!employeeId) return { actor };
	if (employeeId === actor.id) return { error: "OWN_ACCOUNT" } as const;

	const target = await prisma.employee.findUnique({
		where: { id: employeeId },
		include: { rank: true },
	});
	if (!target) return { error: "EMPLOYEE_NOT_FOUND" } as const;
	if (!canManageRank(actor, target.rank.position))
		return { error: "EMPLOYEE_RANK_TOO_HIGH" } as const;
	return { actor, target };
}

export async function saveEmployee(
	_: FormState,
	formData: FormData,
): Promise<FormState> {
	const parsed = employeeSchema.safeParse(Object.fromEntries(formData));
	if (!parsed.success)
		return {
			fieldErrors: z.flattenError(
				parsed.error,
				(issue) => issue.message as ErrorCode,
			).fieldErrors,
		};
	const { id, ...data } = parsed.data;

	const result = await authorize(id);
	if (!result.actor) return { error: result.error };

	const rank = await prisma.rank.findUnique({ where: { id: data.rankId } });
	if (!rank || !canManageRank(result.actor, rank.position)) {
		return { fieldErrors: { rankId: ["RANK_NOT_ASSIGNABLE"] } };
	}

	// A new Discord ID unlinks and logs out the old Discord account
	const relinked = result.target && result.target.discordId !== data.discordId;
	try {
		const employee = id
			? await prisma.employee.update({
					where: { id },
					data: { ...data, ...(relinked && { userId: null }) },
				})
			: await prisma.employee.create({ data });
		if (relinked && result.target.userId)
			await prisma.session.deleteMany({
				where: { userId: result.target.userId },
			});
		// Rank by name, so the entry still reads right after the rank is renamed or deleted
		const changes = diff(
			result.target
				? { ...result.target, rank: result.target.rank.name }
				: null,
			{ ...employee, rank: rank.name },
			["name", "discordId", "rank"],
		);
		if (Object.keys(changes).length) {
			await audit(result.actor, [
				{
					action: id ? "EMPLOYEE_UPDATED" : "EMPLOYEE_CREATED",
					target: employee.name,
					targetId: employee.id,
					changes,
				},
			]);
		}
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			return { fieldErrors: { discordId: ["DISCORD_ID_TAKEN"] } };
		}
		throw error;
	}

	revalidatePath("/dashboard/employees");
	return { ok: true };
}

export async function setEmployeeActive(
	id: string,
	active: boolean,
): Promise<FormState> {
	const result = await authorize(id);
	if (!result.target) return { error: result.error };

	await prisma.employee.update({ where: { id }, data: { active } });
	await audit(result.actor, [
		{
			action: active ? "EMPLOYEE_ACTIVATED" : "EMPLOYEE_DEACTIVATED",
			target: result.target.name,
			targetId: id,
		},
	]);
	// Deactivation ends all of the employee's sessions at once
	if (!active && result.target.userId)
		await prisma.session.deleteMany({
			where: { userId: result.target.userId },
		});

	revalidatePath("/dashboard/employees");
	return { ok: true };
}

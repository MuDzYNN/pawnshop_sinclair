import "server-only";
import type { AuditAction, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type Changes = Record<string, [unknown, unknown]>;

type Actor = { id: string; name: string } | null;

type Entry = {
	action: AuditAction;
	target: string;
	targetId?: string;
	changes?: Changes;
};

// Actor null is a script or someone who is not an employee, actorName says who
export async function audit(
	actor: Actor,
	entries: Entry[],
	actorName = actor?.name ?? "System",
) {
	if (!entries.length) return;
	await prisma.auditLog.createMany({
		data: entries.map((entry) => ({
			...entry,
			employeeId: actor?.id,
			actorName,
			changes: entry.changes as Prisma.InputJsonValue | undefined,
		})),
	});
}

// Fields that differ, a missing record counts as empty
export function diff<T extends Record<string, unknown>>(
	before: T | null,
	after: T | null,
	fields: (keyof T & string)[],
) {
	const changes: Changes = {};
	for (const field of fields) {
		const from = before?.[field] ?? null;
		const to = after?.[field] ?? null;
		if (JSON.stringify(from) !== JSON.stringify(to))
			changes[field] = [from, to];
	}
	return changes;
}

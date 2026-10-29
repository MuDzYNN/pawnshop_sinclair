import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Permission } from "@/app/generated/prisma/client";
import { auth, NOT_EMPLOYEE } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export type CurrentEmployee = NonNullable<
	Awaited<ReturnType<typeof findCurrentEmployee>>["employee"]
>;

const findCurrentEmployee = cache(async () => {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { session: false, employee: null };

	const employee = await prisma.employee.findUnique({
		where: { userId: session.user.id },
		select: {
			id: true,
			name: true,
			active: true,
			rank: {
				select: {
					id: true,
					name: true,
					position: true,
					permissions: true,
				},
			},
		},
	});
	if (!employee?.active) return { session: true, employee: null };

	return {
		session: true,
		employee: {
			id: employee.id,
			name: employee.name,
			rank: employee.rank,
			email: session.user.email,
			image: session.user.image,
		},
	};
});

export async function getCurrentEmployee() {
	const { session, employee } = await findCurrentEmployee();
	if (!session) redirect("/login");
	if (!employee) redirect(`/login?error=${NOT_EMPLOYEE}`);
	return employee;
}

export async function requirePermission(permission: Permission) {
	const employee = await getCurrentEmployee();
	if (!hasPermission(employee, permission)) redirect("/dashboard");
	return employee;
}

// Route handler variant: returns a 401/403 response instead of redirecting
export async function authorizeApi(permission?: Permission) {
	const { employee } = await findCurrentEmployee();
	if (!employee)
		return {
			response: Response.json({ error: "Unauthorized" }, { status: 401 }),
		};
	if (permission && !hasPermission(employee, permission)) {
		return {
			response: Response.json({ error: "Forbidden" }, { status: 403 }),
		};
	}
	return { employee };
}

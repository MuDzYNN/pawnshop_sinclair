import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export const NOT_EMPLOYEE = "NOT_EMPLOYEE";

export const auth = betterAuth({
	database: prismaAdapter(prisma, { provider: "postgresql" }),
	socialProviders: {
		discord: {
			clientId: process.env.DISCORD_CLIENT_ID!,
			clientSecret: process.env.DISCORD_CLIENT_SECRET!,
		},
	},
	databaseHooks: {
		session: {
			create: {
				// Only an active employee gets a session, linking the account on the way
				before: async (session) => {
					const account = await prisma.account.findFirst({
						where: {
							userId: session.userId,
							providerId: "discord",
						},
						select: { accountId: true },
					});
					const employee =
						account &&
						(await prisma.employee.findUnique({
							where: { discordId: account.accountId },
						}));
					if (!employee?.active) {
						const user = await prisma.user.findUnique({
							where: { id: session.userId },
							select: { name: true },
						});
						await audit(
							employee,
							[
								{
									action: "LOGIN_DENIED",
									target:
										account?.accountId ?? session.userId,
								},
							],
							employee?.name ?? user?.name,
						);
						throw new APIError("FORBIDDEN", {
							code: NOT_EMPLOYEE,
							message: "Not an active employee",
						});
					}
					if (employee.userId !== session.userId) {
						await prisma.employee.update({
							where: { id: employee.id },
							data: { userId: session.userId },
						});
					}
					await audit(employee, [
						{
							action: "LOGIN",
							target: employee.name,
							targetId: employee.id,
						},
					]);
				},
			},
		},
	},
	plugins: [nextCookies()],
});

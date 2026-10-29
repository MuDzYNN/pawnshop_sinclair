import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const [discordId, name, rankName] = process.argv.slice(2);

if (!discordId || !name || !rankName) {
	console.error(
		'Usage: pnpm employee:add <discordId> "<full name>" "<rank name>"',
	);
	process.exit(1);
}

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const rank = await prisma.rank.findUnique({ where: { name: rankName } });
if (!rank) {
	const ranks = await prisma.rank.findMany({
		orderBy: { position: "asc" },
		select: { name: true },
	});
	console.error(
		`No rank "${rankName}". Available: ${ranks.map((r) => r.name).join(", ")}`,
	);
	process.exit(1);
}

const before = await prisma.employee.findUnique({
	where: { discordId },
	include: { rank: true },
});
const employee = await prisma.employee.upsert({
	where: { discordId },
	create: { discordId, name, rankId: rank.id },
	update: { name, rankId: rank.id, active: true },
});

// Same entry the panel writes, with the script as the actor
const changes = Object.fromEntries(
	(
		[
			["name", before?.name ?? null, name],
			["discordId", before?.discordId ?? null, discordId],
			["rank", before?.rank.name ?? null, rank.name],
			["active", before?.active ?? null, before ? true : null],
		] as const
	)
		.filter(([, from, to]) => from !== to)
		.map(([field, from, to]) => [field, [from, to]]),
);
if (Object.keys(changes).length) {
	await prisma.auditLog.create({
		data: {
			actorName: "Skrypt employee:add",
			action: before ? "EMPLOYEE_UPDATED" : "EMPLOYEE_CREATED",
			target: employee.name,
			targetId: employee.id,
			changes,
		},
	});
}
console.log(
	`Saved: ${employee.name} (${rank.name}), Discord ID ${employee.discordId}`,
);

await prisma.$disconnect();

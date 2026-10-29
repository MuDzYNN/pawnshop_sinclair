import "server-only";
import type { WebhookEvent } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function sendWebhook(
	event: WebhookEvent,
	body: object,
): Promise<"disabled" | "failed" | "sent"> {
	const webhook = await prisma.webhook.findUnique({ where: { event } });
	if (!webhook?.enabled) return "disabled";

	const response = await fetch(webhook.url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ allowed_mentions: { parse: [] }, ...body }),
		signal: AbortSignal.timeout(10_000),
	}).catch(() => null);
	return response?.ok ? "sent" : "failed";
}

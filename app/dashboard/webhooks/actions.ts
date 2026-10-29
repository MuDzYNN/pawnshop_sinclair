"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { WebhookEvent } from "@/app/generated/prisma/client";
import { audit, diff } from "@/lib/audit";
import type { ErrorCode } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/session";
import { sendWebhook } from "@/lib/webhooks";

export type FormState = {
	ok?: boolean;
	error?: ErrorCode;
	fieldErrors?: Partial<Record<"url", ErrorCode[]>>;
};

const webhookSchema = z.object({
	event: z.enum(WebhookEvent),
	url: z
		.string()
		.trim()
		.regex(
			/^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/,
			"WEBHOOK_URL_INVALID",
		)
		.or(z.literal("")),
	enabled: z.boolean(),
});

async function authorize() {
	const actor = await getCurrentEmployee();
	return hasPermission(actor, "MANAGE_WEBHOOKS") ? actor : null;
}

// The token is a secret, logs keep only its last characters
const maskUrl = (url: string) =>
	url.replace(/\/([\w-]+)$/, (_, token: string) => `/…${token.slice(-4)}`);

// An empty URL removes the webhook
export async function saveWebhook(
	_: FormState,
	formData: FormData,
): Promise<FormState> {
	const actor = await authorize();
	if (!actor) return { error: "WEBHOOKS_FORBIDDEN" };

	const parsed = webhookSchema.safeParse({
		event: formData.get("event"),
		url: formData.get("url"),
		enabled: formData.has("enabled"),
	});
	if (!parsed.success)
		return {
			fieldErrors: z.flattenError(
				parsed.error,
				(issue) => issue.message as ErrorCode,
			).fieldErrors,
		};
	const { event, url, enabled } = parsed.data;

	const before = await prisma.webhook.findUnique({ where: { event } });
	if (url)
		await prisma.webhook.upsert({
			where: { event },
			create: { event, url, enabled },
			update: { url, enabled },
		});
	else await prisma.webhook.deleteMany({ where: { event } });

	const changes = diff(
		before && { url: maskUrl(before.url), enabled: before.enabled },
		url ? { url: maskUrl(url), enabled } : null,
		["url", "enabled"],
	);
	if (Object.keys(changes).length) {
		await audit(actor, [
			{
				action: url ? "WEBHOOK_UPDATED" : "WEBHOOK_DELETED",
				target: event,
				changes,
			},
		]);
	}

	revalidatePath("/dashboard/webhooks");
	return { ok: true };
}

export async function testWebhook(event: WebhookEvent): Promise<FormState> {
	const actor = await authorize();
	if (!actor) return { error: "WEBHOOKS_FORBIDDEN" };

	const result = await sendWebhook(event, {
		content: "Testowa wiadomość z panelu Sinclair & CO.",
	});
	await audit(actor, [
		{
			action: "WEBHOOK_TESTED",
			target: event,
			changes: { result: [null, result] },
		},
	]);
	if (result === "disabled") return { error: "WEBHOOK_DISABLED" };
	if (result === "failed") return { error: "WEBHOOK_FAILED" };
	return { ok: true };
}

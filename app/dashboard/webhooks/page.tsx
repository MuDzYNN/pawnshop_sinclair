import { Suspense } from "react";
import { WebhookForm } from "@/app/dashboard/webhooks/webhook-form";
import { WebhookEvent } from "@/app/generated/prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

export default function WebhooksPage() {
	return (
		<Suspense fallback={<Skeleton className="m-4 flex-1 lg:m-6" />}>
			<Webhooks />
		</Suspense>
	);
}

async function Webhooks() {
	await requirePermission("MANAGE_WEBHOOKS");
	const webhooks = await prisma.webhook.findMany({
		select: { event: true, url: true, enabled: true },
	});

	return (
		<div className="flex max-w-3xl flex-col gap-4 p-4 lg:p-6">
			<div>
				<h2 className="text-xl font-semibold">Webhooki</h2>
				<p className="text-sm text-muted-foreground">
					Kanały Discorda, na które panel wysyła wiadomości.
				</p>
			</div>
			{Object.values(WebhookEvent).map((event) => (
				<WebhookForm
					key={event}
					event={event}
					webhook={webhooks.find(
						(webhook) => webhook.event === event,
					)}
				/>
			))}
		</div>
	);
}

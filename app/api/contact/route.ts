import type { ErrorCode } from "@/lib/errors";
import { sendWebhook } from "@/lib/webhooks";

const fail = (error: ErrorCode, status = 400) =>
	Response.json({ ok: false, error }, { status });

const LIMIT = 3;
const WINDOW = 10 * 60_000;
// Submission times per IP, in memory of this single instance
const submissions = new Map<string, number[]>();

function rateLimited(ip: string) {
	const now = Date.now();
	for (const [key, times] of submissions)
		if (now - times[times.length - 1] > WINDOW) submissions.delete(key);
	const times = (submissions.get(ip) ?? []).filter((time) => now - time < WINDOW);
	if (times.length >= LIMIT) return true;
	submissions.set(ip, [...times, now]);
	return false;
}

export async function POST(request: Request) {
	const body = await request.json().catch(() => null);
	if (!body) return fail("INVALID_REQUEST");

	// Honeypot or a too-fast submission means a bot
	if (body.website || Date.now() - Number(body.startedAt) < 3000)
		return Response.json({ ok: true });

	const nickname = String(body.nickname ?? "")
		.trim()
		.slice(0, 80);
	const category = String(body.category ?? "")
		.trim()
		.slice(0, 80);
	const details = String(body.details ?? "")
		.trim()
		.slice(0, 1200);
	const phone = String(body.phone ?? "")
		.trim()
		.slice(0, 30);
	if (!nickname || !category || details.length < 5 || !phone)
		return fail("FIELDS_REQUIRED");

	// Set by Cloudflare, the app is only reachable through the tunnel
	if (rateLimited(request.headers.get("cf-connecting-ip") ?? "local"))
		return fail("CONTACT_RATE_LIMITED", 429);

	const result = await sendWebhook("CONTACT", {
		embeds: [
			{
				title: "Nowe zapytanie — Sinclair & CO.",
				// Field values stop at 1024 characters, the description takes the whole text
				description: details,
				color: 0xc5a779,
				fields: [
					{
						name: "Imię / pseudonim",
						value: nickname,
						inline: true,
					},
					{ name: "Telefon", value: phone, inline: true },
					{ name: "Kategoria", value: category },
				],
				timestamp: new Date().toISOString(),
			},
		],
	});
	if (result === "disabled") return fail("CONTACT_UNAVAILABLE", 503);
	if (result === "failed") return fail("CONTACT_FAILED", 502);

	return Response.json({ ok: true });
}

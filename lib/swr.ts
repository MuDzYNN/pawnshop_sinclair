"use client";

import { useSyncExternalStore } from "react";
import { mutate, type Middleware } from "swr";

export const keys = {
	employees: "/api/dashboard/employees",
	ranks: "/api/dashboard/ranks",
	items: "/api/dashboard/items",
	buybacks: "/api/dashboard/buybacks",
	logs: "/api/dashboard/logs",
	sales: "/api/dashboard/sales",
	overview: "/api/dashboard/overview",
} as const;

// Rank changes also affect the employee list
export function revalidateRanks() {
	return Promise.all([mutate(keys.ranks), mutate(keys.employees)]);
}

// One cache entry per filter combination
const isBuybacksKey = (key: unknown) =>
	typeof key === "string" && key.startsWith(keys.buybacks);
const isSalesKey = (key: unknown) =>
	typeof key === "string" && key.startsWith(keys.sales);

// Other open tabs refresh right away instead of on focus
const channel =
	typeof window === "undefined" ? null : new BroadcastChannel("swr");
channel?.addEventListener("message", (event) => {
	if (event.data === "buybacks") mutate(isBuybacksKey);
	if (event.data === "sales") mutate(isSalesKey);
});

export function revalidateBuybacks() {
	channel?.postMessage("buybacks");
	return mutate(isBuybacksKey);
}

export function revalidateSales() {
	channel?.postMessage("sales");
	return mutate(isSalesKey);
}

export class FetchError extends Error {
	constructor(public status: number) {
		super(`Request failed (${status})`);
	}
}

export async function fetcher<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) throw new FetchError(response.status);
	return response.json();
}

// Count of in-flight SWR requests for the progress bar
let pending = 0;
// Shortest time the bar stays up, so fast refreshes are still noticeable
const MIN_VISIBLE = 600;
const listeners = new Set<() => void>();

function track<T>(promise: Promise<T>) {
	const update = (delta: number) => {
		pending += delta;
		listeners.forEach((listener) => listener());
	};
	const started = Date.now();
	update(1);
	return promise.finally(() =>
		setTimeout(() => update(-1), MIN_VISIBLE - (Date.now() - started)),
	);
}

export const trackValidating: Middleware =
	(useSWRNext) => (key, fn, config) => {
		const tracked =
			fn &&
			((...args: Parameters<typeof fn>) =>
				track(Promise.resolve(fn(...args))));
		return useSWRNext(key, tracked as typeof fn, config);
	};

export function useIsValidating() {
	return useSyncExternalStore(
		(listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		() => pending > 0,
		() => false,
	);
}

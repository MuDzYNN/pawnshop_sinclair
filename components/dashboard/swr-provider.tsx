"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { FetchError, fetcher, trackValidating } from "@/lib/swr";

export function SWRProvider({ children }: { children: ReactNode }) {
	const router = useRouter();

	return (
		<SWRConfig
			value={{
				fetcher,
				use: [trackValidating],
				refreshInterval: 60_000,
				keepPreviousData: true,
				// Expired session or revoked permission: the server redirects on refresh
				onError: (error) => {
					if (
						error instanceof FetchError &&
						(error.status === 401 || error.status === 403)
					)
						router.refresh();
				},
			}}
		>
			{children}
		</SWRConfig>
	);
}

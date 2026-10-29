"use client";

import { PlusIcon } from "lucide-react";
import useSWR from "swr";
import type { RanksData } from "@/app/dashboard/ranks/data";
import { RankDialog } from "@/app/dashboard/ranks/rank-dialog";
import { RanksTable } from "@/app/dashboard/ranks/ranks-table";
import { Button } from "@/components/ui/button";
import { keys } from "@/lib/swr";

export function RanksView({ fallback }: { fallback: RanksData }) {
	const { data = fallback } = useSWR<RanksData>(keys.ranks, {
		fallbackData: fallback,
	});

	return (
		<div className="flex flex-col gap-4 p-4 lg:p-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold">Rangi</h2>
					<p className="text-sm text-muted-foreground">
						Kolejność od najwyższej. Pracownik może zarządzać tylko
						osobami z niższych rang.
					</p>
				</div>
				<RankDialog
					trigger={
						<Button>
							<PlusIcon />
							Dodaj rangę
						</Button>
					}
				/>
			</div>
			<RanksTable ranks={data.ranks} ownRankId={data.ownRankId} />
		</div>
	);
}

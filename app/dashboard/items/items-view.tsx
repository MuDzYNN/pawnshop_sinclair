"use client";

import { PlusIcon } from "lucide-react";
import useSWR from "swr";
import { AddItemsDialog } from "@/app/dashboard/items/add-items-dialog";
import type { ItemsData } from "@/app/dashboard/items/data";
import { ItemsTable } from "@/app/dashboard/items/items-table";
import { Button } from "@/components/ui/button";
import { keys } from "@/lib/swr";

export function ItemsView({ fallback }: { fallback: ItemsData }) {
	const { data = fallback } = useSWR<ItemsData>(keys.items, {
		fallbackData: fallback,
	});

	return (
		<div className="flex flex-col gap-4 p-4 lg:p-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold">Cennik skupu</h2>
					<p className="text-sm text-muted-foreground">
						Ceny, po jakich lombard skupuje i sprzedaje przedmioty.
					</p>
				</div>
				{data.canManage && (
					<AddItemsDialog
						existing={data.items}
						canRestrict={data.canViewRestricted}
						trigger={
							<Button>
								<PlusIcon />
								Dodaj przedmioty
							</Button>
						}
					/>
				)}
			</div>
			<ItemsTable data={data} />
		</div>
	);
}

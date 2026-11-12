"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { ClientDialog } from "@/app/dashboard/clients/client-dialog";
import { ClientsTable } from "@/app/dashboard/clients/clients-table";
import type { ClientsData } from "@/app/dashboard/clients/data";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPrice } from "@/lib/format";
import { keys } from "@/lib/swr";

export function ClientsView({ fallback }: { fallback: ClientsData }) {
	const { data = fallback } = useSWR<ClientsData>(keys.clients, {
		fallbackData: fallback,
	});
	const [showArchived, setShowArchived] = useState(false);

	const clients = showArchived
		? data.clients
		: data.clients.filter((client) => !client.archived);
	const total = data.clients.reduce((sum, client) => sum + client.balance, 0);

	return (
		<div className="flex flex-col gap-4 p-4 lg:p-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold">Klienci</h2>
					<p className="text-sm text-muted-foreground">
						Łącznie na saldach:{" "}
						<span className="font-medium text-foreground tabular-nums">
							{formatPrice(total)}
						</span>
					</p>
				</div>
				<div className="flex items-center gap-4">
					<label className="flex items-center gap-2 text-sm">
						<Checkbox
							checked={showArchived}
							onCheckedChange={setShowArchived}
						/>
						Pokaż zarchiwizowanych
					</label>
					<ClientDialog
						trigger={
							<Button>
								<PlusIcon />
								Dodaj klienta
							</Button>
						}
					/>
				</div>
			</div>
			<ClientsTable clients={clients} />
		</div>
	);
}

"use client";

import useSWR from "swr";
import {
	BuybackSummary,
	type Line,
} from "@/app/dashboard/buyback/buyback-summary";
import { InventoryImport } from "@/app/dashboard/buyback/inventory-import";
import { ItemPicker, useQuantities } from "@/app/dashboard/buyback/item-picker";
import type { ClientsData } from "@/app/dashboard/clients/data";
import type { ItemsData } from "@/app/dashboard/items/data";
import { keys } from "@/lib/swr";

export function BuybackView({
	fallback,
	clientsFallback,
}: {
	fallback: ItemsData;
	clientsFallback: ClientsData | null;
}) {
	const { data = fallback } = useSWR<ItemsData>(keys.items, {
		fallbackData: fallback,
	});
	// Only employees allowed to pick a client get the list
	const { data: clientsData } = useSWR<ClientsData>(
		clientsFallback && keys.clients,
		{ fallbackData: clientsFallback ?? undefined },
	);
	const { quantities, setQuantity, addQuantities, cleared, clear } =
		useQuantities();

	// Items removed from the price list drop out of the transaction
	const lines: Line[] = data.items
		.filter((item) => quantities[item.id])
		.map((item) => ({ ...item, quantity: quantities[item.id] }));

	return (
		<div className="grid items-start gap-6 p-4 lg:grid-cols-[1fr_26rem] lg:p-6">
			<ItemPicker
				title="Skup"
				description="Wybierz przedmioty, które klient chce sprzedać."
				items={data.items}
				quantities={quantities}
				onChange={setQuantity}
				priceLabel="Cena skupu"
				price={(item) => item.buyPrice}
			/>
			<div className="flex flex-col gap-4">
				<div>
					<h2 className="text-xl font-semibold">Podsumowanie</h2>
					<p className="text-sm text-muted-foreground">
						Upewnij się, ze wprowadzone dane są poprawne!
					</p>
				</div>
				<BuybackSummary
					lines={lines}
					clients={clientsData?.clients.filter(
						(client) => !client.archived,
					)}
					onRemove={(id) => setQuantity(id, 0)}
					onClear={clear}
				/>
				<InventoryImport
					key={cleared}
					data={data}
					onImport={addQuantities}
				/>
			</div>
		</div>
	);
}

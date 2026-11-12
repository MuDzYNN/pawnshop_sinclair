"use client";

import {
	ArchiveIcon,
	ArchiveRestoreIcon,
	BanknoteArrowDownIcon,
	ContactIcon,
	EllipsisVerticalIcon,
	HistoryIcon,
	PencilIcon,
	SlidersHorizontalIcon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setClientArchived } from "@/app/dashboard/clients/actions";
import {
	BalanceDialog,
	type BalanceMode,
} from "@/app/dashboard/clients/balance-dialog";
import { ClientDetails } from "@/app/dashboard/clients/client-details";
import { ClientDialog } from "@/app/dashboard/clients/client-dialog";
import type { ClientsData } from "@/app/dashboard/clients/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { errorMessages } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { revalidateClients } from "@/lib/swr";

type Client = ClientsData["clients"][number];

export function ClientsTable({ clients }: { clients: Client[] }) {
	const [editing, setEditing] = useState<Client | null>(null);
	const [balance, setBalance] = useState<{
		client: Client;
		mode: BalanceMode;
	} | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const selected = clients.find((client) => client.id === selectedId) ?? null;

	function toggleArchived(client: Client) {
		startTransition(async () => {
			const result = await setClientArchived(client.id, !client.archived);
			if (result.error) {
				toast.error(errorMessages[result.error]);
				return;
			}
			revalidateClients();
			toast.success(
				client.archived
					? `Przywrócono: ${client.name}`
					: `Zarchiwizowano: ${client.name}`,
			);
		});
	}

	if (!clients.length) {
		return (
			<Empty className="border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ContactIcon />
					</EmptyMedia>
					<EmptyTitle>Brak klientów</EmptyTitle>
					<EmptyDescription>
						Dodaj klienta, żeby przyjmować od niego wpłaty i
						wybierać go przy skupie.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<>
			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader className="bg-muted">
						<TableRow>
							<TableHead>Klient</TableHead>
							<TableHead>Notatki</TableHead>
							<TableHead className="text-right">Saldo</TableHead>
							<TableHead className="w-12" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{clients.map((client) => (
							<TableRow
								key={client.id}
								className={
									client.archived ? "opacity-60" : undefined
								}
							>
								<TableCell>
									<button
										type="button"
										className="font-medium hover:underline"
										onClick={() => setSelectedId(client.id)}
									>
										{client.name}
									</button>
									{client.archived && (
										<Badge
											variant="outline"
											className="ml-2 text-muted-foreground"
										>
											Zarchiwizowany
										</Badge>
									)}
									<div className="text-xs text-muted-foreground">
										{client.phone || "—"}
									</div>
								</TableCell>
								<TableCell className="max-w-64 truncate text-muted-foreground">
									{client.notes}
								</TableCell>
								<TableCell className="text-right font-medium tabular-nums">
									{formatPrice(client.balance)}
								</TableCell>
								<TableCell>
									<DropdownMenu>
										<DropdownMenuTrigger
											render={
												<Button
													variant="ghost"
													size="icon"
													className="size-8"
													disabled={pending}
												/>
											}
										>
											<EllipsisVerticalIcon />
											<span className="sr-only">Akcje</span>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="end"
											className="w-48"
										>
											<DropdownMenuItem
												onClick={() =>
													setSelectedId(client.id)
												}
											>
												<HistoryIcon />
												Historia
											</DropdownMenuItem>
											{!client.archived && (
												<>
													<DropdownMenuItem
														onClick={() =>
															setBalance({
																client,
																mode: "deposit",
															})
														}
													>
														<BanknoteArrowDownIcon />
														Wpłata
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															setBalance({
																client,
																mode: "adjust",
															})
														}
													>
														<SlidersHorizontalIcon />
														Korekta salda
													</DropdownMenuItem>
												</>
											)}
											<DropdownMenuItem
												onClick={() => setEditing(client)}
											>
												<PencilIcon />
												Edytuj
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												variant={
													client.archived
														? "default"
														: "destructive"
												}
												onClick={() =>
													toggleArchived(client)
												}
											>
												{client.archived ? (
													<ArchiveRestoreIcon />
												) : (
													<ArchiveIcon />
												)}
												{client.archived
													? "Przywróć"
													: "Archiwizuj"}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{editing && (
				<ClientDialog
					key={editing.id}
					client={editing}
					open
					onOpenChange={(open) => !open && setEditing(null)}
				/>
			)}
			{balance && (
				<BalanceDialog
					key={`${balance.client.id}-${balance.mode}`}
					client={balance.client}
					mode={balance.mode}
					open
					onOpenChange={(open) => !open && setBalance(null)}
				/>
			)}
			<ClientDetails
				client={selected}
				onClose={() => setSelectedId(null)}
			/>
		</>
	);
}

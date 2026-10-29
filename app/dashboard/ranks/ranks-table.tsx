"use client";

import {
	ArrowDownIcon,
	ArrowUpIcon,
	EllipsisVerticalIcon,
	PencilIcon,
	Trash2Icon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Permission } from "@/app/generated/prisma/browser";
import {
	deleteRank,
	moveRank,
	type FormState,
} from "@/app/dashboard/ranks/actions";
import { RankDialog } from "@/app/dashboard/ranks/rank-dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { errorMessages } from "@/lib/errors";
import { permissions } from "@/lib/permissions";
import { revalidateRanks } from "@/lib/swr";

type RankRow = {
	id: string;
	name: string;
	permissions: Permission[];
	employees: number;
};

export function RanksTable({
	ranks,
	ownRankId,
}: {
	ranks: RankRow[];
	ownRankId: string;
}) {
	const [editing, setEditing] = useState<RankRow | null>(null);
	const [deleting, setDeleting] = useState<RankRow | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pending, startTransition] = useTransition();

	function run(action: () => Promise<FormState>, success?: string) {
		startTransition(async () => {
			const result = await action();
			if (result.error) {
				toast.error(errorMessages[result.error]);
				return;
			}
			revalidateRanks();
			if (success) toast.success(success);
		});
	}

	return (
		<>
			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader className="bg-muted">
						<TableRow>
							<TableHead className="w-20">Kolejność</TableHead>
							<TableHead>Nazwa</TableHead>
							<TableHead>Uprawnienia</TableHead>
							<TableHead className="text-right">
								Pracownicy
							</TableHead>
							<TableHead className="w-12" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{ranks.map((rank, index) => (
							<TableRow key={rank.id}>
								<TableCell>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label="Wyżej"
											disabled={pending || index === 0}
											onClick={() =>
												run(() =>
													moveRank(rank.id, "up"),
												)
											}
										>
											<ArrowUpIcon />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label="Niżej"
											disabled={
												pending ||
												index === ranks.length - 1
											}
											onClick={() =>
												run(() =>
													moveRank(rank.id, "down"),
												)
											}
										>
											<ArrowDownIcon />
										</Button>
									</div>
								</TableCell>
								<TableCell className="font-medium">
									{rank.name}
									{rank.id === ownRankId && (
										<Badge
											variant="outline"
											className="ml-2 text-muted-foreground"
										>
											Twoja ranga
										</Badge>
									)}
								</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1">
										{rank.permissions.length ? (
											permissions
												.filter((permission) =>
													rank.permissions.includes(
														permission.value,
													),
												)
												.map((permission) => (
													<Badge
														key={permission.value}
														variant="secondary"
													>
														{permission.label}
													</Badge>
												))
										) : (
											<span className="text-muted-foreground">
												Brak
											</span>
										)}
									</div>
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{rank.employees}
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
											<span className="sr-only">
												Akcje
											</span>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="end"
											className="w-40"
										>
											<DropdownMenuItem
												onClick={() => setEditing(rank)}
											>
												<PencilIcon />
												Edytuj
											</DropdownMenuItem>
											<DropdownMenuItem
												variant="destructive"
												disabled={rank.employees > 0}
												onClick={() => {
													setDeleting(rank);
													setConfirmOpen(true);
												}}
											>
												<Trash2Icon />
												Usuń
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
				<RankDialog
					key={editing.id}
					rank={editing}
					open
					onOpenChange={(open) => !open && setEditing(null)}
				/>
			)}
			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Usunąć rangę „{deleting?.name}”?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Tej operacji nie można cofnąć.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Anuluj</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => {
								setConfirmOpen(false);
								if (deleting)
									run(
										() => deleteRank(deleting.id),
										"Usunięto rangę",
									);
							}}
						>
							Usuń
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

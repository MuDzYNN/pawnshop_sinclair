"use client";

import {
	CircleCheckIcon,
	CircleOffIcon,
	EllipsisVerticalIcon,
	PencilIcon,
	UsersIcon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { setEmployeeActive } from "@/app/dashboard/employees/actions";
import { EmployeeDialog } from "@/app/dashboard/employees/employee-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
import { keys } from "@/lib/swr";

type Rank = { id: string; name: string };
type EmployeeRow = {
	id: string;
	discordId: string;
	name: string;
	active: boolean;
	linked: boolean;
	manageable: boolean;
	rank: Rank;
};

export function EmployeesTable({
	employees,
	ranks,
}: {
	employees: EmployeeRow[];
	ranks: Rank[];
}) {
	const [editing, setEditing] = useState<EmployeeRow | null>(null);
	const [pending, startTransition] = useTransition();

	function toggleActive(employee: EmployeeRow) {
		startTransition(async () => {
			const result = await setEmployeeActive(
				employee.id,
				!employee.active,
			);
			if (result.error) {
				toast.error(errorMessages[result.error]);
				return;
			}
			mutate(keys.employees);
			toast.success(
				employee.active
					? `Dezaktywowano: ${employee.name}`
					: `Przywrócono: ${employee.name}`,
			);
		});
	}

	if (!employees.length) {
		return (
			<Empty className="border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<UsersIcon />
					</EmptyMedia>
					<EmptyTitle>Brak pracowników</EmptyTitle>
					<EmptyDescription>
						Dodaj pierwszego pracownika, żeby mógł zalogować się do
						panelu.
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
							<TableHead>Pracownik</TableHead>
							<TableHead>Ranga</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Konto</TableHead>
							<TableHead className="w-12" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{employees.map((employee) => (
							<TableRow
								key={employee.id}
								className={
									employee.active ? undefined : "opacity-60"
								}
							>
								<TableCell>
									<div className="font-medium">
										{employee.name}
									</div>
									<div className="font-mono text-xs text-muted-foreground">
										{employee.discordId}
									</div>
								</TableCell>
								<TableCell>
									<Badge variant="secondary">
										{employee.rank.name}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge
										variant="outline"
										className="text-muted-foreground"
									>
										{employee.active ? (
											<CircleCheckIcon className="fill-green-500 text-background dark:fill-green-400" />
										) : (
											<CircleOffIcon />
										)}
										{employee.active
											? "Aktywny"
											: "Nieaktywny"}
									</Badge>
								</TableCell>
								<TableCell className="text-muted-foreground">
									{employee.linked
										? "Połączone"
										: "Jeszcze się nie logował"}
								</TableCell>
								<TableCell>
									{employee.manageable && (
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
												className="w-44"
											>
												<DropdownMenuItem
													onClick={() =>
														setEditing(employee)
													}
												>
													<PencilIcon />
													Edytuj
												</DropdownMenuItem>
												<DropdownMenuItem
													variant={
														employee.active
															? "destructive"
															: "default"
													}
													onClick={() =>
														toggleActive(employee)
													}
												>
													{employee.active ? (
														<CircleOffIcon />
													) : (
														<CircleCheckIcon />
													)}
													{employee.active
														? "Dezaktywuj"
														: "Przywróć"}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{editing && (
				<EmployeeDialog
					key={editing.id}
					ranks={ranks}
					employee={editing}
					open
					onOpenChange={(open) => !open && setEditing(null)}
				/>
			)}
		</>
	);
}

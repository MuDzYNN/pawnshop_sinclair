"use client";

import { PlusIcon } from "lucide-react";
import useSWR from "swr";
import type { EmployeesData } from "@/app/dashboard/employees/data";
import { EmployeeDialog } from "@/app/dashboard/employees/employee-dialog";
import { EmployeesTable } from "@/app/dashboard/employees/employees-table";
import { Button } from "@/components/ui/button";
import { keys } from "@/lib/swr";

export function EmployeesView({ fallback }: { fallback: EmployeesData }) {
	const { data = fallback } = useSWR<EmployeesData>(keys.employees, {
		fallbackData: fallback,
	});

	return (
		<div className="flex flex-col gap-4 p-4 lg:p-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold">Pracownicy</h2>
					<p className="text-sm text-muted-foreground">
						Osoby z dostępem do panelu. Logują się kontem Discord o
						podanym ID.
					</p>
				</div>
				<EmployeeDialog
					ranks={data.ranks}
					trigger={
						<Button>
							<PlusIcon />
							Dodaj pracownika
						</Button>
					}
				/>
			</div>
			<EmployeesTable employees={data.employees} ranks={data.ranks} />
		</div>
	);
}

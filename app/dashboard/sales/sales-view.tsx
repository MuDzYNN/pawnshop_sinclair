"use client";

import {
	ChevronLeftIcon,
	ChevronRightIcon,
	FilterXIcon,
	SearchIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import useSWR from "swr";
import { SortHead, Stat } from "@/app/dashboard/buybacks/buybacks-view";
import { DateRangeFilter } from "@/app/dashboard/buybacks/date-range-filter";
import type { SalesData } from "@/app/dashboard/sales/data";
import { SaleDetails } from "@/app/dashboard/sales/sale-details";
import { SaleStatus, statusLabels } from "@/app/dashboard/sales/sale-status";
import { Button } from "@/components/ui/button";
import { ExportMenu } from "@/components/dashboard/export-menu";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatPrice } from "@/lib/format";
import { keys } from "@/lib/swr";

type Sort = "createdAt" | "value";

const FILTERS = ["q", "from", "to", "employee", "status"];

const statusFilters = [
	{ value: "all", label: "Wszystkie statusy" },
	{ value: "PENDING", label: statusLabels.PENDING },
	{ value: "SETTLED", label: statusLabels.SETTLED },
];

export function SalesView({
	employees,
}: {
	employees?: { id: string; name: string }[];
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { data } = useSWR<SalesData>(`${keys.sales}?${searchParams}`);
	const [query, setQuery] = useState(searchParams.get("q") ?? "");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

	const sort = searchParams.get("sort") ?? "createdAt";
	const order = searchParams.get("order") ?? "desc";
	const page = Number(searchParams.get("page")) || 1;
	const pages = data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1;
	const filtered = FILTERS.some((key) => searchParams.has(key));
	// Looked up in fresh data, so settling shows up in the open details
	const selected = data?.sales.find((sale) => sale.id === selectedId) ?? null;
	const columns = employees ? 6 : 5;

	// Any change other than the page itself goes back to the first page
	function update(changes: Record<string, string | undefined>) {
		const params = new URLSearchParams(searchParams);
		for (const [key, value] of Object.entries(changes)) {
			if (value) params.set(key, value);
			else params.delete(key);
		}
		if (!("page" in changes)) params.delete("page");
		router.replace(params.size ? `${pathname}?${params}` : pathname, {
			scroll: false,
		});
	}

	function search(value: string) {
		setQuery(value);
		clearTimeout(debounce.current);
		debounce.current = setTimeout(
			() => update({ q: value.trim() || undefined }),
			300,
		);
	}

	function sortBy(column: Sort) {
		update({
			sort: column,
			order: sort === column && order === "desc" ? "asc" : "desc",
		});
	}

	function clearFilters() {
		setQuery("");
		update(Object.fromEntries(FILTERS.map((key) => [key, undefined])));
	}

	return (
		<div className="flex flex-col gap-4 p-4 lg:p-6">
			<div>
				<h2 className="text-xl font-semibold">Sprzedaże PostOP</h2>
				<p className="text-sm text-muted-foreground">
					{employees
						? "Sprzedaże wszystkich pracowników."
						: "Twoje sprzedaże."}{" "}
					Oczekujące czekają na rozliczenie przez PostOP.
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				<Stat
					label="Liczba sprzedaży"
					value={data && String(data.total)}
				/>
				<Stat
					label="Wartość sprzedaży"
					value={data && formatPrice(data.sums.value)}
				/>
				<Stat
					label={
						data
							? `Do rozliczenia (${data.sums.pendingCount})`
							: "Do rozliczenia"
					}
					value={data && formatPrice(data.sums.pending)}
					className={
						data?.sums.pending
							? "text-amber-600 dark:text-amber-400"
							: undefined
					}
				/>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<InputGroup className="max-w-xs">
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
					<InputGroupInput
						placeholder="Numer lub przedmiot…"
						value={query}
						onChange={(e) => search(e.target.value)}
					/>
				</InputGroup>
				<DateRangeFilter
					from={searchParams.get("from") ?? undefined}
					to={searchParams.get("to") ?? undefined}
					onChange={(from, to) => update({ from, to })}
				/>
				<Select
					items={statusFilters}
					value={searchParams.get("status") ?? "all"}
					onValueChange={(value) =>
						update({
							status:
								value && value !== "all" ? value : undefined,
						})
					}
				>
					<SelectTrigger className="w-44">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{statusFilters.map((status) => (
							<SelectItem key={status.value} value={status.value}>
								{status.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{employees && (
					<Select
						items={[
							{ value: "all", label: "Wszyscy pracownicy" },
							...employees.map((employee) => ({
								value: employee.id,
								label: employee.name,
							})),
						]}
						value={searchParams.get("employee") ?? "all"}
						onValueChange={(value) =>
							update({
								employee:
									value && value !== "all"
										? value
										: undefined,
							})
						}
					>
						<SelectTrigger className="w-52">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								Wszyscy pracownicy
							</SelectItem>
							{employees.map((employee) => (
								<SelectItem
									key={employee.id}
									value={employee.id}
								>
									{employee.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
				{filtered && (
					<Button variant="ghost" onClick={clearFilters}>
						<FilterXIcon />
						Wyczyść filtry
					</Button>
				)}
				<ExportMenu
					href={(format) => {
						const params = new URLSearchParams(searchParams);
						params.set("format", format);
						return `${keys.sales}/export?${params}`;
					}}
				/>
			</div>
			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader className="bg-muted">
						<TableRow>
							<SortHead
								label="Data"
								column="createdAt"
								sort={sort}
								order={order}
								onSort={sortBy}
							/>
							<TableHead>Numer</TableHead>
							{employees && <TableHead>Pracownik</TableHead>}
							<TableHead>Przedmioty</TableHead>
							<TableHead className="w-0">Status</TableHead>
							<SortHead
								label="Wartość"
								column="value"
								sort={sort}
								order={order}
								onSort={sortBy}
								className="w-0 text-right"
							/>
						</TableRow>
					</TableHeader>
					<TableBody>
						{!data &&
							Array.from({ length: 8 }, (_, index) => (
								<TableRow key={index}>
									<TableCell colSpan={columns}>
										<Skeleton className="h-5" />
									</TableCell>
								</TableRow>
							))}
						{data?.sales.map((sale) => (
							<TableRow
								key={sale.id}
								className="cursor-pointer [&>td]:py-1.5"
								onClick={() => setSelectedId(sale.id)}
							>
								<TableCell className="tabular-nums">
									{formatDateTime(sale.createdAt)}
								</TableCell>
								<TableCell className="font-mono text-xs text-muted-foreground">
									{sale.number}
								</TableCell>
								{employees && (
									<TableCell>{sale.employee.name}</TableCell>
								)}
								<TableCell>
									<div className="max-w-80 truncate">
										{sale.lines
											.map(
												(line) =>
													`${line.name}${line.note ? ` (${line.note})` : ""} ×${line.quantity}`,
											)
											.join(", ")}
									</div>
								</TableCell>
								<TableCell>
									<SaleStatus status={sale.status} />
								</TableCell>
								<TableCell className="text-right font-medium tabular-nums">
									{formatPrice(sale.value)}
								</TableCell>
							</TableRow>
						))}
						{data && !data.sales.length && (
							<TableRow>
								<TableCell
									colSpan={columns}
									className="h-24 text-center text-muted-foreground"
								>
									{filtered
										? "Brak sprzedaży dla wybranych filtrów."
										: "Nie ma jeszcze żadnych sprzedaży."}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{data && data.total > data.pageSize && (
				<div className="flex items-center justify-end gap-2 text-sm text-muted-foreground tabular-nums">
					<span className="mr-2">
						{(page - 1) * data.pageSize + 1}–
						{Math.min(page * data.pageSize, data.total)} z{" "}
						{data.total}
					</span>
					<Button
						variant="outline"
						size="icon"
						disabled={page <= 1}
						onClick={() =>
							update({
								page: page > 2 ? String(page - 1) : undefined,
							})
						}
					>
						<ChevronLeftIcon />
						<span className="sr-only">Poprzednia strona</span>
					</Button>
					<Button
						variant="outline"
						size="icon"
						disabled={page >= pages}
						onClick={() => update({ page: String(page + 1) })}
					>
						<ChevronRightIcon />
						<span className="sr-only">Następna strona</span>
					</Button>
				</div>
			)}
			<SaleDetails
				sale={selected}
				canSettle={!!data?.canSettle}
				onClose={() => setSelectedId(null)}
			/>
		</div>
	);
}

"use client";

import {
	ArrowDownIcon,
	ArrowUpDownIcon,
	ArrowUpIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	FilterXIcon,
	SearchIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import useSWR from "swr";
import { formatBonus } from "@/app/dashboard/buyback/totals";
import { BuybackDetails } from "@/app/dashboard/buybacks/buyback-details";
import type { BuybacksData } from "@/app/dashboard/buybacks/data";
import { DateRangeFilter } from "@/app/dashboard/buybacks/date-range-filter";
import { Button } from "@/components/ui/button";
import { ExportMenu } from "@/components/dashboard/export-menu";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

type Buyback = BuybacksData["buybacks"][number];
type Sort = "createdAt" | "payout" | "profit";

const FILTERS = ["q", "from", "to", "employee"];

export function BuybacksView({
	employees,
}: {
	employees?: { id: string; name: string }[];
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { data } = useSWR<BuybacksData>(`${keys.buybacks}?${searchParams}`);
	const [query, setQuery] = useState(searchParams.get("q") ?? "");
	const [selected, setSelected] = useState<Buyback | null>(null);
	const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

	const sort = searchParams.get("sort") ?? "createdAt";
	const order = searchParams.get("order") ?? "desc";
	const page = Number(searchParams.get("page")) || 1;
	const pages = data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1;
	const filtered = FILTERS.some((key) => searchParams.has(key));

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
				<h2 className="text-xl font-semibold">Transakcje</h2>
				<p className="text-sm text-muted-foreground">
					{employees
						? "Historia skupów wszystkich pracowników."
						: "Historia Twoich skupów."}
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				<Stat
					label="Liczba transakcji"
					value={data && String(data.total)}
				/>
				<Stat
					label="Wypłacono klientom"
					value={data && formatPrice(data.sums.payout)}
				/>
				<Stat
					label="Zysk lombardu"
					value={data && formatPrice(data.sums.profit)}
					className={cn(
						data && data.sums.profit < 0 && "text-destructive",
					)}
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
						return `${keys.buybacks}/export?${params}`;
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
							<TableHead className="w-0 text-right">
								Bonus
							</TableHead>
							<SortHead
								label="Do wypłaty"
								column="payout"
								sort={sort}
								order={order}
								onSort={sortBy}
								className="w-0 text-right"
							/>
							<SortHead
								label="Zysk"
								column="profit"
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
									<TableCell colSpan={employees ? 7 : 6}>
										<Skeleton className="h-5" />
									</TableCell>
								</TableRow>
							))}
						{data?.buybacks.map((buyback) => (
							<TableRow
								key={buyback.id}
								className="cursor-pointer [&>td]:py-1.5"
								onClick={() => setSelected(buyback)}
							>
								<TableCell className="tabular-nums">
									{formatDateTime(buyback.createdAt)}
								</TableCell>
								<TableCell className="font-mono text-xs text-muted-foreground">
									{buyback.number}
								</TableCell>
								{employees && (
									<TableCell>
										{buyback.employee.name}
									</TableCell>
								)}
								<TableCell>
									<div className="max-w-80 truncate">
										{buyback.lines
											.map(
												(line) =>
													`${line.name}${line.note ? ` (${line.note})` : ""} ×${line.quantity}`,
											)
											.join(", ")}
									</div>
								</TableCell>
								<TableCell className="text-right text-muted-foreground tabular-nums">
									{formatBonus(
										buyback.bonusPercent,
										buyback.bonusAmount,
										formatPrice,
									) || "—"}
								</TableCell>
								<TableCell className="text-right font-medium tabular-nums">
									{formatPrice(buyback.payout)}
								</TableCell>
								<TableCell
									className={cn(
										"text-right tabular-nums",
										buyback.profit < 0 &&
											"text-destructive",
										buyback.profit > 0 &&
											"text-emerald-500",
									)}
								>
									{formatPrice(buyback.profit)}
								</TableCell>
							</TableRow>
						))}
						{data && !data.buybacks.length && (
							<TableRow>
								<TableCell
									colSpan={employees ? 7 : 6}
									className="h-24 text-center text-muted-foreground"
								>
									{filtered
										? "Brak transakcji dla wybranych filtrów."
										: "Nie ma jeszcze żadnych transakcji."}
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
			<BuybackDetails
				buyback={selected}
				onClose={() => setSelected(null)}
			/>
		</div>
	);
}

export function Stat({
	label,
	value,
	className,
}: {
	label: string;
	value?: string;
	className?: string;
}) {
	return (
		<Card size="sm">
			<CardHeader>
				<CardDescription>{label}</CardDescription>
				<CardTitle className={cn("text-2xl tabular-nums", className)}>
					{value ?? <Skeleton className="h-8 w-24" />}
				</CardTitle>
			</CardHeader>
		</Card>
	);
}

type SortHeadProps<T extends string> = {
	label: string;
	column: T;
	sort: string;
	order: string;
	onSort: (column: T) => void;
	className?: string;
};

export function SortHead<T extends string>({
	label,
	column,
	sort,
	order,
	onSort,
	className,
}: SortHeadProps<T>) {
	const Icon =
		sort !== column
			? ArrowUpDownIcon
			: order === "asc"
				? ArrowUpIcon
				: ArrowDownIcon;
	return (
		<TableHead className={className}>
			<Button
				variant="ghost"
				size="sm"
				className="-mx-2"
				onClick={() => onSort(column)}
			>
				{label}
				<Icon
					className={cn(sort !== column && "text-muted-foreground")}
				/>
			</Button>
		</TableHead>
	);
}

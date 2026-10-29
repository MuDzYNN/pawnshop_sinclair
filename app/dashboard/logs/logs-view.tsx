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
import { DateRangeFilter } from "@/app/dashboard/buybacks/date-range-filter";
import type { LogsData } from "@/app/dashboard/logs/data";
import {
	actionLabels,
	categories,
	fieldLabel,
	formatValue,
} from "@/app/dashboard/logs/labels";
import { events } from "@/app/dashboard/webhooks/webhook-form";
import type { WebhookEvent } from "@/app/generated/prisma/browser";
import { Button } from "@/components/ui/button";
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
import { formatDateTime } from "@/lib/format";
import { keys } from "@/lib/swr";
import { cn } from "@/lib/utils";

type Log = LogsData["logs"][number];

const FILTERS = ["q", "from", "to", "employee", "category"];

export function LogsView({
	employees,
}: {
	employees: { id: string; name: string }[];
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { data } = useSWR<LogsData>(`${keys.logs}?${searchParams}`);
	const [query, setQuery] = useState(searchParams.get("q") ?? "");
	const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

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

	function clearFilters() {
		setQuery("");
		update(Object.fromEntries(FILTERS.map((key) => [key, undefined])));
	}

	return (
		<div className="flex flex-col gap-4 p-4 lg:p-6">
			<div>
				<h2 className="text-xl font-semibold">Logi</h2>
				<p className="text-sm text-muted-foreground">
					Kto, co i kiedy zmienił w panelu.
				</p>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<InputGroup className="max-w-xs">
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
					<InputGroupInput
						placeholder="Obiekt lub osoba…"
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
								value && value !== "all" ? value : undefined,
						})
					}
				>
					<SelectTrigger className="w-52">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Wszyscy pracownicy</SelectItem>
						{employees.map((employee) => (
							<SelectItem key={employee.id} value={employee.id}>
								{employee.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					items={[
						{ value: "all", label: "Wszystkie akcje" },
						...Object.entries(categories).map(
							([value, category]) => ({
								value,
								label: category.label,
							}),
						),
					]}
					value={searchParams.get("category") ?? "all"}
					onValueChange={(value) =>
						update({
							category:
								value && value !== "all" ? value : undefined,
						})
					}
				>
					<SelectTrigger className="w-44">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Wszystkie akcje</SelectItem>
						{Object.entries(categories).map(([value, category]) => (
							<SelectItem key={value} value={value}>
								{category.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{filtered && (
					<Button variant="ghost" onClick={clearFilters}>
						<FilterXIcon />
						Wyczyść filtry
					</Button>
				)}
			</div>
			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader className="bg-muted">
						<TableRow>
							<TableHead className="w-0">Data</TableHead>
							<TableHead className="w-0">Kto</TableHead>
							<TableHead className="w-0">Akcja</TableHead>
							<TableHead className="w-0">Obiekt</TableHead>
							<TableHead>Zmiany</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{!data &&
							Array.from({ length: 8 }, (_, index) => (
								<TableRow key={index}>
									<TableCell colSpan={5}>
										<Skeleton className="h-5" />
									</TableCell>
								</TableRow>
							))}
						{data?.logs.map((log) => (
							<TableRow
								key={log.id}
								className="[&>td]:py-1.5 [&>td]:align-top"
							>
								<TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
									{formatDateTime(log.createdAt)}
								</TableCell>
								<TableCell className="whitespace-nowrap">
									{log.actorName}
								</TableCell>
								<TableCell
									className={cn(
										"whitespace-nowrap",
										(log.action.endsWith("_CREATED") ||
											log.action ===
												"BUYBACK_COMPLETED") &&
											"text-emerald-500",
										(log.action.endsWith("_DELETED") ||
											log.action.endsWith("_DENIED")) &&
											"text-destructive",
									)}
								>
									{actionLabels[log.action]}
								</TableCell>
								<TableCell className="font-medium whitespace-nowrap">
									{targetLabel(log)}
								</TableCell>
								<TableCell className="whitespace-normal">
									<ChangeList log={log} />
								</TableCell>
							</TableRow>
						))}
						{data && !data.logs.length && (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-24 text-center text-muted-foreground"
								>
									{filtered
										? "Brak wpisów dla wybranych filtrów."
										: "Nie ma jeszcze żadnych wpisów."}
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
		</div>
	);
}

// Webhook entries store the event, denied logins the Discord ID
function targetLabel(log: Log) {
	if (log.action.startsWith("WEBHOOK_"))
		return events[log.target as WebhookEvent]?.title ?? log.target;
	if (log.action === "LOGIN_DENIED") return `Discord ID ${log.target}`;
	return log.target;
}

// New records show values, deleted ones what they had, edits both sides
function ChangeList({ log }: { log: Log }) {
	const entries = Object.entries(log.changes ?? {});
	if (!entries.length)
		return <span className="text-muted-foreground">—</span>;
	return (
		<ul className="flex flex-col gap-0.5">
			{entries.map(([field, [from, to]]) => (
				<li key={field}>
					<span className="text-muted-foreground">
						{fieldLabel(field)}:{" "}
					</span>
					{from !== null && to !== null ? (
						<>
							<span className="text-muted-foreground line-through">
								{formatValue(field, from)}
							</span>
							{" → "}
							<span>{formatValue(field, to)}</span>
						</>
					) : (
						<span
							className={cn(
								to === null && "text-muted-foreground",
							)}
						>
							{formatValue(field, to ?? from)}
						</span>
					)}
				</li>
			))}
		</ul>
	);
}

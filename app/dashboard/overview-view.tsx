"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import useSWR from "swr";
import { Stat } from "@/app/dashboard/buybacks/buybacks-view";
import type { OverviewData } from "@/app/dashboard/data";
import { SaleStatus } from "@/app/dashboard/sales/sale-status";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDateTime, formatPrice } from "@/lib/format";
import { keys } from "@/lib/swr";
import { cn } from "@/lib/utils";

const RANGES = [
	{ value: "7", label: "7 dni" },
	{ value: "30", label: "30 dni" },
	{ value: "90", label: "90 dni" },
];

// Categorical slots validated for CVD against the dark card surface
const chartConfig = {
	payout: { label: "Wypłacono", color: "#3987e5" },
	profit: { label: "Zysk", color: "#d95926" },
	sales: { label: "Sprzedaż PostOP", color: "#199e70" },
} satisfies ChartConfig;

type Series = keyof typeof chartConfig;

const dayFormat = new Intl.DateTimeFormat("pl-PL", {
	day: "numeric",
	month: "short",
	timeZone: "UTC",
});
const formatDay = (date: string) => dayFormat.format(new Date(date));
const compactFormat = new Intl.NumberFormat("pl-PL", { notation: "compact" });

export function OverviewView({
	allBuybacks,
	allSales,
}: {
	allBuybacks: boolean;
	allSales: boolean;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const range = searchParams.get("range") ?? "30";
	const { data } = useSWR<OverviewData>(`${keys.overview}?range=${range}`);

	function setRange(value: string) {
		router.replace(
			value === "30" ? pathname : `${pathname}?range=${value}`,
			{ scroll: false },
		);
	}

	return (
		<div className="flex flex-col gap-4 p-4 lg:p-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold">Pulpit</h2>
					<p className="text-sm text-muted-foreground">
						{allBuybacks
							? "Skup i sprzedaż całego lombardu"
							: "Twój skup i sprzedaż"}{" "}
						z ostatnich{" "}
						{RANGES.find((option) => option.value === range)
							?.label ?? "30 dni"}
						.
					</p>
				</div>
				<ToggleGroup
					multiple={false}
					value={[range]}
					onValueChange={(value) => value[0] && setRange(value[0])}
					variant="outline"
				>
					{RANGES.map((option) => (
						<ToggleGroupItem
							key={option.value}
							value={option.value}
						>
							{option.label}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<Stat
					label={
						data
							? `Wypłacono klientom (${data.totals.buybacks})`
							: "Wypłacono klientom"
					}
					value={data && formatPrice(data.totals.payout)}
				/>
				<Stat
					label="Zysk lombardu"
					value={data && formatPrice(data.totals.profit)}
					className={cn(
						data && data.totals.profit < 0 && "text-destructive",
					)}
				/>
				<Stat
					label={
						data
							? `Sprzedano do PostOP (${data.totals.sales})`
							: "Sprzedano do PostOP"
					}
					value={data && formatPrice(data.totals.salesValue)}
				/>
				<Stat
					label={
						data
							? `Do rozliczenia z PostOP (${data.pending.count})`
							: "Do rozliczenia z PostOP"
					}
					value={data && formatPrice(data.pending.value)}
					className={cn(
						data && data.pending.value > 0 && "text-amber-400",
					)}
				/>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Dzień po dniu</CardTitle>
					<CardDescription>
						Kwoty skupu i sprzedaży do PostOP w kolejnych dniach, w
						$
					</CardDescription>
				</CardHeader>
				<CardContent className="px-2 sm:px-6">
					{data ? (
						<ChartContainer
							config={chartConfig}
							className="aspect-auto h-72 w-full"
						>
							<LineChart
								data={data.chart}
								margin={{ left: 8, right: 8 }}
							>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="date"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									minTickGap={32}
									tickFormatter={formatDay}
								/>
								<YAxis
									tickLine={false}
									axisLine={false}
									width={64}
									tickFormatter={(value: number) =>
										compactFormat.format(value)
									}
								/>
								<ChartTooltip
									content={
										<ChartTooltipContent
											className="min-w-48"
											labelFormatter={(_, payload) =>
												formatDay(
													payload[0]?.payload.date,
												)
											}
											formatter={(value, name, item) => (
												<>
													<div
														className="size-2.5 shrink-0 rounded-xs"
														style={{
															background:
																item.color,
														}}
													/>
													<span className="text-muted-foreground">
														{
															chartConfig[
																name as Series
															].label
														}
													</span>
													<span className="ml-auto font-medium tabular-nums">
														{formatPrice(
															Number(value),
														)}
													</span>
												</>
											)}
										/>
									}
								/>
								<ChartLegend content={<ChartLegendContent />} />
								{(Object.keys(chartConfig) as Series[]).map(
									(series) => (
										<Line
											key={series}
											dataKey={series}
											type="linear"
											stroke={`var(--color-${series})`}
											strokeWidth={2}
											dot={false}
											activeDot={{ r: 4 }}
										/>
									),
								)}
							</LineChart>
						</ChartContainer>
					) : (
						<Skeleton className="h-72" />
					)}
				</CardContent>
			</Card>
			<div className="grid gap-4 xl:grid-cols-2">
				<RecentCard
					title="Ostatnie skupy"
					href="/dashboard/buybacks"
					employees={allBuybacks}
					rows={data?.recentBuybacks.map((buyback) => ({
						...buyback,
						amount: (
							<>
								{formatPrice(buyback.payout)}
								<span
									className={cn(
										"ml-2 text-xs",
										buyback.profit < 0 &&
											"text-destructive",
										buyback.profit > 0 &&
											"text-emerald-500",
									)}
								>
									{buyback.profit > 0 && "+"}
									{formatPrice(buyback.profit)}
								</span>
							</>
						),
					}))}
					empty="Nie ma jeszcze żadnych transakcji."
				/>
				<RecentCard
					title="Ostatnie sprzedaże PostOP"
					href="/dashboard/sales"
					employees={allSales}
					rows={data?.recentSales.map((sale) => ({
						...sale,
						amount: (
							<span className="inline-flex items-center gap-2">
								<SaleStatus status={sale.status} />
								{formatPrice(sale.value)}
							</span>
						),
					}))}
					empty="Nie ma jeszcze żadnych sprzedaży."
				/>
			</div>
		</div>
	);
}

type RecentRow = {
	id: string;
	number: string;
	createdAt: string;
	employee: { name: string };
	amount: React.ReactNode;
};

function RecentCard({
	title,
	href,
	employees,
	rows,
	empty,
}: {
	title: string;
	href: string;
	employees: boolean;
	rows?: RecentRow[];
	empty: string;
}) {
	const router = useRouter();

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardAction>
					<Button
						variant="ghost"
						size="sm"
						nativeButton={false}
						render={<Link href={href} />}
					>
						Wszystkie
						<ArrowRightIcon />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Data</TableHead>
							<TableHead className="hidden sm:table-cell">
								Numer
							</TableHead>
							{employees && (
								<TableHead className="hidden sm:table-cell">
									Pracownik
								</TableHead>
							)}
							<TableHead className="text-right">Kwota</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{!rows &&
							Array.from({ length: 5 }, (_, index) => (
								<TableRow key={index}>
									<TableCell colSpan={4}>
										<Skeleton className="h-5" />
									</TableCell>
								</TableRow>
							))}
						{rows?.map((row) => (
							<TableRow
								key={row.id}
								className="cursor-pointer [&>td]:py-1.5"
								onClick={() =>
									router.push(`${href}?q=${row.number}`)
								}
							>
								<TableCell className="tabular-nums">
									{formatDateTime(row.createdAt)}
								</TableCell>
								<TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
									{row.number}
								</TableCell>
								{employees && (
									<TableCell className="hidden sm:table-cell">
										{row.employee.name}
									</TableCell>
								)}
								<TableCell className="text-right font-medium tabular-nums">
									{row.amount}
								</TableCell>
							</TableRow>
						))}
						{rows && !rows.length && (
							<TableRow>
								<TableCell
									colSpan={4}
									className="h-24 text-center text-muted-foreground"
								>
									{empty}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

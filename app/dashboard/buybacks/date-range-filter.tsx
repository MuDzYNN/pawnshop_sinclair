"use client";

import {
	endOfMonth,
	format,
	parseISO,
	startOfMonth,
	subDays,
	subMonths,
} from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { pl } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
	from?: string;
	to?: string;
	onChange: (from?: string, to?: string) => void;
};

const presets: { label: string; range: () => [Date, Date] }[] = [
	{ label: "Dziś", range: () => [new Date(), new Date()] },
	{
		label: "Wczoraj",
		range: () => [subDays(new Date(), 1), subDays(new Date(), 1)],
	},
	{
		label: "Ostatnie 7 dni",
		range: () => [subDays(new Date(), 6), new Date()],
	},
	{
		label: "Ostatnie 30 dni",
		range: () => [subDays(new Date(), 29), new Date()],
	},
	{
		label: "Ten miesiąc",
		range: () => [startOfMonth(new Date()), new Date()],
	},
	{
		label: "Poprzedni miesiąc",
		range: () => [
			startOfMonth(subMonths(new Date(), 1)),
			endOfMonth(subMonths(new Date(), 1)),
		],
	},
];

const toParam = (date: Date) => format(date, "yyyy-MM-dd");
const toLabel = (date: Date) => format(date, "d.MM.yyyy");

export function DateRangeFilter({ from, to, onChange }: Props) {
	const [open, setOpen] = useState(false);
	// Half-picked range stays local until the second day is chosen
	const [draft, setDraft] = useState<DateRange | undefined>();
	const selected =
		draft ??
		(from
			? { from: parseISO(from), to: to ? parseISO(to) : undefined }
			: undefined);

	function apply(range: [Date, Date] | undefined) {
		onChange(range && toParam(range[0]), range && toParam(range[1]));
		setDraft(undefined);
		setOpen(false);
	}

	// First click starts a new range, second one closes it in either direction
	function select(_: DateRange | undefined, day: Date) {
		if (!draft?.from) setDraft({ from: day });
		else apply(day < draft.from ? [day, draft.from] : [draft.from, day]);
	}

	const label = selected?.from
		? selected.to && toParam(selected.to) !== toParam(selected.from)
			? `${toLabel(selected.from)} – ${toLabel(selected.to)}`
			: toLabel(selected.from)
		: "Wszystkie daty";

	return (
		<div className="flex items-center gap-1">
			<Popover
				open={open}
				onOpenChange={(next) => {
					setOpen(next);
					setDraft(undefined);
				}}
			>
				<PopoverTrigger
					render={
						<Button
							variant="outline"
							className="justify-start tabular-nums"
						/>
					}
				>
					<CalendarIcon />
					{label}
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="flex w-auto flex-row gap-0 p-0"
				>
					<div className="flex flex-col gap-1 border-r p-2">
						{presets.map((preset) => (
							<Button
								key={preset.label}
								variant="ghost"
								size="sm"
								className="justify-start"
								onClick={() => apply(preset.range())}
							>
								{preset.label}
							</Button>
						))}
					</div>
					<Calendar
						mode="range"
						locale={pl}
						numberOfMonths={2}
						defaultMonth={
							selected?.from ?? subMonths(new Date(), 1)
						}
						selected={selected}
						onSelect={select}
						disabled={{ after: new Date() }}
					/>
				</PopoverContent>
			</Popover>
			{from && (
				<Button
					variant="ghost"
					size="icon"
					onClick={() => apply(undefined)}
				>
					<XIcon />
					<span className="sr-only">Wyczyść daty</span>
				</Button>
			)}
		</div>
	);
}

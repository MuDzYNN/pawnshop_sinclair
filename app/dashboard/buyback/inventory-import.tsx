"use client";

import {
	CheckIcon,
	ClipboardPasteIcon,
	TriangleAlertIcon,
	XIcon,
} from "lucide-react";
import { useState, type ClipboardEvent } from "react";
import { toast } from "sonner";
import {
	readInventory,
	type InventoryEntry,
} from "@/app/dashboard/buyback/inventory";
import type { ItemsData } from "@/app/dashboard/items/data";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Props = {
	data: Pick<ItemsData, "items" | "aliases" | "ignored">;
	onImport: (quantities: Record<string, number>) => void;
};

export function InventoryImport({ data, onImport }: Props) {
	const [text, setText] = useState("");
	const [report, setReport] = useState<InventoryEntry[] | null>(null);

	const added = report?.filter((entry) => entry.status === "added") ?? [];
	const ambiguous =
		report?.filter((entry) => entry.status === "ambiguous") ?? [];

	function importText(value: string) {
		const { entries, rest } = readInventory(value, data);
		setText(rest);
		if (!entries.length) return;
		const quantities: Record<string, number> = {};
		for (const entry of entries) {
			if (entry.status === "added")
				quantities[entry.item.id] =
					(quantities[entry.item.id] ?? 0) + entry.quantity;
		}
		onImport(quantities);
		setReport(entries);
		if (!Object.keys(quantities).length)
			toast.warning("Żaden przedmiot z ekwipunku nie jest w cenniku");
	}

	// Pasted text is counted together with what is already in the box
	function paste(event: ClipboardEvent<HTMLTextAreaElement>) {
		event.preventDefault();
		const { value, selectionStart, selectionEnd } = event.currentTarget;
		importText(
			value.slice(0, selectionStart) +
				event.clipboardData.getData("text") +
				value.slice(selectionEnd),
		);
	}

	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle>Import z ekwipunku</CardTitle>
				{report && (
					<CardAction>
						<Button
							variant="ghost"
							size="icon-xs"
							onClick={() => setReport(null)}
						>
							<XIcon />
							<span className="sr-only">Ukryj raport</span>
						</Button>
					</CardAction>
				)}
			</CardHeader>
			<CardContent className="flex flex-col gap-3 text-sm">
				<div className="flex items-start gap-2">
					<Textarea
						aria-label="Ekwipunek"
						placeholder="Wklej ekwipunek z gry, np. Kolekcja monet x2"
						className="max-h-96 min-h-9"
						value={text}
						onChange={(e) => setText(e.target.value)}
						onPaste={paste}
					/>
					<Button
						variant="outline"
						disabled={!text.trim()}
						onClick={() => importText(text)}
					>
						<ClipboardPasteIcon />
						Dolicz
					</Button>
				</div>
				{ambiguous.length > 0 && (
					<ul className="flex flex-col gap-1 rounded-md bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
						{ambiguous.map((entry) => (
							<li key={entry.name} className="flex gap-2">
								<TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
								<span>
									<span className="font-medium">
										{entry.name} ×{entry.quantity}
									</span>{" "}
									– kilka pozycji w cenniku, dolicz ręcznie
								</span>
							</li>
						))}
					</ul>
				)}
				{added.length > 0 && (
					<ul className="flex flex-col gap-1">
						{added.map((entry) => (
							<li key={entry.name} className="flex gap-2">
								<CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
								<span>
									{entry.name} ×{entry.quantity}
									{(entry.item.name !== entry.name ||
										entry.item.note) && (
										<span className="text-muted-foreground">
											{" "}
											→ {entry.item.name}
											{entry.item.note &&
												` (${entry.item.note})`}
										</span>
									)}
								</span>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}

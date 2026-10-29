"use client";

import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	EllipsisVerticalIcon,
	GripVerticalIcon,
	PencilIcon,
	SearchIcon,
	ShieldAlertIcon,
	TagsIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { useId, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { deleteItems, reorderItems } from "@/app/dashboard/items/actions";
import type { ItemsData } from "@/app/dashboard/items/data";
import { ItemDialog } from "@/app/dashboard/items/item-dialog";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { errorMessages, type ErrorCode } from "@/lib/errors";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { keys } from "@/lib/swr";

type Item = ItemsData["items"][number];

export function ItemsTable({ data }: { data: ItemsData }) {
	const { items, canManage } = data;
	const [query, setQuery] = useState("");
	const [editing, setEditing] = useState<Item | null>(null);
	const [deleting, setDeleting] = useState<Item[]>([]);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pending, startTransition] = useTransition();
	const dndId = useId();
	const sensors = useSensors(
		useSensor(MouseSensor),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 150, tolerance: 5 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const q = query.trim().toLocaleLowerCase("pl");
	const shown = items.filter((item) =>
		`${item.name} ${item.note}`.toLocaleLowerCase("pl").includes(q),
	);
	// Items deleted meanwhile drop out of the selection
	const selected = items.filter((item) => selectedIds.has(item.id));
	const allShownSelected =
		shown.length > 0 && shown.every((item) => selectedIds.has(item.id));
	const someShownSelected = shown.some((item) => selectedIds.has(item.id));

	function toggle(ids: string[], checked: boolean) {
		setSelectedIds((current) => {
			const next = new Set(current);
			for (const id of ids) {
				if (checked) next.add(id);
				else next.delete(id);
			}
			return next;
		});
	}

	function confirmDelete(items: Item[]) {
		setDeleting(items);
		setConfirmOpen(true);
	}

	// Shown in the new order right away, rolled back if saving fails
	function reorder({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) return;
		const ordered = arrayMove(
			items,
			items.findIndex((item) => item.id === active.id),
			items.findIndex((item) => item.id === over.id),
		);
		mutate<ItemsData>(
			keys.items,
			async () => {
				const result = await reorderItems(
					ordered.map((item) => item.id),
				);
				if (result.error) throw new Error(result.error);
				return undefined;
			},
			{
				optimisticData: { ...data, items: ordered },
				populateCache: false,
				rollbackOnError: true,
			},
		).catch((error: Error) =>
			toast.error(errorMessages[error.message as ErrorCode]),
		);
	}

	function remove(items: Item[]) {
		setConfirmOpen(false);
		startTransition(async () => {
			const result = await deleteItems(items.map((item) => item.id));
			if (result.error) {
				toast.error(errorMessages[result.error]);
				return;
			}
			mutate(keys.items);
			toggle(
				items.map((item) => item.id),
				false,
			);
			toast.success(
				items.length === 1
					? `Usunięto: ${items[0].name}`
					: `Usunięto przedmioty: ${items.length}`,
			);
		});
	}

	if (!items.length) {
		return (
			<Empty className="border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<TagsIcon />
					</EmptyMedia>
					<EmptyTitle>Cennik jest pusty</EmptyTitle>
					<EmptyDescription>
						{canManage
							? "Dodaj pierwszy przedmiot do cennika skupu."
							: "Nie dodano jeszcze żadnych przedmiotów."}
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<>
			<div className="flex items-center justify-between gap-4">
				<InputGroup className="max-w-sm">
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
					<InputGroupInput
						placeholder="Szukaj przedmiotu…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</InputGroup>
				<div className="flex items-center gap-2">
					{selected.length > 0 && (
						<>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setSelectedIds(new Set())}
							>
								<XIcon />
								Odznacz ({selected.length})
							</Button>
							<Button
								variant="destructive"
								size="sm"
								disabled={pending}
								onClick={() => confirmDelete(selected)}
							>
								<Trash2Icon />
								Usuń zaznaczone
							</Button>
						</>
					)}
					<span className="text-sm text-muted-foreground tabular-nums">
						{shown.length} z {items.length}
					</span>
				</div>
			</div>
			<div className="overflow-hidden rounded-lg border">
				<DndContext
					id={dndId}
					sensors={sensors}
					collisionDetection={closestCenter}
					modifiers={[restrictToVerticalAxis]}
					onDragEnd={reorder}
				>
					<Table>
						<TableHeader className="bg-muted">
							<TableRow>
								{canManage && (
									<>
										<TableHead className="w-0" />
										<TableHead className="w-0">
											<Checkbox
												aria-label="Zaznacz wszystkie"
												checked={allShownSelected}
												indeterminate={
													someShownSelected &&
													!allShownSelected
												}
												onCheckedChange={(checked) =>
													toggle(
														shown.map(
															(item) => item.id,
														),
														checked,
													)
												}
											/>
										</TableHead>
									</>
								)}
								<TableHead>Przedmiot</TableHead>
								<TableHead>Cena skupu</TableHead>
								<TableHead>Cena sprzedaży</TableHead>
								<TableHead className="w-0">Dodano</TableHead>
								<TableHead className="w-0">Edytowano</TableHead>
								{canManage && <TableHead className="w-0" />}
							</TableRow>
						</TableHeader>
						<TableBody>
							<SortableContext
								items={shown}
								strategy={verticalListSortingStrategy}
							>
								{shown.map((item) => (
									<ItemRow
										key={item.id}
										id={item.id}
										sortable={canManage}
										// Order is only changed on the full list
										disabled={!!q}
										selected={selectedIds.has(item.id)}
									>
										{canManage && (
											<TableCell>
												<Checkbox
													aria-label={`Zaznacz: ${item.name}`}
													checked={selectedIds.has(
														item.id,
													)}
													onCheckedChange={(
														checked,
													) =>
														toggle(
															[item.id],
															checked,
														)
													}
												/>
											</TableCell>
										)}
										<TableCell className="font-medium">
											{item.restricted && (
												<ShieldAlertIcon
													aria-label="Zakazany przedmiot"
													className="mr-1.5 -mt-0.5 inline size-4 text-destructive"
												>
													<title>Zakazany przedmiot</title>
												</ShieldAlertIcon>
											)}
											{item.name}
											{item.note && (
												<span className="ml-2 text-xs font-normal text-muted-foreground">
													{item.note}
												</span>
											)}
										</TableCell>
										<TableCell className="font-medium tabular-nums">
											{formatPrice(item.buyPrice)}
										</TableCell>
										<TableCell className="font-medium tabular-nums">
											{formatPrice(item.sellPrice)}
										</TableCell>
										<TableCell
											className="text-muted-foreground tabular-nums"
											title={formatDateTime(
												item.createdAt,
											)}
										>
											{formatDate(item.createdAt)}
										</TableCell>
										<TableCell
											className="text-muted-foreground tabular-nums"
											title={formatDateTime(
												item.updatedAt,
											)}
										>
											{formatDate(item.updatedAt)}
										</TableCell>
										{canManage && (
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger
														render={
															<Button
																variant="ghost"
																size="icon-sm"
																disabled={
																	pending
																}
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
															onClick={() =>
																setEditing(item)
															}
														>
															<PencilIcon />
															Edytuj
														</DropdownMenuItem>
														<DropdownMenuItem
															variant="destructive"
															onClick={() =>
																confirmDelete([
																	item,
																])
															}
														>
															<Trash2Icon />
															Usuń
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										)}
									</ItemRow>
								))}
							</SortableContext>
							{!shown.length && (
								<TableRow>
									<TableCell
										colSpan={canManage ? 8 : 5}
										className="h-24 text-center text-muted-foreground"
									>
										Brak przedmiotów pasujących do „{query}
										”.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</DndContext>
			</div>
			{editing && (
				<ItemDialog
					key={editing.id}
					item={editing}
					canRestrict={data.canViewRestricted}
					open
					onOpenChange={(open) => !open && setEditing(null)}
				/>
			)}
			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{deleting.length === 1
								? `Usunąć „${deleting[0].name}${deleting[0].note ? ` (${deleting[0].note})` : ""}” z cennika?`
								: `Usunąć ${deleting.length} przedmiotów z cennika?`}
						</AlertDialogTitle>
						<AlertDialogDescription>
							Tej operacji nie można cofnąć. Historia transakcji
							zostanie zachowana.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Anuluj</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => remove(deleting)}
						>
							Usuń
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

type ItemRowProps = {
	id: string;
	sortable: boolean;
	disabled: boolean;
	selected: boolean;
	children: ReactNode;
};

function ItemRow({ id, sortable, disabled, selected, children }: ItemRowProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id, disabled });
	return (
		<TableRow
			ref={setNodeRef}
			data-dragging={isDragging}
			data-state={selected ? "selected" : undefined}
			className="relative z-0 [&>td]:py-1 data-[dragging=true]:z-10 data-[dragging=true]:bg-muted"
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			{sortable && (
				<TableCell className="pr-0">
					<Button
						{...attributes}
						{...listeners}
						variant="ghost"
						size="icon-sm"
						disabled={disabled}
						title={
							disabled
								? "Wyczyść wyszukiwanie, żeby zmienić kolejność"
								: undefined
						}
						className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
					>
						<GripVerticalIcon />
						<span className="sr-only">
							Przeciągnij, żeby zmienić kolejność
						</span>
					</Button>
				</TableCell>
			)}
			{children}
		</TableRow>
	);
}

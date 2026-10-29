// Reordered items swap among their own places, the rest stay put
export function withOrder<T extends { id: string }>(
	items: T[],
	ids: string[],
) {
	const moved = new Set(ids);
	const queue = [...moved].flatMap((id) =>
		items.filter((item) => item.id === id),
	);
	return items.map((item) => (moved.has(item.id) ? queue.shift()! : item));
}

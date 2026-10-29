// "Telewizor (duży)", items with the same name differ by the note
export const itemLabel = (item: { name: string; note: string }) =>
	item.note ? `${item.name} (${item.note})` : item.name;

export function formatPrice(price: number) {
	return `${new Intl.NumberFormat("pl-PL").format(price)} $`;
}

// Fixed time zone so server and browser render the same text
const dateFormat = new Intl.DateTimeFormat("pl-PL", {
	dateStyle: "short",
	timeZone: "Europe/Warsaw",
});
const dateTimeFormat = new Intl.DateTimeFormat("pl-PL", {
	dateStyle: "short",
	timeStyle: "short",
	timeZone: "Europe/Warsaw",
});

export function formatDate(date: string) {
	return dateFormat.format(new Date(date));
}

export function formatDateTime(date: string) {
	return dateTimeFormat.format(new Date(date));
}

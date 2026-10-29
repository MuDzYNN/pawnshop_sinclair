const dateParts = new Intl.DateTimeFormat("en-GB", {
	timeZone: "Europe/Warsaw",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hourCycle: "h23",
});

// Warsaw date and time parts, e.g. { year: "2026", month: "10", ... }
export function warsawParts(date: Date) {
	return Object.fromEntries(
		dateParts.formatToParts(date).map((part) => [part.type, part.value]),
	);
}

// "20261029-151653-DWAIN_SC"
export function transactionNumber(date: Date, employeeName: string) {
	const { year, month, day, hour, minute, second } = warsawParts(date);
	return `${year}${month}${day}-${hour}${minute}${second}-${employeeTag(employeeName)}`;
}

// "Dwain Scott" becomes "DWAIN_SC"
function employeeTag(name: string) {
	const [first = "", last = ""] = name
		.replace(/ł/g, "l")
		.replace(/Ł/g, "L")
		.normalize("NFD")
		.replace(/[^A-Za-z\s]/g, "")
		.toUpperCase()
		.trim()
		.split(/\s+/);
	return [first, last.slice(0, 2)].filter(Boolean).join("_");
}

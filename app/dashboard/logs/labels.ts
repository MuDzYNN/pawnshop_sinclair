import type { AuditAction, Permission } from "@/app/generated/prisma/browser";
import { formatPrice } from "@/lib/format";
import { permissions } from "@/lib/permissions";

export const actionLabels: Record<AuditAction, string> = {
	ITEM_CREATED: "Dodano przedmiot",
	ITEM_UPDATED: "Edytowano przedmiot",
	ITEM_MOVED: "Przesunięto przedmiot",
	ITEM_DELETED: "Usunięto przedmiot",
	ALIAS_CREATED: "Dodano alias",
	ALIAS_DELETED: "Usunięto alias",
	IGNORED_CREATED: "Dodano do ignorowanych",
	IGNORED_DELETED: "Usunięto z ignorowanych",
	EMPLOYEE_CREATED: "Dodano pracownika",
	EMPLOYEE_UPDATED: "Edytowano pracownika",
	EMPLOYEE_ACTIVATED: "Aktywowano pracownika",
	EMPLOYEE_DEACTIVATED: "Dezaktywowano pracownika",
	RANK_CREATED: "Dodano rangę",
	RANK_UPDATED: "Edytowano rangę",
	RANK_MOVED: "Przesunięto rangę",
	RANK_DELETED: "Usunięto rangę",
	WEBHOOK_UPDATED: "Zapisano webhook",
	WEBHOOK_DELETED: "Usunięto webhook",
	WEBHOOK_TESTED: "Test webhooka",
	BUYBACK_COMPLETED: "Zatwierdzono skup",
	SALE_COMPLETED: "Zapisano sprzedaż PostOP",
	SALE_SETTLED: "Rozliczono sprzedaż PostOP",
	SALE_REOPENED: "Cofnięto rozliczenie sprzedaży",
	LOGIN: "Logowanie",
	LOGIN_DENIED: "Odrzucone logowanie",
};

export const categories = {
	items: {
		label: "Przedmioty",
		actions: [
			"ITEM_CREATED",
			"ITEM_UPDATED",
			"ITEM_MOVED",
			"ITEM_DELETED",
			"ALIAS_CREATED",
			"ALIAS_DELETED",
			"IGNORED_CREATED",
			"IGNORED_DELETED",
		],
	},
	buybacks: { label: "Skup", actions: ["BUYBACK_COMPLETED"] },
	sales: {
		label: "Sprzedaż PostOP",
		actions: ["SALE_COMPLETED", "SALE_SETTLED", "SALE_REOPENED"],
	},
	employees: {
		label: "Pracownicy",
		actions: [
			"EMPLOYEE_CREATED",
			"EMPLOYEE_UPDATED",
			"EMPLOYEE_ACTIVATED",
			"EMPLOYEE_DEACTIVATED",
		],
	},
	ranks: {
		label: "Rangi",
		actions: ["RANK_CREATED", "RANK_UPDATED", "RANK_MOVED", "RANK_DELETED"],
	},
	webhooks: {
		label: "Webhooki",
		actions: ["WEBHOOK_UPDATED", "WEBHOOK_DELETED", "WEBHOOK_TESTED"],
	},
	logins: { label: "Logowanie", actions: ["LOGIN", "LOGIN_DENIED"] },
} satisfies Record<string, { label: string; actions: AuditAction[] }>;

export type Category = keyof typeof categories;

const fieldLabels: Record<string, string> = {
	name: "Nazwa",
	note: "Notatka",
	buyPrice: "Cena skupu",
	sellPrice: "Cena sprzedaży",
	position: "Pozycja",
	aliases: "Aliasy",
	item: "Przedmiot",
	discordId: "Discord ID",
	rank: "Ranga",
	active: "Aktywny",
	permissions: "Uprawnienia",
	url: "Adres",
	enabled: "Włączony",
	result: "Wynik",
	pieces: "Liczba sztuk",
	payout: "Wypłata",
	bonus: "Bonus",
	profit: "Zysk",
	value: "Wartość",
};

const priceFields = new Set([
	"buyPrice",
	"sellPrice",
	"payout",
	"bonus",
	"profit",
	"value",
]);

const webhookResults: Record<string, string> = {
	sent: "wysłano",
	failed: "błąd Discorda",
	disabled: "wyłączony",
};

export const fieldLabel = (field: string) => fieldLabels[field] ?? field;

export function formatValue(field: string, value: unknown) {
	if (value === null || value === "") return "—";
	if (priceFields.has(field)) return formatPrice(value as number);
	if (typeof value === "boolean") return value ? "tak" : "nie";
	if (field === "result")
		return webhookResults[value as string] ?? String(value);
	if (field === "permissions") {
		const list = value as Permission[];
		return list.length
			? permissions
					.filter((p) => list.includes(p.value))
					.map((p) => p.label)
					.join(", ")
			: "brak";
	}
	if (Array.isArray(value)) return value.join(", ");
	return String(value);
}

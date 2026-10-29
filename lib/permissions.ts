import type { Permission } from "@/app/generated/prisma/browser";

// Same order as the sidebar sections
export const permissions: {
	value: Permission;
	label: string;
	description: string;
}[] = [
	{
		value: "CREATE_BUYBACKS",
		label: "Nowy skup",
		description: "Wykonywanie transakcji skupu",
	},
	{
		value: "VIEW_BUYBACKS",
		label: "Wszystkie transakcje",
		description:
			"Podgląd transakcji skupu wszystkich pracowników, nie tylko własnych",
	},
	{
		value: "CREATE_SALES",
		label: "Nowa sprzedaż PostOP",
		description: "Zapisywanie sprzedaży przedmiotów z magazynu do PostOP",
	},
	{
		value: "VIEW_SALES",
		label: "Wszystkie sprzedaże",
		description:
			"Podgląd sprzedaży PostOP wszystkich pracowników, nie tylko własnych",
	},
	{
		value: "SETTLE_SALES",
		label: "Rozliczanie sprzedaży",
		description:
			"Oznaczanie sprzedaży jako przyjętej i rozliczonej przez PostOP",
	},
	{
		value: "MANAGE_ITEMS",
		label: "Zarządzanie cennikiem",
		description:
			"Dodawanie, edycja, kolejność i usuwanie przedmiotów w cenniku skupu",
	},
	{
		value: "MANAGE_ALIASES",
		label: "Aliasy",
		description:
			"Nazwy z ekwipunku liczone przy imporcie jako przedmiot z cennika",
	},
	{
		value: "MANAGE_IGNORED",
		label: "Ignorowane przedmioty",
		description: "Przedmioty z ekwipunku, które import pomija",
	},
	{
		value: "MANAGE_EMPLOYEES",
		label: "Zarządzanie pracownikami",
		description:
			"Dodawanie, edycja i dezaktywacja pracowników o niższej randze",
	},
	{
		value: "MANAGE_RANKS",
		label: "Zarządzanie rangami",
		description:
			"Tworzenie rang, ich kolejność i uprawnienia, pełny dostęp do pracowników",
	},
	{
		value: "MANAGE_WEBHOOKS",
		label: "Zarządzanie webhookami",
		description:
			"Adresy kanałów Discorda, na które panel wysyła wiadomości",
	},
	{
		value: "VIEW_LOGS",
		label: "Logi",
		description:
			"Historia wszystkich zmian w panelu: kto, co i kiedy zmienił",
	},
];

type Actor = { rank: { position: number; permissions: Permission[] } };

export function hasPermission(actor: Actor, permission: Permission) {
	return actor.rank.permissions.includes(permission);
}

// Rank managers have full access, others only to lower ranks
export function canManageRank(actor: Actor, rankPosition: number) {
	return (
		hasPermission(actor, "MANAGE_RANKS") ||
		actor.rank.position < rankPosition
	);
}

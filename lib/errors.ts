export const errorMessages = {
	ITEMS_FORBIDDEN: "Brak uprawnień do zarządzania cennikiem",
	ITEM_NAME_REQUIRED: "Podaj nazwę przedmiotu",
	ITEM_NAME_TOO_LONG: "Maksymalnie 80 znaków",
	ITEM_NAME_TAKEN: "Przedmiot o tej nazwie i notatce już jest w cenniku",
	ITEM_NAME_DUPLICATE: "Ta nazwa i notatka powtarzają się na liście",
	ITEM_NOTE_TOO_LONG: "Notatka może mieć maksymalnie 80 znaków",
	NAMES_EMPTY: "Podaj przynajmniej jedną nazwę",
	NAMES_TOO_MANY: "Maksymalnie 200 nazw naraz",
	NAME_TOO_LONG: "Nazwa może mieć maksymalnie 80 znaków",
	ALIASES_FORBIDDEN: "Brak uprawnień do zarządzania aliasami",
	IGNORED_FORBIDDEN: "Brak uprawnień do zarządzania ignorowanymi",
	ALIAS_TAKEN: "Te nazwy mają już przypisany przedmiot",
	IGNORED_TAKEN: "Te nazwy są już na liście ignorowanych",
	ALIAS_ITEM_REQUIRED: "Wybierz przedmiot",
	ITEMS_EMPTY: "Dodaj przynajmniej jeden przedmiot",
	ITEMS_TOO_MANY: "Maksymalnie 500 przedmiotów naraz",
	PRICE_REQUIRED: "Podaj cenę",
	PRICE_NOT_INTEGER: "Cena musi być liczbą całkowitą",
	PRICE_NEGATIVE: "Cena nie może być ujemna",
	PRICE_TOO_HIGH: "Za wysoka cena",

	EMPLOYEES_FORBIDDEN: "Brak uprawnień do zarządzania pracownikami",
	EMPLOYEE_NAME_REQUIRED: "Podaj imię i nazwisko",
	EMPLOYEE_NAME_TOO_LONG: "Maksymalnie 80 znaków",
	EMPLOYEE_NOT_FOUND: "Nie znaleziono pracownika",
	EMPLOYEE_RANK_TOO_HIGH: "Ten pracownik ma zbyt wysoką rangę",
	OWN_ACCOUNT: "Nie możesz zmieniać własnego konta",
	DISCORD_ID_INVALID: "Discord ID to 17–20 cyfr",
	DISCORD_ID_TAKEN: "Ten Discord ID jest już przypisany",
	RANK_REQUIRED: "Wybierz rangę",
	RANK_NOT_ASSIGNABLE: "Nie możesz nadać tej rangi",

	RANKS_FORBIDDEN: "Brak uprawnień do zarządzania rangami",
	RANK_NAME_REQUIRED: "Podaj nazwę rangi",
	RANK_NAME_TOO_LONG: "Maksymalnie 40 znaków",
	RANK_NAME_TAKEN: "Ranga o tej nazwie już istnieje",
	RANK_NOT_MOVABLE: "Nie można przesunąć tej rangi",
	RANK_HAS_EMPLOYEES: "Najpierw przenieś pracowników z tej rangi",
	OWN_RANK_PERMISSION:
		"Nie możesz odebrać własnej randze zarządzania rangami",

	BUYBACKS_FORBIDDEN: "Brak uprawnień do wykonywania skupu",
	BUYBACK_INVALID: "Nieprawidłowa transakcja, sprawdź ilości i bonus",
	PRICES_CHANGED:
		"Cennik zmienił się w międzyczasie, sprawdź transakcję jeszcze raz",

	SALES_FORBIDDEN: "Brak uprawnień do sprzedaży PostOP",
	SALE_INVALID: "Nieprawidłowa sprzedaż, sprawdź ilości",
	SALE_NOT_FOUND: "Nie znaleziono sprzedaży",
	SETTLE_FORBIDDEN: "Brak uprawnień do rozliczania sprzedaży",

	WEBHOOKS_FORBIDDEN: "Brak uprawnień do zarządzania webhookami",
	WEBHOOK_URL_INVALID:
		"Podaj adres webhooka Discorda (https://discord.com/api/webhooks/…)",
	WEBHOOK_DISABLED: "Webhook jest wyłączony albo nie ma adresu",
	WEBHOOK_FAILED: "Discord odrzucił wiadomość, sprawdź adres webhooka",

	INVALID_REQUEST: "Nieprawidłowe zapytanie.",
	FIELDS_REQUIRED: "Uzupełnij wszystkie pola formularza.",
	CONTACT_UNAVAILABLE: "Formularz jest chwilowo niedostępny.",
	CONTACT_FAILED: "Nie udało się przekazać zgłoszenia. Spróbuj ponownie.",
	CONTACT_RATE_LIMITED: "Wysłano zbyt wiele zgłoszeń. Spróbuj ponownie za kilka minut.",
};

export type ErrorCode = keyof typeof errorMessages;

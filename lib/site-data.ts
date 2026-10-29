import {
	AnchorIcon,
	CoinsIcon,
	GemIcon,
	MonitorSmartphoneIcon,
	PaletteIcon,
	type LucideIcon,
} from "lucide-react";

export type Category = {
	id: string;
	name: string;
	icon: LucideIcon;
	items: string[];
};
export type Person = {
	name: string;
	role: string;
	desc: string;
	phone: string;
	image: string;
};
export type SiteEvent = {
	id: string;
	title: string;
	dates: string;
	description: string;
	image: string;
	visible: boolean;
	// YYYY-MM-DD, last visible day (Europe/Warsaw time)
	expires: string;
};

export const categories: Category[] = [
	{
		id: "elektronika",
		name: "ELEKTRONIKA I SPRZĘT",
		icon: MonitorSmartphoneIcon,
		items: [
			"Aparat",
			"Stary aparat polaroid",
			"Gitara elektryczna",
			"Głośnik",
			"Komputer PC",
			"Konsola do gier",
			"Laptop",
			"Mikrofala",
			"Mikser (DJ)",
			"Mikser (kuchenny)",
			"Sprzęt AGD",
			"Sprzęt komputerowy",
			"Sprzęt muzyczny",
			"Sprzęt RTV",
		],
	},
	{
		id: "bizuteria",
		name: "BIŻUTERIA I DODATKI",
		icon: GemIcon,
		items: [
			"Biżuteria",
			"Obrączka",
			"Pierścionek z diamentem",
			"Pierścionek zaręczynowy",
			"Srebrny pierścionek",
			"Sygnet",
			"Zegarek",
			"Złota bransoletka",
			"Złote kolczyki",
			"Złoty pierścionek",
			"Złoty zegarek",
			"Stary zegarek",
		],
	},
	{
		id: "dekoracje",
		name: "DOM / SZTUKA / DEKORACJE",
		icon: PaletteIcon,
		items: [
			"Figurka baletnica",
			"Zdobiona książka",
			"Dywan",
			"Obraz duży",
			"Obraz mały",
			"Obraz ścienny",
			"Plastikowa figurka",
		],
	},
	{
		id: "kolekcje",
		name: "MONETY / KRUSZCE / KOLEKCJE",
		icon: CoinsIcon,
		items: [
			"Drobinka złota",
			"Kolekcja monet LS",
			"Kolekcja monet Prezydentów",
			"Moneta LS",
			"Moneta prezydencka",
			"Różowa perła",
			"Samorodek złota",
			"Surowy kamień szlachetny",
			"Zdobiona katana",
			"Złota moneta",
			"Zdobiona zapalniczka",
			"Stara armata",
			"Stare gogle nurkowe",
			"Rozgwiazda",
			"Ząb rekina",
		],
	},
	{
		id: "pirackie",
		name: "PIRACKIE ZNALEZISKA",
		icon: AnchorIcon,
		items: [
			"Piracka butla do nurkowania",
			"Piracka fajka",
			"Piracka flaga",
			"Piracka klatka",
			"Piracka szabla",
			"Piracki kapelusz",
			"Piracki kompas",
			"Piracki płaszcz",
			"Piracki skarb",
		],
	},
];

export const team: Person[] = [
	{
		name: "Lilith Sinclair",
		role: "Właścicielka Sinclair & CO.",
		desc: "Elegancka, charyzmatyczna i bezkompromisowa kobieta, która zbudowała swoją pozycję dzięki determinacji i wyczuciu interesów. Ceni dyskrecję, profesjonalizm oraz lojalność. Osobiście nadzoruje działalność lombardu, dbając o jego prestiż, najwyższe standardy obsługi i reputację nazwiska Sinclair.",
		phone: "696696",
		image: "/assets/lilith-sinclair.png",
	},
	{
		name: "Darius West",
		role: "Współwłaściciel Sinclair & CO.",
		desc: "Wesoły, charyzmatyczny i obdarzony niezwykłym talentem do negocjacji. Mistrz sztuki perswazji, który potrafi przekonać do siebie nawet najbardziej wymagających klientów. Dzięki swojej otwartości, poczuciu humoru i wyjątkowemu zmysłowi handlowemu z łatwością buduje trwałe relacje biznesowe. Poza światem interesów realizuje swoją pasję jako muzyk i producent muzyczny.",
		phone: "269445",
		image: "/assets/darius-west.png",
	},
	{
		name: "Annie Marie Sinclair",
		role: "Współwłaściciel Sinclair & CO.",
		desc: "Elegancka, inteligentna i niezwykle opanowana kobieta, wychowana w duchu brytyjskiej arystokracji. Absolwentka psychologii, doskonale potrafi odczytywać ludzkie intencje. Choć na pierwszy rzut oka sprawia wrażenie chłodnej i niedostępnej, wyróżnia ją cierpliwość, spostrzegawczość i wyjątkowa dbałość o szczegóły. W Sinclair & CO. zajmuje się między innymi biżuterią oraz odnawianiem wartościowych przedmiotów. Ceni lojalność, dyskrecję i rodzinne tradycje.",
		phone: "840572",
		image: "/assets/annie-marie-sinclair.png",
	},
];

export const events: SiteEvent[] = [
	{
		id: "halloween-2026",
		title: "Halloweenowa oferta",
		dates: "09.10–11.10.2026",
		description:
			"Promocja na monety prezydenckie +15%, złote kolczyki +25%, złote bransoletki +25%.",
		image: "/assets/halloween-2026.png",
		visible: true,
		expires: "2026-10-11",
	},
];

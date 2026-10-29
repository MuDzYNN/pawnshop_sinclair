import type { Metadata, Viewport } from "next";
import {
	Cormorant_Garamond,
	DM_Sans,
	Geist,
	Geist_Mono,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin", "latin-ext"],
});

const cormorant = Cormorant_Garamond({
	variable: "--font-cormorant",
	subsets: ["latin", "latin-ext"],
	weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin", "latin-ext"],
	weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
	title: "Sinclair & CO. — Lombard Los Santos",
	description:
		"Sinclair & CO. — indywidualny skup przedmiotów w Los Santos. Monety, biżuteria, zegarki, elektronika i wyjątkowe znaleziska. Wycena wyłącznie w lombardzie.",
	openGraph: {
		title: "Sinclair & CO. · Pawnshop Los Santos",
		description:
			"Sinclair & CO. — skup przedmiotów, Hawick Avenue, Los Santos. Indywidualne wyceny.",
	},
};

export const viewport: Viewport = {
	themeColor: "#0d090b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="pl"
			data-scroll-behavior="smooth"
			className={`dark ${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${dmSans.variable}`}
		>
			<body>{children}</body>
		</html>
	);
}

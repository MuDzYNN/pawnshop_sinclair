"use client";

import {
	createContext,
	use,
	useRef,
	useState,
	type ComponentProps,
	type ReactNode,
	type RefObject,
} from "react";
import { Button } from "@/components/ui/button";

export type SectionId =
	| "catalogue"
	| "events"
	| "how-it-works"
	| "about"
	| "team"
	| "contact";

type SiteContext = {
	headerRef: RefObject<HTMLElement | null>;
	nicknameRef: RefObject<HTMLInputElement | null>;
	register: (id: SectionId) => (el: HTMLElement | null) => void;
	scrollTo: (id?: SectionId) => void;
	inquire: (category: string) => void;
	category: string;
	setCategory: (category: string) => void;
};

const Context = createContext<SiteContext | null>(null);

export function useSite() {
	const ctx = use(Context);
	if (!ctx) throw new Error("useSite must be used inside SiteProvider");
	return ctx;
}

export function SiteProvider({ children }: { children: ReactNode }) {
	const sections = useRef<Partial<Record<SectionId, HTMLElement | null>>>({});
	const headerRef = useRef<HTMLElement>(null);
	const nicknameRef = useRef<HTMLInputElement>(null);
	const [category, setCategory] = useState("");

	const register = (id: SectionId) => (el: HTMLElement | null) => {
		sections.current[id] = el;
	};

	// Without an id scrolls to the very top
	function scrollTo(id?: SectionId) {
		const el = id && sections.current[id];
		const top = el
			? el.getBoundingClientRect().top +
				window.scrollY -
				(headerRef.current?.offsetHeight ?? 0)
			: 0;
		window.scrollTo({ top, behavior: "smooth" });
	}

	function inquire(name: string) {
		setCategory(name);
		scrollTo("contact");
		setTimeout(
			() => nicknameRef.current?.focus({ preventScroll: true }),
			350,
		);
	}

	return (
		<Context
			value={{
				headerRef,
				nicknameRef,
				register,
				scrollTo,
				inquire,
				category,
				setCategory,
			}}
		>
			{children}
		</Context>
	);
}

export function Section({
	id,
	...props
}: ComponentProps<"section"> & { id: SectionId }) {
	const { register } = useSite();
	return <section ref={register(id)} {...props} />;
}

export function ScrollButton({
	to,
	onClick,
	...props
}: ComponentProps<typeof Button> & { to?: SectionId }) {
	const { scrollTo } = useSite();
	return (
		<Button
			onClick={(e) => {
				scrollTo(to);
				onClick?.(e);
			}}
			{...props}
		/>
	);
}

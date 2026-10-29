"use client";

import { ArrowUpRightIcon, MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/site/brand";
import {
	ScrollButton,
	useSite,
	type SectionId,
} from "@/components/site/site-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links: { to: SectionId; label: string }[] = [
	{ to: "about", label: "O nas" },
	{ to: "catalogue", label: "Co skupujemy" },
	{ to: "events", label: "Wydarzenia" },
	{ to: "how-it-works", label: "Jak działamy" },
	{ to: "team", label: "Nasz zespół" },
];

export function Header({ showEvents }: { showEvents: boolean }) {
	const { headerRef } = useSite();
	const [open, setOpen] = useState(false);
	const close = () => setOpen(false);

	return (
		<header
			ref={headerRef}
			className="sticky top-0 z-30 border-b border-border bg-background/93 backdrop-blur-[18px]"
		>
			<div className="mx-auto flex min-h-21.5 max-w-295 items-center justify-between gap-5.5 px-7 max-tablet:min-h-18 max-phone:px-5">
				<Brand />
				<Button
					aria-controls="main-nav"
					aria-expanded={open}
					aria-label={open ? "Zamknij menu" : "Otwórz menu"}
					variant="outline"
					className="hidden h-10 w-10.75 bg-transparent text-gold max-tablet:flex dark:bg-transparent [&_svg:not([class*='size-'])]:size-5.5"
					onClick={() => setOpen(!open)}
				>
					{open ? <XIcon /> : <MenuIcon />}
				</Button>
				<nav
					aria-label="Nawigacja główna"
					className={cn(
						"flex items-center gap-7.25 max-laptop:gap-3.75",
						"max-tablet:absolute max-tablet:inset-x-0 max-tablet:top-full max-tablet:flex-col max-tablet:items-stretch max-tablet:gap-4.75 max-tablet:border-b max-tablet:border-border max-tablet:bg-[#140e11] max-tablet:px-7 max-tablet:pt-5.5 max-tablet:pb-6.75 max-tablet:shadow-[0_16px_30px_rgba(0,0,0,.3)]",
						!open && "max-tablet:hidden",
					)}
					id="main-nav"
				>
					{links
						.filter((l) => showEvents || l.to !== "events")
						.map((l) => (
							<ScrollButton
								key={l.to}
								to={l.to}
								onClick={close}
								variant="link"
								className="h-auto justify-start p-0 text-xs font-semibold text-[#c6baba] transition-colors hover:text-gold hover:no-underline max-tablet:text-sm"
							>
								{l.label}
							</ScrollButton>
						))}
					<ScrollButton
						to="contact"
						onClick={close}
						variant="outline"
						className="h-auto border-[#95744e] bg-transparent px-4.5 py-3.25 text-[10px] font-normal tracking-[.14em] text-gold-pale uppercase hover:bg-gold hover:text-background dark:border-[#95744e] dark:bg-transparent dark:hover:bg-gold"
					>
						Skontaktuj się <ArrowUpRightIcon className="size-3" />
					</ScrollButton>
				</nav>
			</div>
		</header>
	);
}

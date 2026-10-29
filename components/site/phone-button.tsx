"use client";

import { CheckIcon, CopyIcon, PhoneIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const iconMotion = {
	initial: { opacity: 0, scale: 0.4, rotate: -90, filter: "blur(2px)" },
	animate: { opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" },
	exit: { opacity: 0, scale: 0.4, rotate: 90, filter: "blur(2px)" },
	transition: { type: "spring", duration: 0.35, bounce: 0.3 },
} as const;

export function PhoneButton({ phone }: { phone: string }) {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) return;
		const timeout = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(timeout);
	}, [copied]);

	async function copy() {
		try {
			await navigator.clipboard.writeText(phone);
			setCopied(true);
		} catch {
			window.prompt("Skopiuj numer:", phone);
		}
	}

	return (
		<Button
			variant="outline"
			aria-label={`Skopiuj numer ${phone}`}
			className="relative mt-5.5 h-auto gap-2.25 self-start border-[#59423a] bg-[#23181c] px-3 py-2.25 text-xs font-normal tracking-[.04em] text-gold-pale hover:border-gold hover:bg-accent hover:text-gold-pale dark:border-[#59423a] dark:bg-[#23181c] dark:hover:bg-accent"
			onClick={copy}
		>
			<PhoneIcon className="size-3.5" />
			{phone}
			<span className="relative grid size-3.5 place-items-center">
				<AnimatePresence initial={false} mode="popLayout">
					{copied ? (
						<motion.span
							key="check"
							className="text-[#8ed9a7]"
							{...iconMotion}
						>
							<CheckIcon className="size-3.5" />
						</motion.span>
					) : (
						<motion.span key="copy" {...iconMotion}>
							<CopyIcon className="size-3.5" />
						</motion.span>
					)}
				</AnimatePresence>
			</span>
			<span className="sr-only" aria-live="polite">
				{copied ? "Numer skopiowany" : ""}
			</span>
		</Button>
	);
}

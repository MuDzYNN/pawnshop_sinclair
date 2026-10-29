"use client";

import { AnimatePresence, motion } from "motion/react";
import { useIsValidating } from "@/lib/swr";

export function RefreshBar() {
	const validating = useIsValidating();

	return (
		<AnimatePresence>
			{validating && (
				<motion.div
					role="progressbar"
					aria-label="Odświeżanie danych"
					className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 overflow-hidden"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
				>
					<motion.div
						className="h-full w-1/3 rounded-full bg-primary"
						initial={{ x: "-100%" }}
						animate={{ x: "300%" }}
						transition={{
							duration: 1,
							ease: "easeInOut",
							repeat: Infinity,
						}}
					/>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

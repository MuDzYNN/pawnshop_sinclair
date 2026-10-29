import Image from "next/image";
import { ScrollButton } from "@/components/site/site-context";

export function Brand() {
	return (
		<ScrollButton
			aria-label="Sinclair & CO. — strona główna"
			variant="ghost"
			className="h-auto shrink-0 gap-3.25 p-0 hover:bg-transparent dark:hover:bg-transparent"
		>
			<Image
				alt="Logo Sinclair & CO."
				className="size-13.75 shrink-0 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,.35)]"
				src="/assets/logo.png"
				width={55}
				height={55}
			/>
			<span className="text-left font-serif text-2xl leading-[.9] font-bold tracking-[.105em] max-phone:text-[21px]">
				SINCLAIR <span className="text-gold">&amp;</span> CO.
				<small className="mt-2.5 block text-center font-sans text-[9px] font-medium tracking-[.3em] text-muted-foreground">
					PAWNSHOP · HAWICK AVENUE
				</small>
			</span>
		</ScrollButton>
	);
}

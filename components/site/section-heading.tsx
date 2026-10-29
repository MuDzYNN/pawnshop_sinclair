import type { ReactNode } from "react";

type Props = {
	label: string;
	title: ReactNode;
	id?: string;
	children: ReactNode;
};

export function SectionHeading({ label, title, id, children }: Props) {
	return (
		<div className="mb-10.25 flex items-end justify-between gap-8 max-tablet:block">
			<div>
				<div className="text-[11px] font-bold tracking-[.22em] text-gold uppercase">
					{label}
				</div>
				<h2
					id={id}
					className="mt-3.75 font-serif text-[clamp(48px,5vw,70px)] leading-[.98] font-medium tracking-[-.035em] max-phone:text-[54px]"
				>
					{title}
				</h2>
			</div>
			<p className="max-w-87.5 text-[13px] text-muted-foreground max-tablet:mt-4.75">
				{children}
			</p>
		</div>
	);
}

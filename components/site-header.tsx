"use client";

import { usePathname } from "next/navigation";
import { RefreshBar } from "@/components/dashboard/refresh-bar";
import { navItems } from "@/components/nav-main";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
	const pathname = usePathname();
	const title = navItems.find((item) => item.url === pathname)?.title;

	return (
		<header className="relative flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mx-2 h-4 data-vertical:self-auto"
				/>
				<h1 className="text-base font-medium">{title}</h1>
			</div>
			<RefreshBar />
		</header>
	);
}

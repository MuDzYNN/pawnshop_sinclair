"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import type { CurrentEmployee } from "@/lib/session";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar({
	employee,
	...props
}: React.ComponentProps<typeof Sidebar> & { employee: CurrentEmployee }) {
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							className="data-[slot=sidebar-menu-button]:p-1.5!"
							render={<Link href="/dashboard" />}
						>
							<Image
								src="/assets/logo.png"
								alt=""
								width={20}
								height={20}
								className="size-5"
							/>
							<span className="font-serif text-lg font-semibold tracking-wide">
								Sinclair &amp; CO.
							</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain employee={employee} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser employee={employee} />
			</SidebarFooter>
		</Sidebar>
	);
}

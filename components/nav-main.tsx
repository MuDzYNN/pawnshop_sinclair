"use client";

import {
	EyeOffIcon,
	HandCoinsIcon,
	Link2Icon,
	LayoutDashboardIcon,
	PackageCheckIcon,
	ReceiptTextIcon,
	ScrollTextIcon,
	ShieldIcon,
	TagsIcon,
	TruckIcon,
	UsersIcon,
	WebhookIcon,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Permission } from "@/app/generated/prisma/browser";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { hasPermission } from "@/lib/permissions";
import type { CurrentEmployee } from "@/lib/session";

type NavItem = {
	title: string;
	url: string;
	icon: LucideIcon;
	permission?: Permission;
};

const navGroups: { label?: string; items: NavItem[] }[] = [
	{
		items: [
			{ title: "Pulpit", url: "/dashboard", icon: LayoutDashboardIcon },
		],
	},
	{
		label: "Skup",
		items: [
			{
				title: "Nowy skup",
				url: "/dashboard/buyback",
				icon: HandCoinsIcon,
				permission: "CREATE_BUYBACKS",
			},
			{
				title: "Transakcje",
				url: "/dashboard/buybacks",
				icon: ReceiptTextIcon,
			},
		],
	},
	{
		label: "PostOP",
		items: [
			{
				title: "Nowa sprzedaż",
				url: "/dashboard/sale",
				icon: TruckIcon,
				permission: "CREATE_SALES",
			},
			{
				title: "Sprzedaże",
				url: "/dashboard/sales",
				icon: PackageCheckIcon,
			},
		],
	},
	{
		label: "Przedmioty",
		items: [
			{ title: "Cennik", url: "/dashboard/items", icon: TagsIcon },
			{
				title: "Aliasy",
				url: "/dashboard/aliases",
				icon: Link2Icon,
				permission: "MANAGE_ALIASES",
			},
			{
				title: "Ignorowane",
				url: "/dashboard/ignored",
				icon: EyeOffIcon,
				permission: "MANAGE_IGNORED",
			},
		],
	},
	{
		label: "Zespół",
		items: [
			{
				title: "Pracownicy",
				url: "/dashboard/employees",
				icon: UsersIcon,
				permission: "MANAGE_EMPLOYEES",
			},
			{
				title: "Rangi",
				url: "/dashboard/ranks",
				icon: ShieldIcon,
				permission: "MANAGE_RANKS",
			},
		],
	},
	{
		label: "Ustawienia",
		items: [
			{
				title: "Webhooki",
				url: "/dashboard/webhooks",
				icon: WebhookIcon,
				permission: "MANAGE_WEBHOOKS",
			},
			{
				title: "Logi",
				url: "/dashboard/logs",
				icon: ScrollTextIcon,
				permission: "VIEW_LOGS",
			},
		],
	},
];

export const navItems = navGroups.flatMap((group) => group.items);

export function NavMain({ employee }: { employee: CurrentEmployee }) {
	const pathname = usePathname();
	const groups = navGroups
		.map((group) => ({
			...group,
			items: group.items.filter(
				(item) =>
					!item.permission ||
					hasPermission(employee, item.permission),
			),
		}))
		.filter((group) => group.items.length);

	return groups.map((group) => (
		<SidebarGroup key={group.label ?? "main"}>
			{group.label && (
				<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
			)}
			<SidebarGroupContent>
				<SidebarMenu>
					{group.items.map((item) => (
						<SidebarMenuItem key={item.url}>
							<SidebarMenuButton
								tooltip={item.title}
								isActive={pathname === item.url}
								render={<Link href={item.url} />}
							>
								<item.icon />
								<span>{item.title}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	));
}

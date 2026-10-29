import { Suspense, type CSSProperties } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SWRProvider } from "@/components/dashboard/swr-provider";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentEmployee } from "@/lib/session";

export default function DashboardLayout({
	children,
}: LayoutProps<"/dashboard">) {
	return (
		<TooltipProvider>
			<Suspense
				fallback={<Skeleton className="m-4 h-[calc(100svh-2rem)]" />}
			>
				<DashboardShell>{children}</DashboardShell>
			</Suspense>
			<Toaster />
		</TooltipProvider>
	);
}

async function DashboardShell({ children }: { children: React.ReactNode }) {
	const employee = await getCurrentEmployee();

	return (
		<SWRProvider>
			<SidebarProvider
				style={
					{
						"--sidebar-width": "calc(var(--spacing) * 72)",
						"--header-height": "calc(var(--spacing) * 12)",
					} as CSSProperties
				}
			>
				<AppSidebar variant="inset" employee={employee} />
				<SidebarInset>
					<SiteHeader />
					{children}
				</SidebarInset>
			</SidebarProvider>
		</SWRProvider>
	);
}

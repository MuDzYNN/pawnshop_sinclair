import { Suspense } from "react";
import { getClientsData } from "@/app/dashboard/clients/data";
import { ClientsView } from "@/app/dashboard/clients/clients-view";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/lib/session";

export default function ClientsPage() {
	return (
		<Suspense fallback={<Skeleton className="m-4 flex-1 lg:m-6" />}>
			<Clients />
		</Suspense>
	);
}

async function Clients() {
	await requirePermission("MANAGE_CLIENTS");
	return <ClientsView fallback={await getClientsData()} />;
}

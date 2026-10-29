"use client";

import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FORMATS = [
	{ value: "csv", label: "Eksportuj do CSV" },
	{ value: "xlsx", label: "Eksportuj do XLSX" },
] as const;

type Props = { href: (format: (typeof FORMATS)[number]["value"]) => string };

// The response is an attachment, so the page stays where it is
export function ExportMenu({ href }: Props) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<Button variant="outline" className="ml-auto" />}
			>
				<DownloadIcon />
				Eksportuj
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				{FORMATS.map((format) => (
					<DropdownMenuItem
						key={format.value}
						onClick={() => window.location.assign(href(format.value))}
					>
						{format.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

import { z } from "zod";

// Inventory names, one per line, blank and repeated ones dropped
export const namesSchema = z
	.array(z.string().trim().max(80, "NAME_TOO_LONG"))
	.transform((names) => [...new Set(names.filter(Boolean))])
	.pipe(z.array(z.string()).min(1, "NAMES_EMPTY").max(200, "NAMES_TOO_MANY"));

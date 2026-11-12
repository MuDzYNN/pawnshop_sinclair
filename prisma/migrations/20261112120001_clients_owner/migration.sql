-- Owner manages clients and uses them in buybacks from the start
UPDATE "rank" SET "permissions" = array_append("permissions", 'MANAGE_CLIENTS') WHERE "name" = 'Właściciel' AND NOT 'MANAGE_CLIENTS' = ANY("permissions");
UPDATE "rank" SET "permissions" = array_append("permissions", 'USE_CLIENTS') WHERE "name" = 'Właściciel' AND NOT 'USE_CLIENTS' = ANY("permissions");

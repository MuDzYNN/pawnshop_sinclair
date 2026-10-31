-- Owner can edit and delete sales from the start
UPDATE "rank" SET "permissions" = array_append("permissions", 'MANAGE_SALES') WHERE "name" = 'Właściciel' AND NOT 'MANAGE_SALES' = ANY("permissions");

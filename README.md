# Sinclair & CO.

Strona lombardu i panel pracownika: skup, sprzedaż do PostOP, cennik, pracownicy, rangi i logi.
Stack: Next.js 16, Prisma 7 + PostgreSQL, better-auth (logowanie przez Discord).

## Development

Potrzebny jest Node 24, pnpm i PostgreSQL. W `.env` ustaw `DATABASE_URL`, `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL=http://localhost:3000`, `DISCORD_CLIENT_ID` i `DISCORD_CLIENT_SECRET`.

```bash
pnpm install
pnpm exec prisma migrate deploy   # schemat i domyślne rangi
pnpm exec prisma generate
pnpm employee:add <discordId> "Imię Nazwisko" "Właściciel"
pnpm dev
```

Nowa zmiana schematu: edytuj `prisma/schema.prisma`, potem `pnpm exec prisma migrate dev --name <opis>`.

## Deploy

Push na `master` buduje obrazy w GitHub Actions i wdraża je po SSH na serwer (`docker-compose.yml`,
zmienne w [`.env.example`](.env.example)). Ruch wchodzi przez Cloudflare Tunnel, backupy bazy idą do R2.

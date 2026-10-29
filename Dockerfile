FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat openssl && corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Full source and dev deps, runs migrations and pnpm scripts against the db
FROM deps AS tools
COPY . .
RUN pnpm exec prisma generate && pnpm exec prisma version
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

FROM tools AS build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM postgres:18-alpine AS backup
RUN apk add --no-cache age rclone && install -d -o postgres /backups
COPY --chmod=755 scripts/backup.sh /usr/local/bin/backup.sh
USER postgres
ENV HOME=/tmp
CMD ["backup.sh"]

FROM node:24-alpine AS app
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

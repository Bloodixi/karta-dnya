# Сборка Next.js (standalone) для деплоя через Coolify
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG SITE_URL
ARG METRIKA_ID
ENV SITE_URL=$SITE_URL METRIKA_ID=$METRIKA_ID NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
# Сервер работает от непривилегированного пользователя node (uid 1000). Ему принадлежат /app (Next.js пишет
# кэш в .next/cache) и каталог заказов /data (RAZBOR_DATA_DIR, постоянный том Coolify: владелец тома на сервере — 1000:1000).
RUN mkdir -p /data && chown node:node /app /data
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]

# Build e deploy no Railway — modo standalone (menos RAM em runtime)
# bookworm-slim: mais estável que alpine para npm ci / Next SWC
FROM node:20-bookworm-slim AS deps
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1
COPY package.json package-lock.json .npmrc ./
# Sem --prefer-offline: evita cache npm corrompido entre builds falhados no Railway
RUN npm ci --no-audit --no-fund

FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
# Runtime: contentor pode ter até 8 GB no Railway — dar heap generoso ao Node
ENV NODE_OPTIONS=--max-old-space-size=6144

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts/start-server.js ./scripts/start-server.js

EXPOSE 3000
CMD ["node", "scripts/start-server.js"]

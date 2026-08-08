# Build e deploy no Railway — modo standalone (menos RAM em runtime)
# bookworm-slim: mais estável que alpine para npm ci / Next SWC
FROM node:20-bookworm-slim AS deps
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1
COPY package.json package-lock.json .npmrc ./
# npm install (estável no Railway): npm ci exige lock gerado com a mesma major do npm da imagem.
# Node 20 bookworm = npm 10; o PC pode ter npm 11. Mantemos install + lock commitado.
RUN npm install --no-audit --no-fund --prefer-online

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
# Fallback se o volume Railway não definir DATA_DIR (volume continua a sobrepor em /data)
ENV DATA_DIR=/app/data
# Runtime: contentor pode ter até 8 GB no Railway — dar heap generoso ao Node
ENV NODE_OPTIONS=--max-old-space-size=6144
RUN mkdir -p /app/data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts/start-server.js ./scripts/start-server.js

EXPOSE 3000
CMD ["node", "scripts/start-server.js"]

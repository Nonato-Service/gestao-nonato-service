# Build e deploy no Railway — modo standalone (menos RAM em runtime)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
# Runtime: servidor leve (app principal carrega só no browser). 512 MB pode bastar; 1 GB recomendado.
ENV NODE_OPTIONS=--max-old-space-size=460

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts/start-server.js ./scripts/start-server.js

EXPOSE 3000
CMD ["node", "scripts/start-server.js"]

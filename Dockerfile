# Build e deploy no Railway (evita erro do nixpacks.toml)
FROM node:20-alpine

WORKDIR /app

# Dependências
COPY package.json package-lock.json* ./
RUN npm ci

# Código e build (384MB — plano gratuito Railway ~512MB RAM; evita "Killed" no build)
COPY . .
RUN node --max-old-space-size=384 node_modules/next/dist/bin/next build

# Railway usa PORT; o script start-server.js já lê process.env.PORT
ENV NODE_ENV=production
EXPOSE 3000
# Evita npm como PID 1 (SIGTERM/restarts no Railway ficam mais limpos que com "npm start")
CMD ["node", "scripts/start-server.js"]

# Build e deploy no Railway (evita erro do nixpacks.toml)
FROM node:20-alpine

WORKDIR /app

# Dependências
COPY package.json package-lock.json* ./
RUN npm ci

# Código e build
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

# Railway usa PORT; o script start-server.js já lê process.env.PORT
ENV NODE_ENV=production
EXPOSE 3000
# Evita npm como PID 1 (SIGTERM/restarts no Railway ficam mais limpos que com "npm start")
CMD ["node", "scripts/start-server.js"]

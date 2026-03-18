# Build e deploy no Railway (evita erro do nixpacks.toml)
FROM node:20-alpine

WORKDIR /app

# Dependências
COPY package.json package-lock.json* ./
RUN npm ci

# Código e build
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=384
RUN npm run build

# Railway usa PORT; o script start-server.js já lê process.env.PORT
EXPOSE 3000
CMD ["npm", "start"]

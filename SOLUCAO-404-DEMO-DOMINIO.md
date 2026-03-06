# Resolver 404 em /demo e favicon no domínio (produção)

Se no **localhost** o `/demo` funciona mas no **domínio** (ex.: www.seudominio.com) recebe **404**, o pedido não está a chegar ao Next.js ou o servidor não está a servir todas as rotas.

---

## 1. Confirmar que a aplicação Node está a correr

Em produção tem de correr o **servidor Next.js** (não só ficheiros estáticos):

- **Build:** `npm run build`
- **Arranque:** `npm start` (ou `node scripts/start-server.js`)

Se estiver em **Railway, Render, VPS**, confirme em Settings/Start Command que o comando é `npm start` (e que antes faz `npm run build`).  
Se o host só servir HTML estático (ex.: pasta `out/` ou só FTP), **não vai funcionar** – é preciso um host que execute Node (Railway, Render, Vercel, VPS, etc.).

---

## 2. Proxy / CDN à frente do app (causa mais comum do 404)

Se usar **domínio próprio** (www.seudominio.com) com **proxy reverso** (Nginx, Apache, Caddy, Cloudflare, etc.), o proxy tem de enviar **todas as rotas** para a aplicação Node, não só `/` ou `/api`.

### Nginx (exemplo)

Todo o tráfigo para o domínio deve ir para o backend (porta onde corre o Next.js, ex.: 3000):

```nginx
server {
    server_name www.seudominio.com;
    location / {
        proxy_pass http://127.0.0.1:3000;   # ou o URL do Railway/Render
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Não tenha **só** `location /api/` ou `location = /`; tem de haver um `location /` que encaminhe **todo** o path (incluindo `/demo`) para o mesmo backend.

### Apache (exemplo)

Ative `mod_proxy` e `mod_proxy_http` e use algo como:

```apache
ProxyPreserveHost On
ProxyPass / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/
```

Assim, `/`, `/demo`, `/api/...` são todos enviados para o Next.js.

### Cloudflare

- Se usar **Cloudflare como proxy** (laranja) para o seu servidor: no servidor, o Nginx/Apache têm de estar configurados como acima (encaminhar tudo para o Node).
- Não use regras que reescrevam ou bloqueiem `/demo`; o pedido tem de chegar ao Next.js como `GET /demo`.

---

## 3. Railway / Render com domínio próprio

- No Railway/Render, adicione o **domínio personalizado** (ex.: www.seudominio.com) nas definições do projeto.
- Eles tratam do proxy; não é preciso Nginx no seu PC.  
- Depois de associar o domínio, **todas** as rotas (`/`, `/demo`, `/api/...`) devem ser servidas pelo mesmo projeto. Se só a raiz foi configurada noutro sítio (ex.: outro servidor), aí é que o `/demo` pode dar 404 – nesse caso, faça com que o domínio aponte **só** para o projeto Next.js (Railway/Render).

---

## 4. Verificar o build

Para confirmar que a rota `/demo` existe no build:

1. Na pasta do projeto: `npm run build`
2. Na saída do build, procure por rotas geradas; deve haver algo relacionado com `demo` (ex.: em `app/demo/page.tsx`).
3. Em produção, o mesmo comando de build tem de ser o que o host usa (ex.: `npm run build` no Railway/Render).

Se o build for feito noutro repo ou sem a pasta `app/demo/`, a rota `/demo` não existe e dá 404.

---

## 5. Favicon (404 em /favicon.ico)

O projeto já tem um ícone em `/icon.svg`. Foi adicionado um **rewrite** em `next.config.js` para enviar pedidos a `/favicon.ico` para `/icon.svg`, o que evita o 404 do favicon quando o Next.js está a ser servido.  
Se o 404 do favicon continuar no domínio, o motivo é o mesmo do `/demo`: os pedidos não estão a chegar ao Next.js (reveja os pontos 2 e 3).

---

## Resumo

| Situação | O que fazer |
|----------|-------------|
| Host só estático (FTP, só HTML) | Mudar para host com Node (Railway, Render, VPS, etc.) e usar `npm run build` + `npm start`. |
| Nginx/Apache à frente | Configurar `location /` (ou equivalente) para fazer proxy de **todo** o path para o Next.js (porta 3000 ou URL do serviço). |
| Domínio no Railway/Render | Garantir que o domínio aponta para este projeto e que não há outro proxy a interceptar `/demo`. |
| Build sem `app/demo/` | Garantir que o código com `app/demo/page.tsx` está no repositório que é usado no deploy e que o build inclui essa pasta. |

Depois de aplicar o que se adequar ao seu caso (proxy a encaminhar tudo para o Node, ou domínio correto no Railway/Render), faça um novo deploy e teste de novo `https://www.seudominio.com/demo`.

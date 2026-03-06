# 🌐 Como Hospedar o Gestão Técnica Nonato Service

Este guia explica como colocar o seu programa na internet. O sistema **guarda dados em arquivos** (pasta `data/`), por isso é preciso usar uma hospedagem que **mantenha disco persistente**.

**Última atualização:** Março 2026

---

## ⚠️ Importante

- **Quem hospeda é você.** Este guia só explica os passos; você precisará criar conta e configurar no site de cada serviço.
- **Dados em arquivos:** O app salva clientes, gestores, etc. em arquivos na pasta `data/`. Em serviços que “apagam” o servidor a cada deploy (como Vercel), esses dados seriam perdidos. Por isso recomendamos **Railway**, **Render** ou **VPS**.

---

## Opção 1: Railway (recomendado – mais simples)

A [Railway](https://railway.app) oferece plano gratuito (com limite de uso) e suporta **volume** para a pasta de dados.

### Passo a passo

1. **Conta**
   - Acesse https://railway.app e crie conta (pode usar GitHub ou e-mail).

2. **Novo projeto**
   - Clique em **“New Project”**.
   - Escolha **“Deploy from GitHub repo”** (se o seu código estiver no GitHub)  
     **ou** **“Empty Project”** e depois conecte o repositório ou faça deploy manual.

3. **Configurar o serviço**
   - Se usou “Deploy from GitHub repo”, selecione o repositório do **gestao-tecnica-nonato-service**.
   - O projeto tem `railway.json`: **Build** = `npm run build`, **Start** = `npm start` (usa `scripts/start-server.js` com `PORT` e `0.0.0.0`).
   - **Root Directory:** deixe em branco se o projeto está na raiz do repo.

4. **Criar volume para os dados**
   - No projeto, clique no seu serviço (o app).
   - Aba **“Variables”**: adicione uma variável:
     - Nome: `DATA_DIR`  
     - Valor: **`/app/data`**
   - Aba **“Settings”** (ou **“Volumes”**): adicione um **Volume**.
   - Nome do volume: `dados` | **Mount Path:** **`/app/data`**
   - Assim, tudo que o app salvar em `data/` será guardado nesse volume e **não se perde** quando fizer novo deploy.

5. **Deploy**
   - O deploy é feito automaticamente ao dar push no GitHub (se conectou o repo).
   - Ou use **“Deploy”** manual se subiu o código de outra forma.

6. **Ver o site**
   - Em **“Settings”** → **“Networking”** → **“Generate Domain”**.
   - Você recebe um link tipo: `https://seu-app.up.railway.app`.

### Resumo Railway

| Item        | Valor |
|------------|--------|
| Build      | `npm run build` (definido em `railway.json`) |
| Start      | `npm start` (usa `scripts/start-server.js`, porta `PORT`, escuta `0.0.0.0`) |
| Variável   | `DATA_DIR=/app/data` |
| Volume     | Montar em `/app/data` |
| Opcional   | `NODE_OPTIONS=--max-old-space-size=384` se o build falhar por memória |

---

## Opção 2: Render

A [Render](https://render.com) também tem plano gratuito e suporta **disco persistente** (pago em alguns planos).

1. Acesse https://render.com e crie conta.
2. **New** → **Web Service**.
3. Conecte o repositório do GitHub (repositório do Gestão Técnica).
4. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Em **Environment** (variáveis de ambiente), adicione:
   - `DATA_DIR` = `/data`  
   (só use se for criar um disco e montar em `/data`; no plano gratuito o disco pode ser limitado.)
6. Se usar **Disk** (disco persistente), monte em `/data` e mantenha `DATA_DIR=/data`. No Railway use sempre **`/app/data`** (ver guia DEPLOY-RAILWAY.md).
7. Deploy: Render faz deploy automático a cada push.

O plano gratuito pode reiniciar o serviço após inatividade; os dados só persistem se você tiver disco persistente configurado.

---

## Opção 3: VPS (máquina sua – mais controle)

Com um **VPS** (ex.: DigitalOcean, Contabo, Hostinger VPS) você instala Node.js e sobe o app; a pasta `data/` fica no servidor e nunca é apagada por um provedor.

### No servidor (Linux)

```bash
# Instalar Node.js (exemplo Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar ou enviar o projeto (exemplo com git)
git clone https://github.com/SEU-USUARIO/gestao-tecnica-nonato-service.git
cd gestao-tecnica-nonato-service

# Instalar e buildar
npm install
npm run build

# Rodar em produção (porta 3000)
npm start
```

Para manter o app rodando sempre (mesmo após reiniciar o servidor), use **PM2**:

```bash
sudo npm install -g pm2
pm2 start npm --name "gestao-tecnica" -- start
pm2 save
pm2 startup
```

No VPS **não precisa** definir `DATA_DIR`: o padrão já usa a pasta `data/` dentro do projeto.

---

## O que foi ajustado no projeto para hospedagem

Foi adicionado suporte à variável de ambiente **`DATA_DIR`** em todas as APIs que leem/escrevem na pasta de dados:

- Se você definir `DATA_DIR` (por exemplo `DATA_DIR=/data`), o app usa essa pasta.
- Se não definir, continua usando `data/` dentro do projeto (como no seu PC).

Assim você pode, na Railway ou Render, montar um volume em `/data` e definir `DATA_DIR=/data` para os dados não se perderem.

---

## Checklist antes de hospedar

- [ ] Código no **GitHub** (ou outro Git) para conectar à Railway/Render.
- [ ] **Node.js** em versão 20 ou 22 (ajuste no servidor ou no painel da hospedagem se necessário).
- [ ] Na hospedagem: **variável `DATA_DIR`** apenas se usar volume/disco (Railway: `DATA_DIR=/app/data`; Render: `DATA_DIR=/data` se montar disco em `/data`).
- [ ] Volume/disco: Railway **`/app/data`**; Render **`/data`** se quiser persistência dos dados.

---

## Dúvidas comuns

**Preciso de cartão de crédito?**  
- Railway: pode pedir para o plano gratuito.  
- Render: plano gratuito sem cartão em muitos casos.  
- VPS: sim, para contratar o servidor.

**O meu programa fica gratuito?**  
- Railway e Render têm limites no plano grátis (uso de CPU/memória/horas).  
- Para uso contínuo e mais dados, um plano pago ou VPS costuma ser necessário.

**Posso usar meu próprio domínio?**  
- Sim. Na Railway/Render há opção para colocar domínio próprio. No VPS você configura no painel ou no Nginx.

**E os backups do código (pasta `backups/`)?**  
- Na Railway/Render, a pasta `backups/` do projeto normalmente **não** fica em volume; ou seja, backups feitos pelo app podem se perder ao redeployar. Se quiser backups persistentes, seria preciso também mapear um volume para a pasta de backups (ou desativar backup automático na nuvem e fazer backup só no seu PC).

---

**Resumo:** Você pode hospedar sozinho seguindo este guia. A opção mais simples para começar é **Railway**: criar conta, conectar o repo **gestao-tecnica-nonato-service**, definir **`DATA_DIR=/app/data`**, criar volume com mount path **`/app/data`** e gerar o domínio. Guia passo a passo: **DEPLOY-RAILWAY.md**.

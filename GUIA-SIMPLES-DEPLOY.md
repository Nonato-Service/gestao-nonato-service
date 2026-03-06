# Guia Muito Simples — Colocar o App na Internet

**Objetivo:** O telemóvel e o tablet funcionarem mesmo com o PC desligado.

Não precisa de saber programar. Siga os passos por ordem.

---

## PARTE 1 — Criar conta no GitHub

1. Abra o **Chrome** (ou outro navegador).
2. Escreva na barra de endereço: **github.com**
3. Prima **Enter**.
4. No canto superior direito, clique em **Sign up**.
5. Preencha:
   - **Email:** o seu email
   - **Password:** escolha uma senha (mínimo 15 caracteres, ou 8 com letras e números)
   - **Username:** um nome único (ex: joao-nonato)
6. Clique em **Create account**.
7. Se pedir, confirme o email (abrir o email e clicar no link).
8. Feito. Já tem conta no GitHub.

---

## PARTE 2 — Criar o repositório (o "sítio" para o código)

1. Com o GitHub aberto, clique no símbolo **+** (canto superior direito).
2. Clique em **New repository**.
3. Em **Repository name**, escreva: **gestao-tecnica-nonato-service** (ou **gestao-nonato** se preferir um nome mais curto)
4. Em **Description** pode deixar em branco.
5. Escolha **Private** (só você vê).
6. **NÃO** marque "Add a README file".
7. Clique no botão verde **Create repository**.
8. Vai aparecer uma página com um endereço tipo:
   ```
   https://github.com/SEU-USERNAME/gestao-tecnica-nonato-service.git
   ```
9. **Copie esse endereço** (clique com o botão direito e "Copiar").

---

## PARTE 3 — Enviar o projeto para o GitHub

1. Abra a pasta do projeto no seu PC:
   ```
   C:\Users\W10\gestao-tecnica-nonato-service
   ```
2. Procure o ficheiro **ENVIAR-PARA-GITHUB.bat**.
3. Dê **dois cliques** nele.
4. Vai abrir uma janela preta.
5. Quando aparecer a pergunta, **cole o endereço** que copiou (botão direito do rato → Colar).
6. Prima **Enter**.
7. Pode pedir **login**:
   - **Username:** o seu username do GitHub (ex: joao-nonato)
   - **Password:** NÃO use a sua senha normal. Use um **token** (ver abaixo).

### Como criar o token (senha especial) para o GitHub

1. No GitHub, clique na sua **fotografia** (canto superior direito).
2. Clique em **Settings**.
3. Na barra à esquerda, vá ao fim e clique em **Developer settings**.
4. Clique em **Personal access tokens** → **Tokens (classic)**.
5. Clique em **Generate new token** → **Generate new token (classic)**.
6. Se pedir a sua senha, escreva e confirme.
7. Em **Note**, escreva: **deploy**
8. Em **Expiration**, escolha **90 days**.
9. Marque a caixa **repo**.
10. Desça e clique em **Generate token**.
11. **Copie o token** (é uma sequência de letras e números). Guarde-o num sítio seguro. Só aparece uma vez.
12. Quando o ENVIAR-PARA-GITHUB.bat pedir password, **cole esse token** (não a sua senha).

---

## PARTE 4 — Criar conta no Railway

1. Abra no browser: **railway.app**
2. Clique em **Login**.
3. Clique em **Login with GitHub**.
4. Autorize o Railway (clique em **Authorize**).
5. Feito. Já está no Railway.

---

## PARTE 5 — Fazer o deploy (colocar o app na internet)

1. No Railway, clique em **New Project**.
2. Escolha **Deploy from GitHub repo**.
3. Se pedir para ligar o GitHub, clique em **Configure GitHub App** e autorize.
4. Na lista, procure **gestao-tecnica-nonato-service** (ou o nome do seu repositório) e clique nele.
5. Clique em **Deploy Now**.
6. Espere alguns minutos (2–5 min). Vai aparecer um ícone a carregar.
7. Quando terminar, clique no **quadrado** do seu projeto (o serviço).
8. Vá ao separador **Settings** (em cima).
9. Desça até **Networking**.
10. Em **Public Networking**, clique em **Generate Domain**.
11. Vai aparecer um endereço tipo: `gestao-tecnica-nonato-service-production-xxxx.up.railway.app`
12. **Copie esse endereço**. É o link do seu app.

---

## PARTE 6 — Guardar os dados (importante)

Sem isto, os dados podem perder-se ao reiniciar.

1. Ainda no Railway, com o serviço aberto, vá a **Settings**.
2. Desça até **Volumes**.
3. Clique em **+ New Volume**.
4. Nome: **dados**
5. Mount Path: **/app/data** (obrigatório para os dados persistirem)
6. Clique em **Add**.
7. Desça até **Variables**.
8. Clique em **+ New Variable**.
9. Nome: **DATA_DIR**
10. Valor: **/app/data**
11. Clique em **Add**.
12. O Railway vai fazer um novo deploy. Espere 1–2 minutos.

---

## PARTE 7 — Usar no telemóvel e tablet

1. Abra o **Chrome** no telemóvel ou tablet.
2. Escreva (ou cole) o endereço que copiou: `https://gestao-tecnica-nonato-service-production-xxxx.up.railway.app`
3. O app vai abrir.
4. Pode guardar o atalho:
   - No telemóvel: Menu do Chrome → **Adicionar ao ecrã inicial**
   - Assim abre como uma app.

---

## Resumo rápido

| Parte | O que fazer |
|-------|-------------|
| 1 | Criar conta em github.com |
| 2 | Criar repositório "gestao-tecnica-nonato-service" (ou "gestao-nonato") |
| 3 | Correr ENVIAR-PARA-GITHUB.bat e colar o link |
| 4 | Criar conta em railway.app (com GitHub) |
| 5 | New Project → Deploy from GitHub → escolher o repositório → Generate Domain |
| 6 | (Opcional) Volumes — se não aparecer, avance |
| 7 | Abrir o link no telemóvel/tablet |

---

## Problemas comuns

**"git não é reconhecido"**  
Instale o Git: https://git-scm.com/download/win — depois reinicie o PC e tente de novo.

**"Authentication failed"**  
Use o token (não a senha). Crie um novo token se for preciso.

**O deploy falha no Railway**  
Veja o separador **Deployments** e leia a mensagem de erro. Pode escrever-me o que aparece.

**O app abre mas não guarda dados**  
Se tiver a opção Volumes, faça a PARTE 6. Se não tiver, o Railway pode reiniciar e perder dados; use o app na mesma.

**"Não encontro Volumes"**  
É normal em contas gratuitas. Ignore e use o app — funciona na mesma.

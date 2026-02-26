# Guia: Colocar o App na Internet (Railway)

Siga estes passos para que o telemóvel e tablet funcionem mesmo com o PC desligado.

---

## 1. Criar conta no GitHub

1. Abra **https://github.com** no browser
2. Clique em **Sign up**
3. Crie uma conta (email, password, nome de utilizador)
4. Confirme o email se for pedido

---

## 2. Criar um repositório no GitHub

1. Faça login no GitHub
2. Clique no **+** no canto superior direito → **New repository**
3. Nome: `gestao-nonato-service` (ou outro)
4. Deixe **Private** ou **Public** (à sua escolha)
5. **NÃO** marque "Add a README"
6. Clique em **Create repository**
7. Copie o endereço que aparece (ex: `https://github.com/SEU_USER/gestao-nonato-service.git`)

---

## 3. Enviar o projeto para o GitHub

Abra o **PowerShell** na pasta do projeto e execute (substitua pelo seu endereço):

```powershell
cd C:\Users\W10\gestao-tecnica-nonato-service

git add .
git commit -m "Projeto inicial"
git branch -M main
git remote add origin https://github.com/SEU_USER/gestao-nonato-service.git
git push -u origin main
```

**Nota:** Quando pedir utilizador e password, use o seu login do GitHub. Se pedir token, vá a GitHub → Settings → Developer settings → Personal access tokens e crie um token com permissão `repo`.

---

## 4. Criar conta no Railway

1. Abra **https://railway.app**
2. Clique em **Login** → **Login with GitHub**
3. Autorize o Railway a aceder à sua conta GitHub

---

## 5. Criar o projeto no Railway

1. No Railway, clique em **New Project**
2. Escolha **Deploy from GitHub repo**
3. Se pedir, ligue a sua conta GitHub
4. Selecione o repositório `gestao-nonato-service`
5. Clique em **Deploy Now**

O Railway vai começar a fazer o deploy. Aguarde alguns minutos.

---

## 6. Adicionar Volume (para os dados não se perderem)

1. No seu projeto, clique no **serviço** (caixa com o nome do repositório)
2. Vá ao separador **Settings**
3. Em **Volumes**, clique em **+ New Volume**
4. Nome: `dados`
5. **Mount Path:** `/app/data`
6. Clique em **Add**
7. O Railway vai fazer um novo deploy. Aguarde.

---

## 7. Obter o URL do app

1. No Railway, clique no serviço
2. Vá ao separador **Settings**
3. Em **Networking** → **Public Networking**, clique em **Generate Domain**
4. Será criado um URL tipo: `gestao-nonato-service-production-xxxx.up.railway.app`
5. Copie esse URL

---

## 8. Usar no telemóvel e tablet

Abra o URL copiado no **Chrome** do telemóvel ou tablet. Pode adicionar à área de trabalho para abrir como app.

---

## Resumo

| Passo | O que fazer |
|-------|-------------|
| 1–2 | Criar conta e repositório no GitHub |
| 3 | Enviar o código (PowerShell) |
| 4–5 | Criar conta e projeto no Railway |
| 6 | Adicionar Volume com path `/app/data` |
| 7 | Gerar o domínio público |
| 8 | Usar o URL no telemóvel/tablet |

---

## Atualizar o app depois

Quando alterar o código:

```powershell
cd C:\Users\W10\gestao-tecnica-nonato-service
git add .
git commit -m "Atualização"
git push
```

O Railway faz o deploy automaticamente.

---

## Problemas?

- **Erro de login no Git:** Use um Personal Access Token em vez da password.
- **Deploy falha:** Verifique se há erros no separador **Deployments** do Railway.
- **Dados desaparecem:** Confirme que o Volume está com Mount Path `/app/data`.

# Atualizações Rápidas — Gestão Técnica Nonato Service

Este guia explica como aplicar mudanças no programa e atualizar o deploy de forma **rápida e eficiente**.

---

## 1. Fazer alterações no código

- No **Cursor** (ou no seu editor), edite os ficheiros que precisar.
- Em desenvolvimento local, com `npm run dev` a correr, as alterações aparecem **de imediato** no browser (hot reload). Não é preciso reiniciar o servidor para ver mudanças na interface.

---

## 2. Publicar na internet (Railway)

Quando quiser que as alterações fiquem disponíveis no site em produção:

### Opção A — Um duplo clique (recomendado)

1. Execute **ATUALIZAR-DEPLOY.bat** (duplo clique no ficheiro).
2. O script faz automaticamente:
   - `git add .`
   - `git commit -m "Atualização DD-MM-AAAA HH:MM"` (ou mensagem que indicar)
   - `git push`
3. O **Railway** deteta o push e faz o deploy sozinho. Em **2–5 minutos** o site fica atualizado.

### Opção B — Com mensagem personalizada

- Arraste o ficheiro **ATUALIZAR-DEPLOY.bat** para a linha de comandos e adicione a mensagem:
  ```
  ATUALIZAR-DEPLOY.bat "Correção do relatório de serviço"
  ```
- Ou no PowerShell, na pasta do projeto:
  ```powershell
  git add .
  git commit -m "Sua mensagem aqui"
  git push
  ```

---

## 3. Resumo

| O que quer           | O que fazer                                      |
|----------------------|--------------------------------------------------|
| Ver mudanças no PC   | Ter `npm run dev` a correr — atualiza sozinho    |
| Publicar na internet| Executar **ATUALIZAR-DEPLOY.bat** (ou git push)  |
| Ver estado do deploy | Abrir o painel do Railway → Deployments          |

---

## 4. Problemas comuns

- **"Não é um repositório Git"**  
  Execute primeiro **ENVIAR-PARA-GITHUB.bat** para configurar o repositório e o remote.

- **Pedido de login no push**  
  Use o seu **nome de utilizador** do GitHub e, em vez da palavra-passe, um **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens).

- **Railway não atualizou**  
  Confirme no Railway que o repositório está ligado e que o deploy está configurado para o branch `main`. Veja os logs em **Deployments**.

---

**Última atualização:** Março 2026

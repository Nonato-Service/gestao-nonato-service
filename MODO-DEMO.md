# Modo Demonstração (Teste 15 dias)

O sistema tem uma **opção de teste por 15 dias**: o cliente acede por um link, usa a aplicação em modo demonstração e **nada é guardado no vosso banco de dados principal**. Ao fim de 15 dias o acesso é **bloqueado** automaticamente.

## Como usar

1. **Link para o cliente testar:**
   ```
   https://seu-dominio.up.railway.app/demo
   ```
   (Substitua pelo vosso domínio, ex.: gest-o-nonato-gestao.up.railway.app/demo)

2. O cliente abre o link → vê a página "Acesso de demonstração" → clica em **"Aceitar e entrar"**. O sistema grava um cookie e redireciona para a app.

3. **Dados isolados:** Tudo o que o cliente fizer no teste fica numa pasta separada no servidor (`data/demo/`). Os vossos dados reais (clientes, orçamentos, etc.) **não são alterados**.

4. **Ao fim de 15 dias:** O acesso fica bloqueado. É mostrada a mensagem "O período de 15 dias de demonstração terminou. Entre em contacto para obter acesso completo." e não é possível guardar nem continuar a usar.

5. **Restrições no modo demo:**
   - Sem exportação de dados
   - Sem backup (completo ou do código)
   - Sem restauração de backups
   - Sem importação por URL
   - Marca "DEMO" nos PDFs/relatórios gerados

## Segurança

- O **banco de dados principal** (ficheiros em `data/`, ex.: nonato-clientes.json) **não é usado** em modo demo. A API escreve apenas em `data/demo/`.
- A API verifica o cookie em cada pedido e usa a pasta correta.
- Após expiração, os cookies são limpos e a API devolve 403 (bloqueado).

## Configuração

O período de 15 dias está definido em `app/api/data/demo-context.ts` (constante `DEMO_DAYS`).

## 404 em /demo no domínio (produção)

Se no localhost o `/demo` funciona mas no domínio dá **404**, o pedido não está a chegar ao Next.js. Veja o guia **SOLUCAO-404-DEMO-DOMINIO.md** (proxy, deploy e favicon).

# Modo Demonstração

O sistema suporta um **modo demonstração** que permite partilhar um link para outra pessoa usar durante **15 dias**, com dados isolados e sem possibilidade de exportar ou fazer backup.

## Como usar

1. **Criar o link demo:** O utilizador deve aceder a:
   ```
   https://seu-dominio.up.railway.app/demo
   ```

2. Ao aceder, o sistema define automaticamente um cookie e redireciona para a aplicação em modo demo.

3. **Dados isolados:** Tudo o que a pessoa fizer fica guardado numa pasta separada (`data/demo/`), não afetando os dados principais.

4. **Expiração:** Após 15 dias, o acesso é bloqueado e é mostrada a mensagem "Demonstração expirada".

5. **Restrições no modo demo:**
   - Sem exportação de dados
   - Sem backup (completo ou do código)
   - Sem restauração de backups
   - Sem importação por URL
   - Marca "DEMO" nos PDFs/relatórios gerados

## Segurança

- Os dados da demo ficam em `data/demo/` (ou `$DATA_DIR/demo` no Railway).
- A API verifica o cookie em cada pedido e usa a pasta correta.
- Após expiração, os cookies são limpos e o acesso é negado.

## Configuração

O período de 15 dias está definido em `app/api/data/demo-context.ts` (constante `DEMO_DAYS`).

## 404 em /demo no domínio (produção)

Se no localhost o `/demo` funciona mas no domínio dá **404**, o pedido não está a chegar ao Next.js. Veja o guia **SOLUCAO-404-DEMO-DOMINIO.md** (proxy, deploy e favicon).

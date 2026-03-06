# Próximos passos se o deploy ainda falhar

## O que já foi feito

- Configuração de porta (PORT do Railway)
- Escuta em 0.0.0.0
- Nixpacks com build separado
- Limite de memória 384MB no build
- `dynamic = 'force-dynamic'` no layout (reduz "Collecting page data")
- ESLint desativado no build

---

## Opção 1: Tentar novamente no Railway

Faça commit e push das novas alterações:

```bash
git add .
git commit -m "Otimizações adicionais para reduzir memória no build"
git push
```

Aguarde o redeploy. O `dynamic = 'force-dynamic'` reduz bastante o uso de memória na fase "Collecting page data".

---

## Opção 2: Variável NODE_OPTIONS no Railway

No painel do Railway:

1. Projeto → **[nome do seu serviço, ex: GESTAO-TECNICA-NONATO]** → **Variables**
2. **Add Variable**
3. Nome: `NODE_OPTIONS`
4. Valor: `--max-old-space-size=384`
5. Salve e force um novo deploy (Redeploy)

---

## Opção 3: Render (alternativa gratuita)

O [Render](https://render.com) às vezes lida melhor com builds Next.js no plano gratuito.

1. Acesse https://render.com e crie conta
2. **New** → **Web Service**
3. Conecte o repositório do GitHub
4. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - Adicione variável: `NODE_OPTIONS` = `--max-old-space-size=384`
5. Em **Environment** adicione também: `PORT` (o Render define automaticamente, mas verifique)

---

## Opção 4: Plano pago Railway ($5/mês)

O plano gratuito do Railway tem cerca de **512MB de RAM**. Seu projeto pode precisar de mais memória.

No Railway:

1. **Settings** do projeto
2. **Upgrade** ou adicione cartão de crédito
3. O plano **Developer** ($5/mês) oferece mais recursos

---

## Opção 5: Build local + deploy manual

Se nada funcionar na nuvem, é possível fazer o build no seu PC e enviar para um servidor:

1. No seu PC: `npm run build`
2. Envie a pasta `.next` e os arquivos necessários para um VPS (ex.: Hostinger, DigitalOcean)
3. No servidor: `npm start`

---

## Verificar os logs

Em qualquer tentativa, sempre confira os **Deploy Logs** para ver:

- Se o build completa
- Se o erro continua sendo "Killed"
- Se aparece outra mensagem de erro

Os logs indicam exatamente em qual etapa está falhando.

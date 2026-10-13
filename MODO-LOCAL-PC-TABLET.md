# Modo local: PC (hub) + tablet na Wi‑Fi

Uso diário **sem Railway / sem nuvem**. O PC Windows fica ligado e corre a Gestão Técnica Nonato Service; o tablet abre o mesmo sistema pelo IP da rede local.

## 1. Iniciar no PC

1. Duplo clique em **`INICIAR-NONATO-LOCAL.bat`** (na pasta do projeto).
2. Na primeira vez: pode instalar dependências; se ainda não houver *build*, arranca em `next dev` (rápido).
3. **Não feche a janela** do `.bat` enquanto quiser usar o sistema.
4. No PC: abra `http://localhost:3000`.

Dados ficam em **`data-local\`** no disco do PC (cadastros não são apagados ao reiniciar).

Opcional (produção local mais durável): no terminal, `npm run build` uma vez, ou `set NONATO_LOCAL_BUILD=1` e volte a correr o `.bat` — depois usa `npm start` / `start-server.js`.

## 2. Abrir no tablet

1. PC e tablet na **mesma Wi‑Fi**.
2. Na janela do `.bat` aparece o endereço, por exemplo:  
   `http://192.168.1.45:3000`
3. No browser do tablet, abra esse URL.
4. Pode “Adicionar ao ecrã inicial” (PWA) se quiser ícone no tablet.

## 3. Firewall (se o tablet não ligar)

No PC, permitir a porta **3000** TCP (entrada). Em PowerShell **como Administrador**:

```text
netsh advfirewall firewall add rule name="Nonato Local 3000" dir=in action=allow protocol=TCP localport=3000
```

## 4. Railway / nuvem

Neste modo **não é necessário** Railway nem internet para o dia a dia — só a rede Wi‑Fi local.

A configuração de deploy Railway do repositório **não é alterada**; quem ainda usar a nuvem continua com o fluxo habitual (`ATUALIZAR-DEPLOY.bat`, etc.).

## 5. Limitações

| Limite | Detalhe |
|--------|---------|
| Mesma Wi‑Fi | Tablet fora da rede do PC não acede |
| PC ligado | Se o PC desligar ou fechar o `.bat`, o hub para |
| IP pode mudar | Se o router der outro IP ao PC, use o novo URL mostrado no `.bat` |

## Variáveis (opcional)

Ver **`env.local.example`**. O `.bat` já define `DATA_DIR`, `HOSTNAME=0.0.0.0` e `PORT=3000`.

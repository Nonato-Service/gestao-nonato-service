# 🚨 SOLUÇÃO URGENTE - ERRO EPERM

## ❌ Problema Identificado
O servidor Next.js não está conseguindo iniciar devido ao erro **EPERM** (permissão negada). Este erro ocorre quando o Node.js tenta criar processos filhos, mas é bloqueado pelo sistema operacional ou antivírus.

## ✅ SOLUÇÕES (Tente nesta ordem)

### Solução 1: Executar como Administrador ⭐ RECOMENDADO

1. **Feche todos os processos Node.js:**
   ```powershell
   Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

2. **Execute o script como Administrador:**
   - Clique com botão direito em `INICIAR-SERVIDOR-FIX-EPERM.bat`
   - Selecione "Executar como administrador"
   - Aguarde o servidor iniciar

### Solução 2: Adicionar Exceção no Antivírus

1. **Windows Defender:**
   - Abra "Segurança do Windows"
   - Vá em "Proteção contra vírus e ameaças"
   - Clique em "Gerenciar configurações"
   - Role até "Exclusões"
   - Adicione esta pasta: `C:\Users\W10\gestao-tecnica-nonato-service`

2. **Outros Antivírus:**
   - Adicione a pasta do projeto nas exceções
   - Adicione o Node.js nas exceções

### Solução 3: Usar Porta Diferente

Se a porta 3000 estiver bloqueada:

```cmd
cd C:\Users\W10\gestao-tecnica-nonato-service
npm run dev -- -p 3001
```

Depois acesse: `http://localhost:3001`

### Solução 4: Reinstalar Node.js

O erro EPERM pode ser causado por instalação corrompida do Node.js:

1. Desinstale o Node.js atual
2. Baixe a versão LTS de: https://nodejs.org
3. Instale como Administrador
4. Reinicie o computador
5. Tente iniciar o servidor novamente

### Solução 5: Verificar Políticas de Segurança do Windows

1. Abra "Política de Segurança Local" (secpol.msc)
2. Vá em "Políticas Locais" → "Atribuição de direitos de usuário"
3. Verifique "Criar um arquivo de paginação" e "Ajustar cotas de memória"
4. Adicione seu usuário se necessário

### Solução 6: Usar Modo Standalone (Produção)

Se o modo de desenvolvimento não funcionar:

```cmd
cd C:\Users\W10\gestao-tecnica-nonato-service
npm run build
npm start
```

Isso inicia o servidor em modo de produção (sem hot-reload).

## 🔍 Diagnóstico

### Verificar se o problema é o arquivo page.tsx

O arquivo `app/page.tsx` tem **37.306 linhas**, o que pode causar problemas de compilação. Para verificar:

```powershell
cd C:\Users\W10\gestao-tecnica-nonato-service
(Get-Content app\page.tsx | Measure-Object -Line).Lines
```

Se necessário, considere dividir este arquivo em componentes menores.

### Verificar Logs do Next.js

Os logs do servidor mostrarão o erro exato. Verifique a janela do servidor ou execute:

```cmd
cd C:\Users\W10\gestao-tecnica-nonato-service
npm run dev > server.log 2>&1
```

Depois verifique o arquivo `server.log`.

## 📋 Checklist Rápido

- [ ] Executou como Administrador?
- [ ] Adicionou pasta nas exceções do antivírus?
- [ ] Parou todos os processos Node.js?
- [ ] Limpou o cache (.next)?
- [ ] Tentou porta diferente (3001)?
- [ ] Verificou se Node.js está atualizado?
- [ ] Reiniciou o computador?

## 🆘 Se Nada Funcionar

1. **Entre em contato com suporte técnico**
2. **Forneça estas informações:**
   - Versão do Node.js: `node --version`
   - Versão do Windows: `winver`
   - Logs do servidor
   - Mensagem de erro completa

## 📝 Notas Importantes

- O erro EPERM geralmente é causado por **antivírus** ou **políticas de segurança do Windows**
- O arquivo `page.tsx` com 37.000+ linhas pode causar problemas de performance
- Sempre execute scripts como Administrador quando houver problemas de permissão

---

**Última atualização:** 25 de Janeiro de 2026

# 🚀 GUIA COMPLETO - INÍCIO AUTOMÁTICO DO SERVIDOR

## ⚠️ PROBLEMA ATUAL

O servidor não está iniciando automaticamente devido a um erro de permissão (EPERM). Este guia resolve isso completamente.

## ✅ SOLUÇÃO PASSO A PASSO

### PASSO 1: Resolver Erro de Permissão

1. **Execute como Administrador:**
   - Clique com botão direito em: `RESOLVER-ERRO-PERMISSAO.bat`
   - Selecione: "Executar como administrador"
   - Aguarde a conclusão

2. **Se o servidor iniciar:**
   - ✅ Problema resolvido!
   - Continue para o Passo 2

3. **Se ainda não funcionar:**
   - Adicione a pasta às exceções do antivírus:
     ```
     C:\Users\W10\gestao-tecnica-nonato-service
     ```
   - Execute novamente como Administrador

### PASSO 2: Configurar Início Automático

1. **Execute o reparo:**
   - Duplo clique em: `REPARAR-INICIO-AUTOMATICO.bat`
   - Aguarde a conclusão

2. **OU execute a configuração completa:**
   - Clique com botão direito em: `CONFIGURAR-INICIO-AUTOMATICO-DEFINITIVO.bat`
   - Selecione: "Executar como administrador"
   - Aguarde a conclusão

### PASSO 3: Testar

1. **Teste rápido:**
   - Duplo clique em: `TESTAR-INICIO-AUTOMATICO.bat`
   - Aguarde 15 segundos
   - Acesse: http://localhost:3000
   - Se carregar, está funcionando! ✅

2. **Teste completo:**
   - Faça logout e login novamente
   - OU reinicie o computador
   - Aguarde 15-20 segundos após login
   - Acesse: http://localhost:3000
   - Se carregar, está funcionando! ✅

## 🔧 SOLUÇÃO DE PROBLEMAS

### Erro: "Error: spawn EPERM"

**Causa:** Permissão negada pelo sistema ou antivírus

**Soluções:**
1. Execute scripts como Administrador
2. Adicione a pasta às exceções do antivírus
3. Execute: `RESOLVER-ERRO-PERMISSAO.bat` como Administrador

### Servidor não inicia automaticamente

**Causa:** Atalho na pasta de inicialização não está funcionando

**Soluções:**
1. Execute: `REPARAR-INICIO-AUTOMATICO.bat`
2. Verifique se o atalho existe:
   - Pressione `Win + R`
   - Digite: `shell:startup`
   - Verifique se existe: `NextJS-NonatoService-AutoStart.lnk`
3. Configure via Task Scheduler (veja abaixo)

### Servidor inicia mas para depois

**Causa:** Script não está mantendo o servidor rodando

**Soluções:**
1. Execute: `REPARAR-INICIO-AUTOMATICO.bat`
2. Verifique se a janela do servidor está minimizada (não feche!)
3. Configure o monitor automático (veja abaixo)

## 📋 CONFIGURAÇÃO VIA TASK SCHEDULER (MAIS CONFIÁVEL)

Se a pasta de inicialização não funcionar, use o Task Scheduler:

1. **Pressione `Win + R`**
2. **Digite:** `taskschd.msc`
3. **Clique em:** "Criar Tarefa Básica"
4. **Configure:**
   - Nome: `Iniciar Servidor Next.js`
   - Gatilho: "Quando eu fizer logon" + "Na inicialização do sistema"
   - Ação: Iniciar programa
   - Programa: `C:\Users\W10\gestao-tecnica-nonato-service\start-server-auto.bat`
   - Iniciar em: `C:\Users\W10\gestao-tecnica-nonato-service`
5. **Nas Propriedades:**
   - Aba "Geral": Marque "Executar com os mais altos privilégios"
   - Aba "Condições": Desmarque "Iniciar somente se conectado à energia CA"
   - Clique em "OK"

## ✅ VERIFICAÇÃO FINAL

Após configurar, verifique:

1. **Servidor está rodando:**
   ```cmd
   netstat -ano | findstr ":3000" | findstr "LISTENING"
   ```
   Se retornar algo, está funcionando! ✅

2. **Atalho na pasta de inicialização existe:**
   - `Win + R` → `shell:startup`
   - Verifique se existe o atalho

3. **Tarefa no Task Scheduler existe:**
   - `Win + R` → `taskschd.msc`
   - Procure por: `NextJS-NonatoService-AutoStart` ou `Iniciar Servidor Next.js`

## 🎯 RESULTADO ESPERADO

Após seguir todos os passos:

- ✅ Erro de permissão resolvido
- ✅ Servidor inicia automaticamente ao fazer login
- ✅ Servidor inicia automaticamente ao reiniciar
- ✅ Servidor permanece rodando em segundo plano
- ✅ Acesse sempre em: http://localhost:3000

## 📝 ARQUIVOS IMPORTANTES

- `RESOLVER-ERRO-PERMISSAO.bat` - Resolve erro de permissão
- `REPARAR-INICIO-AUTOMATICO.bat` - Repara início automático
- `TESTAR-INICIO-AUTOMATICO.bat` - Testa se funciona
- `CONFIGURAR-INICIO-AUTOMATICO-DEFINITIVO.bat` - Configuração completa
- `start-server-auto.bat` - Script que inicia o servidor

## 🆘 AINDA COM PROBLEMAS?

Se após seguir todos os passos ainda não funcionar:

1. **Verifique Node.js:**
   ```cmd
   node --version
   npm --version
   ```

2. **Reinstale dependências:**
   ```cmd
   cd C:\Users\W10\gestao-tecnica-nonato-service
   rmdir /s /q node_modules
   npm install
   ```

3. **Teste manualmente:**
   ```cmd
   cd C:\Users\W10\gestao-tecnica-nonato-service
   npm run dev
   ```
   Se funcionar manualmente, o problema é apenas na configuração automática.

4. **Contate o suporte** com:
   - Mensagens de erro
   - Resultado dos comandos acima
   - Versão do Node.js

---

**Última atualização:** Janeiro 2026  
**Status:** ✅ Guia completo de solução

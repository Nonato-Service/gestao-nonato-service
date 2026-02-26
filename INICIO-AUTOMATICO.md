# 🚀 Configuração de Início Automático do Servidor

Este documento explica como configurar o servidor Next.js para iniciar automaticamente quando você fizer login no Windows.

## 📋 Métodos Disponíveis

### Método 1: Task Scheduler (Recomendado) ⭐

Este é o método mais robusto e recomendado. Usa o Agendador de Tarefas do Windows.

#### Como Configurar:

1. **Execute o script de configuração:**
   - Duplo clique em: `configurar-inicio-automatico.bat`
   - OU execute no PowerShell:
     ```powershell
     cd C:\Users\W10\gestao-tecnica-nonato-service
     .\configurar-inicio-automatico.ps1
     ```

2. **O script irá:**
   - Criar uma tarefa agendada no Task Scheduler
   - Configurar para iniciar automaticamente ao fazer login
   - Verificar se o Node.js está instalado
   - Instalar dependências se necessário

#### Como Remover:

- Duplo clique em: `remover-inicio-automatico.bat`
- OU execute no PowerShell:
  ```powershell
  cd C:\Users\W10\gestao-tecnica-nonato-service
  .\remover-inicio-automatico.ps1
  ```

### Método 2: Pasta de Inicialização (Alternativo)

Se o Task Scheduler não funcionar, o script tentará criar um atalho na pasta de inicialização do Windows.

**Localização da pasta:** `C:\Users\W10\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

## 📁 Arquivos Criados

- `start-server-auto.bat` - Script que inicia o servidor
- `start-server-silent.vbs` - Script VBS para iniciar sem janela (opcional)
- `configurar-inicio-automatico.ps1` - Script PowerShell principal
- `configurar-inicio-automatico.bat` - Atalho batch para executar o PowerShell
- `remover-inicio-automatico.ps1` - Script para remover a configuração
- `remover-inicio-automatico.bat` - Atalho batch para remover

## ✅ Verificar se Está Funcionando

Após configurar, você pode verificar:

1. **Verificar a tarefa agendada:**
   ```powershell
   Get-ScheduledTask -TaskName "NextJS-NonatoService-AutoStart"
   ```

2. **Abrir o Task Scheduler:**
   - Pressione `Win + R`
   - Digite: `taskschd.msc`
   - Procure por: `NextJS-NonatoService-AutoStart`

3. **Testar manualmente:**
   - Faça logout e login novamente
   - O servidor deve iniciar automaticamente
   - Acesse: http://localhost:3000

## 🔧 Solução de Problemas

### O servidor não inicia automaticamente

1. **Verifique se o Node.js está instalado:**
   ```powershell
   node --version
   ```

2. **Verifique se as dependências estão instaladas:**
   ```powershell
   cd C:\Users\W10\gestao-tecnica-nonato-service
   npm install
   ```

3. **Teste o script manualmente:**
   ```powershell
   .\start-server-auto.bat
   ```

4. **Verifique os logs do Task Scheduler:**
   - Abra o Task Scheduler
   - Encontre a tarefa `NextJS-NonatoService-AutoStart`
   - Clique com botão direito → "Executar"
   - Verifique o histórico para erros

### Erro de permissão

Se você receber erro de permissão, execute o PowerShell como Administrador:

1. Clique com botão direito no PowerShell
2. Selecione "Executar como administrador"
3. Execute o script novamente

### Janela do servidor aparece

Se você não quiser ver a janela do servidor, use o script VBS:

1. Edite a tarefa no Task Scheduler
2. Altere o programa para: `start-server-silent.vbs`

## 📝 Notas Importantes

- O servidor iniciará automaticamente **apenas quando você fizer login**
- Se você não fizer login, o servidor não iniciará
- O servidor roda na porta 3000 (http://localhost:3000)
- Se a porta 3000 estiver em uso, o Next.js tentará usar outra porta

## 🎯 Próximos Passos

Após configurar o início automático:

1. Faça logout e login para testar
2. Verifique se o servidor está rodando em http://localhost:3000
3. Se tudo estiver funcionando, você não precisará mais iniciar manualmente!

---

**Última atualização:** Janeiro 2026

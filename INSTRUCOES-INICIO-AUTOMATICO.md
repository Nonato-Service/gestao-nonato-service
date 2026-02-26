# 🚀 INSTRUÇÕES PARA CONFIGURAR INÍCIO AUTOMÁTICO

## ✅ OBJETIVO
Configurar o servidor para iniciar **AUTOMATICAMENTE** sempre que você ligar o computador ou fizer login, **SEM PRECISAR INICIAR MANUALMENTE**.

## 📋 PASSO A PASSO

### Método 1: Configuração Automática (RECOMENDADO)

1. **Navegue até a pasta do projeto:**
   ```
   C:\Users\W10\gestao-tecnica-nonato-service
   ```

2. **Duplo clique em:**
   ```
   CONFIGURAR-INICIO-AUTOMATICO-DEFINITIVO.bat
   ```

3. **Se pedir permissão de administrador:**
   - Clique com botão direito no arquivo
   - Selecione "Executar como administrador"
   - Clique em "Sim" quando o Windows pedir permissão

4. **Aguarde a mensagem de sucesso!**

5. **Teste:**
   - Faça logout e login novamente
   - OU reinicie o computador
   - O servidor deve iniciar automaticamente!

### Método 2: Configuração Manual (Se o método 1 não funcionar)

#### Opção A: Via Pasta de Inicialização

1. **Pressione `Win + R`**

2. **Digite:**
   ```
   shell:startup
   ```
   Pressione Enter

3. **Crie um atalho:**
   - Clique com botão direito na pasta
   - Novo → Atalho
   - Localização: `C:\Users\W10\gestao-tecnica-nonato-service\start-server-auto.bat`
   - Nome: `Iniciar Servidor Next.js`
   - Clique em "Concluir"

4. **Pronto!** O servidor iniciará automaticamente ao fazer login.

#### Opção B: Via Task Scheduler (Mais Confiável)

1. **Pressione `Win + R`**

2. **Digite:**
   ```
   taskschd.msc
   ```
   Pressione Enter

3. **No lado direito, clique em "Criar Tarefa Básica"**

4. **Configure:**
   - **Nome:** `Iniciar Servidor Next.js`
   - **Descrição:** `Inicia automaticamente o servidor Next.js da Gestão Técnica`
   - Clique em "Próximo"

5. **Gatilho:**
   - Selecione "Quando eu fizer logon"
   - Clique em "Próximo"

6. **Ação:**
   - Selecione "Iniciar um programa"
   - Clique em "Próximo"
   - **Programa/script:** `C:\Users\W10\gestao-tecnica-nonato-service\start-server-auto.bat`
   - **Iniciar em:** `C:\Users\W10\gestao-tecnica-nonato-service`
   - Clique em "Próximo"

7. **Concluir:**
   - Marque "Abrir a caixa de diálogo Propriedades para esta tarefa quando eu clicar em Concluir"
   - Clique em "Concluir"

8. **Nas Propriedades:**
   - Aba "Geral": Marque "Executar com os mais altos privilégios"
   - Aba "Condições": Desmarque "Iniciar a tarefa somente se o computador estiver conectado à energia CA"
   - Aba "Configurações": Marque "Permitir que a tarefa seja executada sob demanda" e "Se a tarefa em execução não for concluída quando solicitada, force a parada da tarefa"
   - Clique em "OK"

9. **Adicione mais um gatilho:**
   - Clique com botão direito na tarefa criada
   - Selecione "Propriedades"
   - Aba "Gatilhos"
   - Clique em "Novo"
   - Selecione "Na inicialização do sistema"
   - Clique em "OK"
   - Clique em "OK" novamente

10. **Pronto!** O servidor iniciará automaticamente ao ligar o computador E ao fazer login.

## ✅ VERIFICAR SE ESTÁ FUNCIONANDO

### Verificar se a tarefa foi criada:

1. Abra o **Task Scheduler** (`taskschd.msc`)
2. Procure por: `NextJS-NonatoService-AutoStart` ou `Iniciar Servidor Next.js`
3. Verifique se está **Habilitada**

### Verificar se o servidor está rodando:

1. Abra o navegador
2. Acesse: http://localhost:3000
3. Se carregar, está funcionando! ✅

### Verificar via linha de comando:

```cmd
netstat -ano | findstr ":3000" | findstr "LISTENING"
```

Se retornar algo, o servidor está rodando! ✅

## 🔧 SOLUÇÃO DE PROBLEMAS

### O servidor não inicia automaticamente

1. **Verifique se a tarefa está habilitada:**
   - Abra Task Scheduler
   - Encontre a tarefa
   - Clique com botão direito → "Executar"
   - Verifique se há erros no histórico

2. **Verifique permissões:**
   - Execute o script como Administrador
   - Adicione a pasta às exceções do antivírus

3. **Verifique se o Node.js está instalado:**
   ```cmd
   node --version
   ```

4. **Teste manualmente:**
   ```cmd
   cd C:\Users\W10\gestao-tecnica-nonato-service
   start-server-auto.bat
   ```

### O servidor inicia mas para depois

- Configure o monitor automático executando: `CONFIGURAR-INICIO-AUTOMATICO-DEFINITIVO.bat`
- Isso criará uma tarefa adicional que monitora e reinicia o servidor se parar

## 🎯 RESULTADO ESPERADO

Após configurar, você **NÃO PRECISARÁ MAIS** iniciar o servidor manualmente:

- ✅ Servidor inicia automaticamente ao ligar o computador
- ✅ Servidor inicia automaticamente ao fazer login
- ✅ Servidor reinicia automaticamente se parar
- ✅ Servidor verifica a cada 5 minutos se está rodando

## 📝 NOTAS IMPORTANTES

- O servidor roda na porta **3000**
- Acesse em: **http://localhost:3000**
- Não feche a janela do servidor (ela fica minimizada)
- Para parar o servidor, use: `stop-server.bat`

---

**Última atualização:** Janeiro 2026

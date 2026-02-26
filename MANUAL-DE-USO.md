# 📘 MANUAL DE USO - GESTÃO TÉCNICA NONATO SERVICE

## 📋 Índice
1. [Introdução](#introdução)
2. [Scripts Disponíveis](#scripts-disponíveis)
3. [Como Usar Cada Script](#como-usar-cada-script)
4. [Guia Passo a Passo](#guia-passo-a-passo)
5. [Solução de Problemas](#solução-de-problemas)
6. [Perguntas Frequentes](#perguntas-frequentes)

---

## 🎯 Introdução

Este manual explica como usar os scripts criados para gerenciar o servidor Next.js e restaurar código de backups, **sem precisar usar Git ou qualquer sistema de controle de versão**.

### 📁 Localização dos Scripts
Todos os scripts estão localizados em:
```
C:\Users\W10\gestao-tecnica-nonato-service\
```

### ⚙️ Pré-requisitos
- Windows 10 ou superior
- Node.js instalado
- Projeto Next.js configurado

---

## 🛠️ Scripts Disponíveis

### 1. **start-server.bat**
Inicia o servidor Next.js em modo de desenvolvimento.

### 2. **stop-server.bat**
Para o servidor Next.js que está rodando.

### 3. **restart-server.bat**
Reinicia o servidor Next.js (para e inicia novamente).

### 4. **restore-code.bat**
Restaura o código a partir de um backup anterior.

### 5. **list-backups.bat**
Lista todos os backups disponíveis na pasta `backups/`.

### 6. **create-shortcuts.bat**
Cria atalhos na área de trabalho para facilitar o acesso aos scripts.

---

## 📖 Como Usar Cada Script

### 🚀 1. INICIAR O SERVIDOR

#### Método 1: Clique Duplo
1. Navegue até a pasta do projeto
2. Clique duplo em `start-server.bat`
3. Aguarde o servidor iniciar
4. Você verá uma mensagem como: `✓ Ready on http://localhost:3000`
5. Abra o navegador e acesse: `http://localhost:3000`

#### Método 2: Linha de Comando
```cmd
cd C:\Users\W10\gestao-tecnica-nonato-service
start-server.bat
```

#### O que acontece:
- O script abre uma janela do terminal
- Executa `npm run dev`
- O servidor fica rodando até você fechar a janela ou usar `stop-server.bat`

#### ⚠️ Importante:
- **NÃO feche a janela do terminal** enquanto o servidor estiver rodando
- Se fechar, o servidor será encerrado
- Para parar o servidor, use `stop-server.bat` ou feche a janela

---

### 🛑 2. PARAR O SERVIDOR

#### Método 1: Clique Duplo
1. Clique duplo em `stop-server.bat`
2. O script encontrará e encerrará todos os processos Node.js relacionados
3. Uma mensagem confirmará que o servidor foi parado

#### Método 2: Linha de Comando
```cmd
cd C:\Users\W10\gestao-tecnica-nonato-service
stop-server.bat
```

#### O que acontece:
- O script procura processos Node.js na porta 3000
- Encerra todos os processos relacionados ao Next.js
- Libera a porta 3000 para uso futuro

#### ⚠️ Importante:
- Se o servidor não estiver rodando, o script informará que não há nada para parar
- Isso é normal e não causa problemas

---

### 🔄 3. REINICIAR O SERVIDOR

#### Método 1: Clique Duplo
1. Clique duplo em `restart-server.bat`
2. O script primeiro para o servidor
3. Aguarda 2 segundos
4. Inicia o servidor novamente

#### Método 2: Linha de Comando
```cmd
cd C:\Users\W10\gestao-tecnica-nonato-service
restart-server.bat
```

#### Quando usar:
- Após fazer alterações no código que requerem reinicialização
- Quando o servidor apresentar erros
- Para aplicar mudanças de configuração

#### O que acontece:
1. Executa `stop-server.bat` automaticamente
2. Aguarda 2 segundos
3. Executa `start-server.bat` automaticamente

---

### 🔙 4. RESTAURAR CÓDIGO DE BACKUP

Este é o script mais importante para restaurar código sem usar Git!

#### Como usar:
1. **Clique duplo em `restore-code.bat`**
2. Uma janela do PowerShell será aberta
3. Você verá uma lista de backups disponíveis, por exemplo:
   ```
   Backups disponíveis:

   [1] code-backup-20260110-143022
       Data: 2026-01-10 14:30:22

   [2] code-backup-20260109-120000
       Data: 2026-01-09 12:00:00
   ```
4. **Digite o número** do backup que deseja restaurar (ex: `1`)
5. **Confirme** digitando `S` quando solicitado
6. O script irá:
   - Parar o servidor automaticamente
   - Criar um backup do estado atual (para segurança)
   - Restaurar os arquivos do backup selecionado
   - Perguntar se deseja instalar dependências

#### Exemplo de uso completo:
```
========================================
   RESTAURAR CÓDIGO DE BACKUP
========================================

Backups disponíveis:

[1] code-backup-20260110-143022
    Data: 2026-01-10 14:30:22

[2] code-backup-20260109-120000
    Data: 2026-01-09 12:00:00

Digite o número do backup que deseja restaurar (ou 0 para cancelar): 1

ATENÇÃO: Esta operação irá substituir os arquivos atuais!
Backup selecionado: code-backup-20260110-143022

Deseja continuar? (S/N): S

Restaurando código...
Parando servidor (se estiver rodando)...
Criando backup do estado atual em: backup-before-restore-20260110-180000
Restaurando pasta 'app'...
Restaurando pasta 'public'...
Restaurando package.json...

========================================
   CÓDIGO RESTAURADO COM SUCESSO!
========================================

Backup do estado anterior salvo em: backup-before-restore-20260110-180000

Deseja instalar dependências? (S/N): S
Instalando dependências...
```

#### ⚠️ IMPORTANTE - Segurança:
- **O script SEMPRE cria um backup do estado atual** antes de restaurar
- Se algo der errado, você pode restaurar o estado anterior
- O backup de segurança é salvo em: `backups/backup-before-restore-YYYYMMDD-HHMMSS/`

#### O que é restaurado:
- ✅ Pasta `app/` (todo o código da aplicação)
- ✅ Pasta `public/` (arquivos públicos)
- ✅ `package.json` (dependências)
- ✅ `next.config.js` (configurações do Next.js)
- ✅ `tsconfig.json` (configurações do TypeScript)

#### O que NÃO é restaurado:
- ❌ Pasta `node_modules/` (será recriada com `npm install`)
- ❌ Pasta `.next/` (será recriada automaticamente)
- ❌ Arquivos de dados em `data/` (não são código)

---

### 📋 5. LISTAR BACKUPS

#### Como usar:
1. Clique duplo em `list-backups.bat`
2. Uma lista de todos os backups será exibida
3. Você verá o nome e a data de cada backup

#### Exemplo de saída:
```
========================================
   LISTAR BACKUPS DISPONIVEIS
========================================

Backups disponiveis:

[code-backup-20260110-143022]
    Data: 2026-01-10 14:30:22

[code-backup-20260109-120000]
    Data: 2026-01-09 12:00:00

[code-backup-20260108-090000]
    Data: 2026-01-08 09:00:00
```

#### Quando usar:
- Antes de restaurar código, para ver quais backups estão disponíveis
- Para verificar quando foi feito o último backup
- Para gerenciar backups antigos

---

### 🔗 6. CRIAR ATALHOS NA ÁREA DE TRABALHO

#### Como usar:
1. Clique duplo em `create-shortcuts.bat`
2. O script criará 5 atalhos na sua área de trabalho:
   - **Iniciar Servidor.lnk**
   - **Parar Servidor.lnk**
   - **Reiniciar Servidor.lnk**
   - **Restaurar Codigo.lnk**
   - **Listar Backups.lnk**

#### Vantagens:
- ✅ Acesso rápido sem precisar navegar até a pasta
- ✅ Organização melhor dos atalhos
- ✅ Pode arrastar para onde quiser

#### ⚠️ Importante:
- Execute este script **apenas uma vez**
- Se executar novamente, os atalhos serão atualizados
- Os atalhos funcionam mesmo se você mover a pasta do projeto

---

## 📝 Guia Passo a Passo

### 🎬 Cenário 1: Iniciar o Projeto pela Primeira Vez

1. **Abra a pasta do projeto:**
   ```
   C:\Users\W10\gestao-tecnica-nonato-service
   ```

2. **Crie os atalhos (opcional, mas recomendado):**
   - Clique duplo em `create-shortcuts.bat`
   - Aguarde a confirmação

3. **Inicie o servidor:**
   - Clique duplo em `start-server.bat`
   - OU use o atalho "Iniciar Servidor" na área de trabalho

4. **Aguarde o servidor iniciar:**
   - Você verá: `✓ Ready on http://localhost:3000`

5. **Abra o navegador:**
   - Acesse: `http://localhost:3000`

---

### 🔄 Cenário 2: Reiniciar o Servidor Após Mudanças

1. **Pare o servidor:**
   - Clique duplo em `stop-server.bat`
   - OU use o atalho "Parar Servidor"

2. **Inicie novamente:**
   - Clique duplo em `start-server.bat`
   - OU use o atalho "Iniciar Servidor"

**OU** simplesmente:
- Clique duplo em `restart-server.bat`
- OU use o atalho "Reiniciar Servidor"

---

### 🔙 Cenário 3: Restaurar Código de um Backup

1. **Liste os backups disponíveis:**
   - Clique duplo em `list-backups.bat`
   - Anote o nome do backup que deseja restaurar

2. **Pare o servidor (se estiver rodando):**
   - Clique duplo em `stop-server.bat`

3. **Restaurar o código:**
   - Clique duplo em `restore-code.bat`
   - OU use o atalho "Restaurar Codigo"

4. **Siga as instruções na tela:**
   - Digite o número do backup
   - Confirme digitando `S`
   - Escolha se deseja instalar dependências

5. **Inicie o servidor novamente:**
   - Clique duplo em `start-server.bat`

---

### 🆘 Cenário 4: Algo Deu Errado - Restaurar Estado Anterior

Se você restaurou um backup e algo não está funcionando:

1. **Liste os backups:**
   - Clique duplo em `list-backups.bat`

2. **Procure pelo backup de segurança:**
   - Procure por: `backup-before-restore-YYYYMMDD-HHMMSS`
   - Este é o backup criado automaticamente antes da restauração

3. **Restaurar o backup de segurança:**
   - Clique duplo em `restore-code.bat`
   - Digite o número do backup de segurança
   - Confirme a operação

---

## 🔧 Solução de Problemas

### ❌ Problema: "Porta 3000 já está em uso"

**Solução:**
1. Execute `stop-server.bat`
2. Aguarde alguns segundos
3. Execute `start-server.bat` novamente

**Se ainda não funcionar:**
1. Abra o Gerenciador de Tarefas (Ctrl + Shift + Esc)
2. Procure por processos "node.exe"
3. Finalize todos os processos Node.js
4. Execute `start-server.bat` novamente

---

### ❌ Problema: "Servidor não para"

**Solução:**
1. Execute `stop-server.bat` novamente
2. Se não funcionar, feche manualmente a janela do terminal onde o servidor está rodando
3. Ou use o Gerenciador de Tarefas para finalizar processos Node.js

---

### ❌ Problema: "Nenhum backup encontrado"

**Causa:** A pasta `backups/` está vazia ou não existe.

**Solução:**
1. Verifique se a pasta `backups/` existe na pasta do projeto
2. O sistema cria backups automáticos quando você inicia o servidor
3. Você também pode criar backups manualmente através do sistema (botão "Fazer Backup do Código" no modal de Extras)

---

### ❌ Problema: "Erro ao restaurar código"

**Possíveis causas e soluções:**

1. **Servidor ainda está rodando:**
   - Execute `stop-server.bat` primeiro
   - Aguarde alguns segundos
   - Tente restaurar novamente

2. **Arquivos estão sendo usados:**
   - Feche todas as janelas do VS Code ou editores
   - Feche o navegador
   - Tente restaurar novamente

3. **Permissões insuficientes:**
   - Execute o script como Administrador
   - Clique com botão direito em `restore-code.bat`
   - Selecione "Executar como administrador"

---

### ❌ Problema: "Script não executa / Abre e fecha rapidamente"

**Causa:** Erro no script ou permissões.

**Solução:**
1. Abra o Prompt de Comando ou PowerShell
2. Navegue até a pasta do projeto:
   ```cmd
   cd C:\Users\W10\gestao-tecnica-nonato-service
   ```
3. Execute o script manualmente:
   ```cmd
   start-server.bat
   ```
4. Isso mostrará qualquer erro que esteja ocorrendo

---

### ❌ Problema: "Erro ao criar atalhos"

**Solução:**
1. Execute o script como Administrador
2. Verifique se você tem permissão para criar arquivos na área de trabalho
3. Os atalhos podem ser criados manualmente se necessário

---

## ❓ Perguntas Frequentes

### Q: Preciso usar Git para restaurar código?
**R:** Não! O script `restore-code.bat` restaura código diretamente dos backups, sem precisar de Git ou qualquer sistema de controle de versão.

---

### Q: Com que frequência devo fazer backups?
**R:** O sistema cria backups automáticos diariamente ao iniciar. Você também pode criar backups manuais através do botão "Fazer Backup do Código" no sistema.

---

### Q: Os backups ocupam muito espaço?
**R:** Depende do tamanho do projeto. Cada backup contém apenas os arquivos de código (não inclui `node_modules`). Você pode excluir backups antigos manualmente se necessário.

---

### Q: Posso restaurar apenas um arquivo específico?
**R:** Atualmente, o script restaura tudo. Para restaurar apenas um arquivo, você pode:
1. Restaurar o backup completo
2. Copiar manualmente o arquivo desejado
3. Restaurar o backup anterior novamente

---

### Q: O que acontece com meus dados ao restaurar?
**R:** Apenas o **código** é restaurado. Os **dados** (clientes, fornecedores, etc.) ficam na pasta `data/` e **NÃO são afetados** pela restauração.

---

### Q: Posso usar esses scripts em outros projetos?
**R:** Sim! Os scripts são genéricos e podem ser adaptados para outros projetos Next.js. Apenas ajuste os caminhos se necessário.

---

### Q: Os scripts funcionam no Linux ou Mac?
**R:** Os scripts `.bat` são específicos do Windows. Para Linux/Mac, seria necessário criar versões `.sh` (shell script).

---

### Q: Como desfazer uma restauração?
**R:** O script sempre cria um backup antes de restaurar. Procure por `backup-before-restore-YYYYMMDD-HHMMSS` na lista de backups e restaure esse backup.

---

### Q: Posso automatizar os backups?
**R:** Sim! Você pode usar o Agendador de Tarefas do Windows para executar o script de backup automaticamente em horários específicos.

---

## 📞 Suporte

Se você encontrar problemas não listados aqui:

1. Verifique se todos os pré-requisitos estão instalados
2. Execute os scripts manualmente no terminal para ver mensagens de erro
3. Verifique os logs do sistema
4. Consulte a documentação do Next.js se o problema for relacionado ao servidor

---

## 📚 Recursos Adicionais

- **README-SCRIPTS.md** - Documentação técnica dos scripts
- **CONTEXTO.md** - Informações sobre o projeto
- **TODO.md** - Lista de tarefas pendentes

---

## ✅ Checklist de Uso Diário

### Ao iniciar o trabalho:
- [ ] Execute `start-server.bat` para iniciar o servidor
- [ ] Verifique se o servidor está rodando em `http://localhost:3000`

### Durante o trabalho:
- [ ] Use `restart-server.bat` se fizer mudanças que requerem reinicialização
- [ ] Crie backups manuais antes de grandes mudanças

### Ao terminar o trabalho:
- [ ] Execute `stop-server.bat` para parar o servidor
- [ ] (Opcional) Crie um backup manual do código

### Se algo der errado:
- [ ] Execute `list-backups.bat` para ver backups disponíveis
- [ ] Execute `restore-code.bat` para restaurar um backup anterior
- [ ] Verifique a seção "Solução de Problemas" deste manual

---

**Última atualização:** Janeiro 2026  
**Versão:** 1.0

---

## 🎉 Parabéns!

Agora você tem controle total sobre seu servidor e código, sem precisar de Git ou sistemas de controle de versão complexos!

**Bom trabalho!** 🚀

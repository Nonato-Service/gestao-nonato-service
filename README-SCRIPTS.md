# Scripts de Gerenciamento do Servidor

Este documento descreve os scripts disponíveis para gerenciar o servidor e restaurar código.

## 📋 Scripts Disponíveis

### 1. **start-server.bat**
Inicia o servidor Next.js em modo de desenvolvimento.
- **Uso:** Clique duplo ou execute no terminal
- **Porta:** http://localhost:3000

### 2. **stop-server.bat**
Para o servidor Next.js que está rodando.
- **Uso:** Clique duplo ou execute no terminal
- **Ação:** Encerra todos os processos Node.js relacionados ao projeto

### 3. **restart-server.bat**
Reinicia o servidor Next.js.
- **Uso:** Clique duplo ou execute no terminal
- **Ação:** Para o servidor atual e inicia novamente

### 4. **restore-code.bat**
Restaura o código a partir de um backup.
- **Uso:** Clique duplo ou execute no terminal
- **Funcionalidades:**
  - Lista todos os backups disponíveis
  - Permite selecionar qual backup restaurar
  - Cria backup automático do estado atual antes de restaurar
  - Restaura arquivos da pasta `app/`, `public/` e arquivos de configuração
  - Opção de instalar dependências após restaurar

### 5. **list-backups.bat**
Lista todos os backups disponíveis na pasta `backups/`.
- **Uso:** Clique duplo ou execute no terminal
- **Mostra:** Nome do backup e data de criação

## 🚀 Como Usar

### Iniciar o Servidor
1. Clique duplo em `start-server.bat`
2. Aguarde o servidor iniciar
3. Acesse http://localhost:3000 no navegador

### Parar o Servidor
1. Clique duplo em `stop-server.bat`
2. O servidor será encerrado automaticamente

### Reiniciar o Servidor
1. Clique duplo em `restart-server.bat`
2. O servidor será parado e reiniciado automaticamente

### Restaurar Código de um Backup
1. Clique duplo em `restore-code.bat`
2. Selecione o número do backup que deseja restaurar
3. Confirme a operação
4. O script irá:
   - Criar um backup do estado atual
   - Restaurar os arquivos do backup selecionado
   - Perguntar se deseja instalar dependências

## ⚠️ Importante

- **Backup Automático:** Antes de restaurar, o script cria automaticamente um backup do estado atual
- **Dependências:** Após restaurar, pode ser necessário executar `npm install` se houver mudanças no `package.json`
- **Servidor:** O servidor será parado automaticamente antes de restaurar o código

## 📁 Estrutura de Backups

Os backups são salvos na pasta `backups/` com o formato:
```
backups/
  └── code-backup-YYYYMMDD-HHMMSS/
      ├── app/
      ├── public/
      ├── package.json
      ├── next.config.js
      └── INFO-BACKUP.txt
```

## 🔧 Solução de Problemas

### Servidor não para
- Execute `stop-server.bat` novamente
- Ou feche manualmente o terminal onde o servidor está rodando

### Erro ao restaurar
- Verifique se o backup existe na pasta `backups/`
- Certifique-se de que o servidor está parado antes de restaurar

### Porta 3000 em uso
- Execute `stop-server.bat` para liberar a porta
- Ou altere a porta no arquivo `package.json` (script `dev`)

## 💡 Dicas

- Use `list-backups.bat` para ver todos os backups antes de restaurar
- Mantenha backups regulares para facilitar a restauração
- O sistema cria backups automáticos diariamente ao iniciar

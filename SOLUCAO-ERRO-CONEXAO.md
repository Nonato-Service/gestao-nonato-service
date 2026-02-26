# 🔧 Solução para Erro de Conexão (NS_ERROR_CONNECTION_REFUSED)

## ❌ Problema
O servidor não está rodando, resultando no erro: `NS_ERROR_CONNECTION_REFUSED` ao acessar `http://localhost:3000/`

## ✅ Soluções

### Solução 1: Iniciar o Servidor Manualmente (Recomendado)

1. **Abra o Prompt de Comando ou PowerShell como Administrador**

2. **Navegue até a pasta do projeto:**
   ```cmd
   cd C:\Users\W10\gestao-tecnica-nonato-service
   ```

3. **Execute o servidor:**
   ```cmd
   npm run dev
   ```

4. **Aguarde a mensagem:**
   ```
   ▲ Next.js 14.x.x
   - Local:        http://localhost:3000
   - Ready in X ms
   ```

5. **Acesse no navegador:** http://localhost:3000

### Solução 2: Usar o Script de Início

1. **Duplo clique em:** `INICIAR-SERVIDOR-AGORA.bat`
2. **Aguarde o servidor iniciar**
3. **Acesse:** http://localhost:3000

### Solução 3: Se Houver Erro de Permissão (EPERM)

O erro `Error: spawn EPERM` geralmente é causado por:

1. **Antivírus bloqueando:**
   - Adicione a pasta do projeto às exceções do antivírus
   - Pasta: `C:\Users\W10\gestao-tecnica-nonato-service`

2. **Permissões insuficientes:**
   - Execute o PowerShell/CMD como Administrador
   - Clique com botão direito → "Executar como administrador"

3. **Processo Node travado:**
   ```powershell
   # Parar todos os processos Node
   Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

4. **Limpar cache do Next.js:**
   ```cmd
   cd C:\Users\W10\gestao-tecnica-nonato-service
   rmdir /s /q .next
   npm run dev
   ```

### Solução 4: Verificar se a Porta 3000 Está Livre

```cmd
netstat -ano | findstr ":3000"
```

Se houver algo usando a porta 3000:
```cmd
# Encontrar o PID
netstat -ano | findstr ":3000"

# Parar o processo (substitua XXXX pelo PID)
taskkill /PID XXXX /F
```

### Solução 5: Reinstalar Dependências

```cmd
cd C:\Users\W10\gestao-tecnica-nonato-service
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

## 🚀 Configurar Início Automático

Após resolver o problema, configure o início automático:

1. **Execute como Administrador:** `CONFIGURAR-AGORA.bat`
2. **O servidor iniciará automaticamente sempre que você ligar o computador**

## 📝 Verificar se o Servidor Está Rodando

```cmd
netstat -ano | findstr ":3000" | findstr "LISTENING"
```

Se retornar algo, o servidor está rodando!

## 🆘 Ainda com Problemas?

1. Verifique se o Node.js está instalado:
   ```cmd
   node --version
   npm --version
   ```

2. Verifique se as dependências estão instaladas:
   ```cmd
   cd C:\Users\W10\gestao-tecnica-nonato-service
   dir node_modules
   ```

3. Tente usar uma porta diferente:
   ```cmd
   npm run dev -- -p 3001
   ```
   Acesse: http://localhost:3001

---

**Última atualização:** Janeiro 2026

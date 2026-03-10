# CONTEXTO DO PROJETO - GESTÃO TÉCNICA NONATO SERVICE

## 📋 INFORMAÇÕES GERAIS

**Projeto:** Sistema de Gestão Técnica Nonato Service  
**Tipo:** Aplicação Next.js 14 com TypeScript  
**Data de Criação:** Janeiro 2026  
**Status:** Em desenvolvimento ativo  
**Localização:** `C:\Users\W10\gestao-tecnica-nonato-service`

## 🎯 OBJETIVO DO PROJETO

Sistema completo de gestão técnica para serviços, incluindo:
- Cadastro de clientes, fornecedores, gestores e técnicos
- Gestão de equipamentos e inventário
- Relatórios de serviço com cálculos automáticos
- Agenda e agendamentos
- Biblioteca de peças
- Gestão de faturas e orçamentos
- Sistema de checklist e manutenção
- Comunicação interna entre gestores e técnicos
- Almoxarifado e armazém
- Ordem de preparação e separação de peças
- Gestão financeira
- Sistema de backup automático

## 🏗️ ESTRUTURA DO PROJETO

```
gestao-tecnica-nonato-service/
├── app/
│   ├── page.tsx              # Componente principal (~38.000 linhas)
│   ├── layout.tsx            # Layout principal
│   ├── globals.css           # Estilos globais
│   ├── translations.ts       # Traduções (6 idiomas)
│   ├── icon.svg              # Ícone da aplicação
│   ├── utils/
│   │   └── dataStorage.ts    # Utilitários de armazenamento
│   └── api/
│       ├── data/             # APIs de dados
│       │   ├── load/route.ts
│       │   ├── load-text/route.ts
│       │   ├── save/route.ts
│       │   ├── save-all/route.ts
│       │   └── save-text/route.ts
│       ├── pdf/              # APIs de geração de PDFs
│       │   ├── confirmacao-orcamento/[id]/route.ts
│       │   ├── confirmacao-pedido-os/[id]/route.ts
│       │   ├── pedido-separacao-envio/[id]/route.ts
│       │   ├── despesas-documento/[id]/route.ts
│       │   └── manual-gestor/route.ts
│       ├── backup-code/
│       │   ├── route.ts      # Backup do código
│       │   ├── list/route.ts
│       │   └── restore/route.ts
│       ├── demo/
│       │   ├── activate/route.ts
│       │   └── status/route.ts
│       ├── health/route.ts
│       ├── video/logo/route.ts
│       └── import-from-url/route.ts
├── data/                     # Dados salvos (JSON) – 40+ ficheiros
│   ├── nonato-clientes.json, nonato-fornecedores.json, nonato-equipamentos.json
│   ├── nonato-gestores.json, nonato-tecnicos.json, nonato-users.json
│   ├── nonato-sidebar-buttons.json, nonato-language.json, nonato-logo.json
│   ├── nonato-relatorios-servico.json, nonato-relatorio-contador.json
│   ├── nonato-pedidos-orcamento.json, nonato-pecas-biblioteca.json, nonato-orcamentos-avulso.json
│   ├── nonato-agendamentos.json, nonato-servicos.json, nonato-mensagens-comunicacao.json
│   ├── nonato-grupos-checklist.json, nonato-familias-checklist.json, nonato-pre-checks.json
│   ├── nonato-pedidos-separacao.json, nonato-ordens-preparacao.json
│   ├── nonato-biblioteca-manuais.json, nonato-manuais-familias-grupos.json
│   ├── nonato-categorias-pecas.json, nonato-subcategorias-pecas.json, nonato-pecas-biblioteca.json
│   ├── nonato-pecas-solicitadas-armazem.json, nonato-relatorios-financeiros.json
│   ├── nonato-relatorios-servico.json, nonato-chats-individuais.json
│   ├── nonato-conhecimento-tecnicos.json, nonato-conhecimentos-tecnicos.json
│   ├── nonato-servicos-por-grupo.json, nonato-translator-library.json
│   ├── nonato-formularios-checklist-tecnicos.json, nonato-opcoes-tipo-checklist.json
│   ├── nonato-parentes-checklist.json, nonato-managed-passwords.json
│   ├── nonato-clientes-devedores.json, nonato-cliente-prioritario.json
│   └── nonato-logo-type.json, nonato-familias-grupos-equipamento.json
├── backups/                  # ⭐ Backups automáticos do código (100+)
├── public/                   # Arquivos públicos
├── .cursor/rules/            # Regras Cursor (sempre aplicadas)
│   ├── atualizacoes-rapidas.mdc   # Edições cirúrgicas, deploy com ATUALIZAR-DEPLOY.bat
│   └── idiomas-6.mdc             # 6 idiomas obrigatórios (PT-BR, ES, FR, IT, DE, EN)
├── MANUAL-DE-USO.md          # Manual completo de uso
├── CONTEXTO.md               # Este ficheiro – documentação do contexto
├── TODO.md                   # Lista de tarefas
├── ATUALIZACOES-RAPIDAS.md   # Fluxo de deploy rápido
├── next.config.js            # Configuração do Next.js
├── tsconfig.json             # Configuração do TypeScript
├── package.json              # Dependências do projeto
├── package-lock.json         # Lock file das dependências
└── [Scripts .bat]            # 20+ scripts de gerenciamento
```

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 1. Sistema de Backup Automático ⭐
- **API:** `/api/backup-code` (POST e GET)
- **Localização:** `backups/code-backup-[timestamp]`
- **Funcionalidades:**
  - Backup automático diário ao iniciar o sistema
  - Backup antes de operações críticas
  - Backup manual via botão "Fazer Backup do Código"
  - Histórico dos últimos 10 backups no localStorage
- **Arquivos incluídos:** app/, public/, configurações, package.json, etc.
- **Scripts de Gerenciamento:**
  - `start-server.bat` - Iniciar servidor
  - `stop-server.bat` - Parar servidor
  - `restart-server.bat` - Reiniciar servidor
  - `restore-code.ps1` / `restore-code.bat` - Restaurar código de backup
  - `list-backups.bat` - Listar backups disponíveis
  - `create-shortcuts.bat` - Criar atalhos na área de trabalho

### 2. Modais Principais (Completos)
- ✅ **Modal de Extras/Administrador** - Configurações, usuários, botões, backup, tradutor, organização de sidebar
- ✅ **Modal de Gestores** - Abas para Gestores e Técnicos (internos e externos)
- ✅ **Modal de Equipamentos** - Cadastro completo com fotos, PDFs, biblioteca, histórico
- ✅ **Modal de Clientes** - Cadastro completo com todos os campos, equipamentos e relatórios por equipamento
- ✅ **Modal de Fornecedores** - Cadastro completo com IBAN e faturas
- ✅ **Modal de Relatório de Serviço** - Completo com:
  - Numeração automática (formato: NUMERO-MES/ANO)
  - Associação com cliente e equipamento
  - Busca de peças da biblioteca
  - Geração de pedido de orçamento
  - Formulário completo de dias de trabalho
  - Cálculos automáticos (horas, KM, viagem)
  - Gestão de peças de substituição
  - Salvamento em banco de dados do cliente/equipamento
- ✅ **Modal de Biblioteca de Peças** - Cadastro completo de peças com imagens, códigos, descrições e preços
- ✅ **Modal de Agenda** - Calendário completo com agendamentos e pré-agendamentos
- ✅ **Modal de Desmontados** - Cadastro de grupos e peças desmontadas
- ✅ **Modal de Cadastro de Serviços** - Cadastro de serviços e despesas
- ✅ **Modal de Gestão de Custos** - Pedidos de orçamento, lista de peças, cadastro de serviços
- ✅ **Modal de Biblioteca de Relatórios** - Visualização e gerenciamento de relatórios
- ✅ **Modal de Gestão Financeira** - Gestão financeira completa
- ✅ **Modal de Clientes Financeiro** - Gestão financeira por cliente
- ✅ **Modal de Orçamentos Avulso** - Criação e gerenciamento de orçamentos avulsos
- ✅ **Modal de Almoxarifado/Armazém** - Gestão de estoque e armazém
- ✅ **Modal de Pré-Checklist** - Preparação de checklists
- ✅ **Modal de Checklist** - Execução de checklists de manutenção
- ✅ **Modal de Checklist Hub** - Central de checklists
- ✅ **Modal de Comunicação Interna** - Sistema de mensagens entre gestores
- ✅ **Modal de Mensagens Internas** - Mensagens para gestores
- ✅ **Modal de Mensagens Internas Técnicos** - Mensagens para técnicos
- ✅ **Modal de Técnicos Internos** - Gestão de técnicos internos
- ✅ **Modal de Técnicos Externos** - Gestão de técnicos externos
- ✅ **Modal de Alerta Mensagens** - Sistema de alertas e notificações
- ✅ **Modal de Gestão de Grupos Checklist** - Organização de grupos de checklist
- ✅ **Modal de Mapa Visual Separação de Peças** - Visualização de separação de peças
- ✅ **Modal de Ordem de Preparação** - Gestão de ordens de preparação
- ✅ **Modal de Formulários Checklist Técnicos** - Formulários específicos para técnicos

### 3. Sistema de Tradução
- **Idiomas suportados:** PT-BR, ES, FR, IT, DE, EN
- **Arquivo:** `app/translations.ts`
- **Sistema:** Tradução dinâmica com fallback

### 4. Armazenamento de Dados
- **LocalStorage:** Dados temporários e cache
- **API Routes:** Persistência em arquivos JSON na pasta `data/`
- **Arquivos salvos:**
  - `nonato-clientes.json` (inclui relatórios por equipamento)
  - `nonato-fornecedores.json`
  - `nonato-equipamentos.json`
  - `nonato-sidebar-buttons.json`
  - `nonato-language.json`
  - `nonato-logo.json` / `nonato-logo.mp4`
  - `nonato-relatorios-servico.json`
  - `nonato-relatorio-contador.json` (contador para numeração automática)
  - `nonato-pedidos-orcamento.json` (pedidos de orçamento gerados)
  - `nonato-pecas-biblioteca.json` (biblioteca de peças)
  - `nonato-orcamentos-avulso.json` (orçamentos avulsos para PDFs)
  - `nonato-gestores.json` (gestores cadastrados)
  - `nonato-tecnicos.json` (técnicos cadastrados)
  - `nonato-users.json` (usuários do sistema)
  - `nonato-agenda.json` (agendamentos)
  - `nonato-desmontados.json` (peças desmontadas)
  - `nonato-servicos.json` (serviços cadastrados)
  - `nonato-mensagens-comunicacao.json` (mensagens internas)
  - `nonato-checklist-templates.json` (templates de checklist)
  - `nonato-grupos-checklist.json` (grupos de checklist)
  - `nonato-manutencoes-checklist.json` (manutenções de checklist)

### 5. GESTÃO DE CUSTOS ⭐ NOVO
- **Localização:** Botão na sidebar (azul, acima de GESTÃO INDUSTRIAL)
- **Funcionalidades:**
  - **Pedidos de Orçamento:**
    - Lista todos os pedidos de orçamento gerados
    - Exibe: número do relatório, cliente, máquina, datas, status, peças
    - Ordenação por data (mais recente primeiro)
    - Status: Pendente, Enviado, Recebido, Aprovado, Rejeitado
    - Botão para excluir pedidos
  - **LISTA DE PEÇAS FERADA PARA ORÇAMENTO:**
    - Agrupa todas as peças de todos os pedidos
    - Mostra quantidade total por peça (soma de todos os pedidos)
    - Lista todos os pedidos que contêm cada peça
    - Ordenação por quantidade total (maior primeiro)
    - Botão Mostrar/Ocultar para expandir/recolher
  - **CADASTRO DE SERVIÇOS:**
    - Link para abrir o cadastro de serviços
    - Cadastro de serviços e despesas

### 6. Relatório de Serviço - Funcionalidades Completas ⭐ NOVO
- **Numeração Automática:**
  - Formato: `NUMERO-MES/ANO` (exemplo: 123-0126)
  - Contador configurável no Administrador
  - Incremento automático
- **Associação com Cliente e Equipamento:**
  - Relatórios salvos no banco de dados do cliente
  - Separação por equipamento
  - Ordenação por data
- **Busca de Peças da Biblioteca:**
  - Ao adicionar peça, abre busca na biblioteca
  - Digite o código para encontrar a peça
  - Exibe: imagem, código, descrição, preço
  - Apenas quantidade precisa ser digitada
- **Geração de Pedido de Orçamento:**
  - Botão "Gerar Pedido de Orçamento" na seção de peças
  - Cria pedido com todas as peças do relatório
  - Salva em `nonato-pedidos-orcamento`
  - Aparece na seção "Pedidos de Orçamento" em GESTÃO DE CUSTOS

### 7. Organização de Botões da Sidebar ⭐ NOVO
- **Localização:** Administrador → Organizador de Botões
- **Funcionalidades:**
  - Arrastar e soltar para reordenar botões
  - Mover botões entre grupos (GESTÃO TÉCNICA, GESTÃO DE CUSTOS, GESTÃO INDUSTRIAL, OUTROS)
  - Adicionar, editar e excluir botões
  - Salvar automaticamente
  - Suporte a tradução automática

### 8. Rotas de API (resumo atual)
- **Dados:** `api/data/load`, `load-text`, `save`, `save-all`, `save-text`
- **PDF:** `api/pdf/confirmacao-orcamento/[id]`, `confirmacao-pedido-os/[id]`, `pedido-separacao-envio/[id]`, `despesas-documento/[id]`, `manual-gestor`
- **Backup:** `api/backup-code` (POST/GET), `api/backup-code/list`, `api/backup-code/restore`
- **Outros:** `api/health`, `api/demo/activate`, `api/demo/status`, `api/video/logo`, `api/import-from-url`

### 9. Sistema de Geração de PDFs ⭐
- **8 Modelos de PDF para Relatórios de Serviço:**
  1. **Clássico** - Baseado na imagem original do sistema
  2. **Compacto** - Versão condensada
  3. **Detalhado** - Versão expandida com todas as informações
  4. **Moderno/Profissional** - Design moderno e limpo
  5. **Minimalista** - Design minimalista e elegante
  6. **Técnico/Industrial** - Focado em informações técnicas
  7. **Executivo** - Formato executivo para apresentações
  8. **Negro** - Tema dark mode
- **APIs de PDF para Orçamentos:**
  - `/api/pdf/confirmacao-orcamento/[id]` - Gera confirmação de orçamento
  - `/api/pdf/confirmacao-pedido-os/[id]` - Gera confirmação de pedido OS
  - `/api/pdf/pedido-separacao-envio/[id]` - Gera pedido de separação e envio
- **Funcionalidades:**
  - Suporte multi-idioma (PT-BR, ES, FR, IT, DE, EN)
  - Geração via URL com parâmetro `?lang=`
  - HTML formatado para impressão
  - Compatível com impressão direta do navegador
  - Design responsivo e profissional
- **Uso:**
  - Seleção de modelo no modal de Relatório de Serviço
  - Botão "Gerar PDF/Imprimir" em cada relatório
  - Geração de documentos PDF para orçamentos avulsos
  - Botão "GERAR DOCUMENTOS PDF" com suporte a 6 idiomas

### 10. Sistema de Checklist ⭐
- **Templates de Checklist:**
  - Criação e edição de templates personalizados
  - Itens configuráveis com descrição e tipo
  - Reutilização de templates em múltiplas manutenções
- **Grupos de Checklist:**
  - Organização de checklists em grupos
  - Tipos: básico e equipamentos-aprovados
  - Gestão de manutenções por grupo
- **Manutenções de Checklist:**
  - Associação com equipamentos
  - Técnico responsável
  - Data de execução
  - Status de conclusão
- **Formulários de Checklist para Técnicos:**
  - Formulários específicos para técnicos
  - Observações por técnico
  - Rastreamento de execução

### 11. Sistema de Comunicação Interna ⭐
- **Mensagens entre Gestores:**
  - Envio de mensagens entre gestores
  - Suporte a arquivos e imagens (base64)
  - Sistema de leitura/não lida
  - Filtros por status (todas, não lidas, lidas)
- **Mensagens para Técnicos:**
  - Comunicação entre gestores e técnicos
  - Tipos: técnico interno, técnico externo, armazém
  - Mensagens para grupos (todos gestores, todos técnicos, etc.)
- **Sistema de Alertas:**
  - Notificações de mensagens não lidas
  - Alertas importantes
  - Histórico de mensagens

### 12. Almoxarifado e Armazém ⭐
- **Gestão de Estoque:**
  - Controle de peças em estoque
  - Entrada e saída de materiais
  - Rastreamento de movimentações
- **Ordem de Preparação:**
  - Criação de ordens de preparação
  - Lista de peças necessárias
  - Status de preparação
- **Mapa Visual de Separação de Peças:**
  - Visualização gráfica da separação
  - Organização por localização
  - Rastreamento visual

### 13. Gestão Financeira ⭐
- **Gestão Financeira Geral:**
  - Controle financeiro completo
  - Relatórios financeiros
  - Análise de custos
- **Clientes Financeiro:**
  - Gestão financeira por cliente
  - Histórico de transações
  - Faturas e pagamentos
- **Orçamentos Avulsos:**
  - Criação de orçamentos independentes
  - Geração de PDFs de orçamento
  - Acompanhamento de status

## ✅ STATUS ATUAL - TODAS AS FUNCIONALIDADES PRINCIPAIS COMPLETAS! 🎉

### 1. Modais Principais - ✅ TODOS COMPLETOS
- ✅ **Modal de Biblioteca de Peças** - COMPLETO e funcional
- ✅ **Modal de Agenda** - COMPLETO - Calendário e agendamentos implementados
- ✅ **Modal de Desmontados** - COMPLETO - Cadastro de grupos e peças desmontadas
- ✅ **Modal de Cadastro de Serviços** - COMPLETO e funcional
- ✅ **Modal de Extras/Administrador** - COMPLETO
- ✅ **Modal de Gestores** - COMPLETO
- ✅ **Modal de Equipamentos** - COMPLETO
- ✅ **Modal de Clientes** - COMPLETO
- ✅ **Modal de Fornecedores** - COMPLETO
- ✅ **Modal de Relatório de Serviço** - COMPLETO com todas as funcionalidades

### 2. Modais Aninhados - ✅ TODOS COMPLETOS
- ✅ **Modal de Equipamentos do Cliente** - COMPLETO
- ✅ **Modal de Relatórios do Equipamento** - COMPLETO
- ✅ **Modal de Faturas do Fornecedor** - COMPLETO

### 3. Funcionalidades do Relatório de Serviço - ✅ TODAS COMPLETAS
- ✅ Numeração automática - Implementado
- ✅ Associação com cliente/equipamento - Implementado
- ✅ Busca de peças da biblioteca - Implementado
- ✅ Geração de pedido de orçamento - Implementado
- ✅ Formulário completo de dias de trabalho - COMPLETO
- ✅ Cálculos automáticos (horas, KM, viagem) - COMPLETO
- ✅ Gestão de peças de substituição - COMPLETO
- ✅ Validações e regras de negócio - COMPLETO

### 4. Sistema de Geração de PDFs - ✅ NOVO
- ✅ **8 Modelos de PDF para Relatórios:**
  - Clássico (baseado na imagem original)
  - Compacto
  - Detalhado
  - Moderno/Profissional
  - Minimalista
  - Técnico/Industrial
  - Executivo
  - Negro (dark mode)
- ✅ **APIs de PDF para Orçamentos:**
  - `/api/pdf/confirmacao-orcamento/[id]` - Confirmação de orçamento
  - `/api/pdf/confirmacao-pedido-os/[id]` - Confirmação de pedido OS
  - `/api/pdf/pedido-separacao-envio/[id]` - Pedido de separação e envio
- ✅ **Suporte multi-idioma nos PDFs:** PT-BR, ES, FR, IT, DE, EN
- ✅ **Geração de documentos PDF** para orçamentos avulsos

## 🔧 TECNOLOGIAS E DEPENDÊNCIAS

- **Framework:** Next.js 14.0.0
- **Linguagem:** TypeScript 5.0.0
- **React:** 18.2.0
- **Estilização:** CSS inline + globals.css
- **Armazenamento:** LocalStorage + File System (JSON)
- **Arquitetura:** App Router (Next.js 14)
- **Build:** TypeScript compilado para JavaScript

### Estrutura de Tipos TypeScript
O projeto utiliza TypeScript com tipos bem definidos:
- `User` - Usuários do sistema com permissões
- `SidebarButton` - Botões da sidebar com grupos e traduções
- `TipoGestor` - Tipos de gestores com cores e ícones
- `Gestor` - Gestores cadastrados
- `Tecnico` - Técnicos (internos e externos)
- `Cliente` - Clientes com equipamentos e relatórios
- `Fornecedor` - Fornecedores com IBAN e faturas
- `Equipamento` - Equipamentos com histórico
- `RelatorioServico` - Relatórios de serviço completos
- `DiaTrabalho` - Dias de trabalho com cálculos
- `PecaSubstituicao` - Peças de substituição
- `MensagemComunicacao` - Mensagens internas
- `ChecklistTemplate` - Templates de checklist
- `ManutencaoChecklist` - Manutenções de checklist
- `GrupoChecklist` - Grupos de checklist
- E muitos outros tipos específicos

## 📝 NOTAS IMPORTANTES

### Sistema de Backup
- **IMPORTANTE:** O sistema faz backup automático do código uma vez por dia
- Backups são salvos em: `backups/code-backup-[timestamp]`
- Cada backup inclui todos os arquivos de código fonte
- Histórico mantido no localStorage: `nonato-code-backups`

### Scripts de Gerenciamento Disponíveis
- **`ATUALIZAR-DEPLOY.bat`** - Enviar alterações para o GitHub e atualizar o deploy no Railway (rápido: add + commit + push). Ver **ATUALIZACOES-RAPIDAS.md**.
- `start-server.bat` - Iniciar servidor de desenvolvimento
- `stop-server.bat` - Parar servidor
- `restart-server.bat` - Reiniciar servidor
- `restore-code.bat` / `restore-code.ps1` - Restaurar código de backup
- `list-backups.bat` - Listar backups disponíveis
- `create-shortcuts.bat` - Criar atalhos na área de trabalho
- `configurar-inicio-automatico.bat` - Configurar início automático
- `remover-inicio-automatico.bat` - Remover início automático
- `monitor-server.bat` - Monitorar servidor
- Scripts adicionais para resolução de problemas (EPERM, permissões, etc.)

### Funções Importantes
- `handleBackupCodigo()` - Backup manual do código
- `createAutoCodeBackup()` - Backup automático
- `createAutoBackupBeforeOperation()` - Backup antes de operações críticas

### 🌐 Deploy (Hospedagem)
- **Repositório:** `gestao-tecnica-nonato-service` (GitHub)
- **Railway:** Guia passo a passo em **DEPLOY-RAILWAY.md**  
  - Volume: Mount Path **`/app/data`** | Variável **`DATA_DIR=/app/data`**  
  - Opcional: `NODE_OPTIONS=--max-old-space-size=384` se o build falhar por memória
- **Config:** `railway.json` (build: `npm run build`, start: `npm start`)  
- **Start:** `scripts/start-server.js` usa `PORT` e escuta em `0.0.0.0`
- **Mais opções:** COMO-HOSPEDAR.md (Railway, Render, VPS) | GUIA-SIMPLES-DEPLOY.md | PROXIMOS-PASSOS-DEPLOY.md

## 🚀 COMO USAR O SISTEMA

### Backup do Código
1. **Automático:** Ocorre automaticamente uma vez por dia
2. **Manual:** Botão "Fazer Backup do Código" no modal de Extras
3. **Antes de operações:** Backup automático antes de salvar/deletar

### Verificar Backups
- Pasta: `backups/` no diretório do projeto
- Cada backup tem: `INFO-BACKUP.txt` e `metadata.json`

### Restaurar Backup
1. Copiar arquivos do backup de volta para o projeto
2. Executar: `npm install`
3. Executar: `npm run dev`

## 📋 PRÓXIMOS PASSOS (Melhorias Futuras)

1. **Testes e Validações:**
   - Testar todas as funcionalidades em produção
   - Corrigir bugs encontrados durante uso
   - Melhorar UX onde necessário
   - Adicionar validações adicionais de formulários

2. **Melhorias e Otimizações:**
   - Filtros avançados de busca
   - Gráficos e estatísticas
   - Notificações e alertas
   - Melhorias de performance

3. **Funcionalidades Adicionais (Opcional):**
   - Exportar relatórios em PDF (já implementado para orçamentos)
   - Sistema de notificações
   - Dashboard com métricas
   - Relatórios gerenciais avançados

4. **Documentação:**
   - ✅ Manual de uso criado (MANUAL-DE-USO.md)
   - ✅ Contexto atualizado (CONTEXTO.md)
   - ✅ TODO atualizado (TODO.md)

## 🔑 COMANDOS ÚTEIS

```bash
# Limpar cache e reconstruir
Remove-Item -Recurse -Force .next
npm run build

# Iniciar servidor
npm run dev

# Verificar backups
Get-ChildItem backups\ -Directory | Sort-Object LastWriteTime -Descending
```

## 📞 INFORMAÇÕES PARA CONTINUIDADE

**Usuário:** Mesmo usuário do projeto Nonato Service  
**Projeto:** Gestão Técnica Nonato Service  
**Localização:** `C:\Users\W10\gestao-tecnica-nonato-service`  
**Última atualização:** 10 de março de 2026

**Contexto importante:**
- Sistema já tem backup automático implementado
- Muitas funcionalidades já estão funcionando
- Cadastro de Famílias e Grupos: painel Família ampliado e botão Editar corrigido para todos os idiomas
- Sistema de backup protege contra perda de código

## 🎨 ESTILO E DESIGN

- **Tema:** Dark mode (fundo preto, verde neon #00ff00)
- **Componentes:** Modais com overlay, sidebar fixa
- **Responsivo:** Grid layouts adaptativos
- **Cores principais:**
  - Background: #000, #1a1a1a, #2a2a2a
  - Accent: #00ff00 (verde neon)
  - Texto: #fff
  - Bordas: #00ff00 (verde neon)
  - Hover: Tons de verde mais claros
- **Layout:**
  - Sidebar fixa à esquerda
  - Área de conteúdo principal
  - Modais com overlay escuro
  - Botões com bordas verdes
  - Cards e containers com fundo cinza escuro

## 📊 ESTRUTURA DE DADOS

### Grupos de Botões da Sidebar
- **GESTÃO TÉCNICA** - Modais relacionados à gestão técnica
- **GESTÃO DE CUSTOS** - Modais relacionados a custos e orçamentos
- **GESTÃO INDUSTRIAL** - Modais relacionados à gestão industrial
- **GESTÃO FINANCEIRA** - Modais relacionados a finanças
- **CHECKLIST GROUP** - Modais relacionados a checklists
- **OUTROS** - Outros modais diversos

### Tipos de Técnicos
- **Técnico Interno** - Técnicos da empresa
- **Técnico Externo** - Técnicos externos
- **Armazém** - Funcionários do armazém

### Tipos de Gestores
- **Gestor** - Gestor geral
- **Gestor Industrial** - Gestor da área industrial
- **Assistência Técnica** - Gestor de assistência técnica
- **Armazém** - Gestor de armazém

## ⚡ DICAS RÁPIDAS

1. **Sempre fazer backup antes de grandes mudanças**
2. **Testar após cada implementação**
3. **Manter código organizado e comentado**
4. **Usar traduções para todos os textos**
5. **Verificar build após mudanças**
6. **Usar os scripts .bat para gerenciar o servidor**
7. **Verificar backups regularmente**
8. **Manter dados sincronizados entre localStorage e servidor**

## 🔍 FUNCIONALIDADES AVANÇADAS

### Sistema de Permissões
- Usuários com diferentes níveis de acesso
- Permissões por funcionalidade (gestores, equipamentos, clientes, etc.)
- Controle de acesso administrativo

### Sistema de Busca
- Busca em todos os modais principais
- Filtros avançados
- Ordenação por diferentes critérios

### Sistema de Notificações
- Alertas de mensagens não lidas
- Notificações importantes
- Sistema de leitura/não lida

### Histórico e Rastreamento
- Histórico de equipamentos
- Rastreamento de relatórios
- Log de alterações

---

**Última atualização:** 10 de março de 2026  
**Status:** ✅ SISTEMA 100% FUNCIONAL - TODAS AS FUNCIONALIDADES PRINCIPAIS COMPLETAS! 🎉

**Últimas implementações:**
- ✅ **Cadastro de Famílias e Grupos (sidebar):** Painel Família com mais espaço (520px / min 460px); botão Editar ajustado (minWidth 95px, whiteSpace nowrap) para não cortar texto em idiomas longos (ex.: "Bearbeiten" em alemão)
- ✅ TODOS os modais principais completos e funcionais (30+ modais)
- ✅ TODOS os modais aninhados implementados
- ✅ Relatório de Serviço completo com cálculos automáticos
- ✅ Sistema de geração de PDFs (8 modelos para relatórios)
- ✅ APIs de PDF para orçamentos (3 tipos de documentos)
- ✅ Suporte multi-idioma em todos os PDFs (6 idiomas)
- ✅ Formulário completo de dias de trabalho
- ✅ Gestão de peças de substituição
- ✅ Validações e regras de negócio
- ✅ Sistema de Checklist completo
- ✅ Sistema de Comunicação Interna
- ✅ Almoxarifado e Armazém
- ✅ Gestão Financeira
- ✅ Manual de uso completo (MANUAL-DE-USO.md)
- ✅ Sistema de backup automático ativo (100+ backups criados)
- ✅ Scripts de gerenciamento de servidor (20+ scripts)

**Status do Projeto:** 🎉 **SISTEMA 100% FUNCIONAL!** 🎉
- ✅ Todos os modais implementados e funcionando (30+ modais)
- ✅ Todos os modais aninhados implementados
- ✅ Relatório de Serviço completo com cálculos automáticos
- ✅ Sistema de PDFs completo
- ✅ Sistema de Checklist implementado
- ✅ Sistema de Comunicação Interna funcional
- ✅ Build compilando sem erros
- ✅ Sistema de backup automático ativo
- ✅ Documentação completa e atualizada

**Estatísticas do Projeto:**
- **Arquivo principal:** `app/page.tsx` - ~38.000 linhas
- **Backups criados:** 100+ backups automáticos
- **Idiomas suportados:** 6 (PT-BR, ES, FR, IT, DE, EN)
- **Modelos de PDF:** 8 modelos diferentes
- **Modais implementados:** 30+ modais completos
- **APIs implementadas:** 18 rotas de API (data, pdf, backup-code, demo, health, video, import-from-url)
- **Scripts de gerenciamento:** 20+ scripts .bat
- **Tipos TypeScript:** 50+ tipos definidos
- **Arquivos de dados:** 40+ arquivos JSON em `data/`

**Porta do Servidor:** 3000 (http://localhost:3000)

**Próxima sessão:** Testes finais, correções de bugs e melhorias de UX


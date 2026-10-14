# Resultado — modo local estável (noite)

## Como começar amanhã

1. Duplo clique em **`INICIAR-NONATO-LOCAL.bat`**
2. No PC: `http://localhost:3000`
3. No tablet (mesma Wi‑Fi): URL `http://IP:3000` mostrada na janela do `.bat`
4. Se a UI parecer antiga: **Ctrl+Shift+R** no browser (ou reabrir a PWA)

Dados em **`data-local\`**. Pasta original **`data\`** não é apagada.

## O que foi feito

1. **Backup**
   - Branch git: `backup/overnight-20261014-2257`
   - Cadastros críticos: `backups/data-critico-20261014-2257/`
   - `data-local` semeada a partir de `data` (cópia; origem intacta)
2. **Nags de sync silenciados no hub local**
   - Chip «enviar ao servidor» / fila offline (OfflineIndicator)
   - Semáforo deixa de piscar azul/amarelo «atualizar servidor» após o arranque
   - Modal de sincronização multi-dispositivo não bloqueia o ecrã
   - Avisos biblioteca «Railway / Enviar ao servidor» escondidos no modo local
   - Banner PWA «Nova versão» mantido só quando há SW realmente novo
3. **App local independente**
   - `DATA_DIR=data-local`, `HOSTNAME=0.0.0.0`, `NONATO_FORCE_DEV=1` (UI fresca via next/dev, sem rebuild a cada clique)
   - `NEXT_PUBLIC_NONATO_LOCAL_HUB=1`
   - Se `data-local` estiver vazia e existir `data`, o `.bat` copia automaticamente
   - Guia: `MODO-LOCAL-PC-TABLET.md`
4. **Cobrança por períodos** (Relatório Especial)
   - Visível no banner de **Fechamento de horas**, na lista e no ecrã de cobrança
   - Módulo: `app/modules/relatorios-especiais/fechamentoIntervalos.ts`
5. **PWA** mantida (instalável); versão sincronizada com `pwa:bump`
6. **i18n** (6 idiomas) + `smoke:critico`

## O que NÃO foi feito

- **Sem `git push`** para Railway/remoto (só commit local)
- Sem reescrita do `NonatoMainApp.tsx`
- Sem wipe de cadastros

## Checklist rápido (~2 min)

- Abrir com o `.bat` → login → lista de clientes ainda lá
- Relatório Especial → Fechamento de horas → ver **Por períodos**
- Confirmar que não aparece spam de «atualizar o servidor»

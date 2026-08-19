import type { CSSProperties } from 'react'
import type { Agendamento } from './tipos'
import { AGENDA_CANCELADO_BG, AGENDA_CANCELADO_BORDA, AGENDA_CANCELADO_SOMBRA } from './tipos'
import {
  isAgendamentoPessoal,
  normalizeStatusAgendamento,
  normalizeTipoAgendamento,
  type StatusOperacionalAgenda,
} from './normalize'

/** Paleta de cartões/marcadores por status real (não mentir pendente/confirmado = em andamento). */
export type CoresAgendamentoVisual = {
  accent: string
  fundo: string
  borda: string
}

export function coresAgendamentoVisual(ag: Agendamento): CoresAgendamentoVisual {
  if (isAgendamentoPessoal(ag)) {
    return {
      accent: 'rgba(168, 85, 247, 0.92)',
      fundo: 'rgba(124, 58, 237, 0.22)',
      borda: 'rgba(216, 180, 254, 0.55)',
    }
  }
  const st = normalizeStatusAgendamento(ag)
  if (st === 'concluido') {
    return {
      accent: 'rgba(34, 197, 94, 0.95)',
      fundo: 'rgba(0, 200, 80, 0.16)',
      borda: 'rgba(0, 255, 130, 0.45)',
    }
  }
  if (st === 'cancelado') {
    return {
      accent: '#f87171',
      fundo: 'rgba(178, 28, 28, 0.22)',
      borda: 'rgba(248, 113, 113, 0.65)',
    }
  }
  // Pré-agendamento activo (qualquer status não terminal) → dourado
  if (normalizeTipoAgendamento(ag) === 'pre-agendamento') {
    return {
      accent: 'rgba(255, 190, 50, 0.95)',
      fundo: 'rgba(255, 150, 0, 0.2)',
      borda: 'rgba(255, 180, 60, 0.7)',
    }
  }
  if (st === 'em-andamento') {
    return {
      accent: 'rgba(255, 107, 45, 0.95)',
      fundo: 'rgba(255, 107, 45, 0.2)',
      borda: 'rgba(255, 160, 100, 0.65)',
    }
  }
  if (st === 'confirmado') {
    return {
      accent: 'rgba(55, 130, 235, 0.95)',
      fundo: 'rgba(40, 100, 220, 0.22)',
      borda: 'rgba(120, 170, 255, 0.65)',
    }
  }
  if (st === 'pendente') {
    return {
      accent: 'rgba(234, 88, 12, 0.95)',
      fundo: 'rgba(234, 88, 12, 0.18)',
      borda: 'rgba(255, 140, 90, 0.6)',
    }
  }
  return {
    accent: 'rgba(90, 150, 255, 0.55)',
    fundo: 'rgba(40, 100, 220, 0.18)',
    borda: 'rgba(120, 170, 255, 0.5)',
  }
}

/** Estilo do cartão no Estado Visual (tinted por status/tipo real). */
export function estiloCardAgendaEstadoVisualShared(ag: Agendamento): CSSProperties {
  const c = coresAgendamentoVisual(ag)
  return {
    padding: '10px',
    backgroundColor: c.fundo,
    borderRadius: '6px',
    border: `1px solid ${c.borda}`,
  }
}

/**
 * Fundo do cartão na lista da Agenda Técnica.
 * Usa CSS var para vencer `background-color: … !important` em globals.css.
 */
export function estiloFundoCardAgendaLista(ag: Agendamento): CSSProperties {
  if (isAgendamentoCanceladoSafe(ag)) {
    return {
      ['--agenda-card-bg' as string]: AGENDA_CANCELADO_BG,
      background: AGENDA_CANCELADO_BG,
    } as CSSProperties
  }
  const c = coresAgendamentoVisual(ag)
  return {
    ['--agenda-card-bg' as string]: c.fundo,
    backgroundColor: c.fundo,
  } as CSSProperties
}

function isAgendamentoCanceladoSafe(ag: Agendamento): boolean {
  return normalizeStatusAgendamento(ag) === 'cancelado'
}

/** Cores dos botões rápidos Em andamento / Concluído / Cancelado (activo = destaque). */
export function estiloBotaoRapidoStatusOperacional(
  op: StatusOperacionalAgenda,
  ativo: boolean
): CSSProperties {
  const paleta: Record<
    StatusOperacionalAgenda,
    { idleBg: string; idleBorder: string; activeBg: string; activeBorder: string; color: string }
  > = {
    'em-andamento': {
      idleBg: 'rgba(255, 107, 45, 0.16)',
      idleBorder: '1px solid rgba(255, 160, 100, 0.45)',
      activeBg: 'rgba(255, 107, 45, 0.38)',
      activeBorder: '2px solid rgba(255, 140, 70, 0.95)',
      color: '#ffd4bc',
    },
    concluido: {
      idleBg: 'rgba(0, 200, 83, 0.14)',
      idleBorder: '1px solid rgba(0, 200, 83, 0.4)',
      activeBg: 'rgba(0, 200, 83, 0.32)',
      activeBorder: '2px solid #00c853',
      color: '#bbf7d0',
    },
    cancelado: {
      idleBg: 'rgba(239, 68, 68, 0.14)',
      idleBorder: '1px solid rgba(248, 113, 113, 0.45)',
      activeBg: 'rgba(239, 68, 68, 0.36)',
      activeBorder: '2px solid #f87171',
      color: '#fecaca',
    },
  }
  const p = paleta[op]
  return {
    fontWeight: 700,
    cursor: 'pointer',
    border: ativo ? p.activeBorder : p.idleBorder,
    backgroundColor: ativo ? p.activeBg : p.idleBg,
    color: ativo ? '#fff' : p.color,
  }
}

export function estiloMarcadorAgendamentoCancelado(): CSSProperties {
  return {
    background: AGENDA_CANCELADO_BG,
    border: `2px solid ${AGENDA_CANCELADO_BORDA}`,
    boxShadow: AGENDA_CANCELADO_SOMBRA,
    color: '#ffffff',
    fontWeight: 700,
    textDecoration: 'line-through',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  }
}

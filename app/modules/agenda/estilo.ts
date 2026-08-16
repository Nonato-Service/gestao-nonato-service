import type { CSSProperties } from 'react'
import type { Agendamento } from './tipos'
import { AGENDA_CANCELADO_BG, AGENDA_CANCELADO_BORDA, AGENDA_CANCELADO_SOMBRA } from './tipos'
import { isAgendamentoPessoal, normalizeStatusAgendamento, normalizeTipoAgendamento } from './normalize'

export function estiloCardAgendaEstadoVisualShared(ag: Agendamento): CSSProperties {
  if (normalizeStatusAgendamento(ag) === 'concluido') {
    return {
      padding: '10px',
      backgroundColor: 'rgba(0, 200, 80, 0.14)',
      borderRadius: '6px',
      border: '1px solid rgba(0, 255, 130, 0.45)',
    }
  }
  if (isAgendamentoPessoal(ag)) {
    return {
      padding: '10px',
      backgroundColor: 'rgba(124, 58, 237, 0.22)',
      borderRadius: '6px',
      border: '1px solid rgba(216, 180, 254, 0.55)',
    }
  }
  if (normalizeTipoAgendamento(ag) === 'pre-agendamento') {
    return {
      padding: '10px',
      backgroundColor: 'rgba(255, 150, 0, 0.22)',
      borderRadius: '6px',
      border: '1px solid rgba(255, 180, 60, 0.7)',
    }
  }
  return {
    padding: '10px',
    backgroundColor: 'rgba(40, 100, 220, 0.2)',
    borderRadius: '6px',
    border: '1px solid rgba(120, 170, 255, 0.55)',
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

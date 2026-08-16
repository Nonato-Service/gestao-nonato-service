import type { CSSProperties } from 'react'

export type Agendamento = {
  id: string
  tipo: 'pre-agendamento' | 'agendamento-tecnico'
  tecnico: string
  cliente: string
  clienteId?: string
  equipamento?: string
  equipamentoId?: string
  data: string
  hora: string
  duracaoEstimada: string // em dias
  /** Datas (YYYY-MM-DD) escolhidas no calendário de duração; usado com duracaoEstimada = quantidade */
  diasSelecionados?: string[]
  tipoServico: string
  observacoesTecnicas: string
  necessidadePecas: boolean
  codigoNotaFiscal?: string
  pecasAnexadas?: string[] // URLs ou IDs das peças anexadas
  status: 'pendente' | 'confirmado' | 'em-andamento' | 'concluido' | 'cancelado'
  telefone: string
  endereco: string
  cidade: string
  dataCriacao: string
  dataConfirmacao?: string
  /** Texto livre: serviço efetivamente executado (preencher ao concluir). Gravado com o agendamento. */
  relatorioTrabalhoExecutado?: string
  /** Preenchido automaticamente ao passar o estado para «Concluído». */
  dataRegistoConclusao?: string
  /** servico = cliente/equipamento; pessoal = assuntos particulares ou visita técnica (sem cliente). */
  categoria?: 'servico' | 'pessoal'
  /** Quando categoria = pessoal: tipo de compromisso exibido na agenda. */
  subtipoPessoal?: 'pessoal' | 'visita-tecnica'
  /** Descrição opcional do assunto pessoal (ex.: médico, banco). */
  assunto?: string
}

/** Máx. de concluídos na vista em lista; painéis usam valores menores para não sobrecarregar o ecrã. */
export const AGENDA_CONCLUIDOS_LISTA_MAX = 60
export const AGENDA_PAINEL_CONCLUIDOS_MAX = 40
export const AGENDA_PAINEL_CANCELADOS_MAX = 40
export const LS_AGENDA_CAL_CONCLUIDOS = 'nonato-agenda-cal-concluidos'

export type AgendaListaSecaoId = 'exec' | 'agend' | 'pre' | 'pessoal' | 'pend' | 'canc' | 'done' | 'dia'
export const AGENDA_LISTA_SECAO_IDS: AgendaListaSecaoId[] = [
  'exec',
  'agend',
  'pre',
  'pessoal',
  'pend',
  'canc',
  'done',
  'dia',
]

export const AGENDA_CANCELADO_BG =
  'linear-gradient(165deg, rgba(110, 14, 14, 0.98) 0%, rgba(52, 8, 8, 0.99) 48%, rgba(16, 0, 0, 1) 100%)'
export const AGENDA_CANCELADO_BORDA = '#f87171'
export const AGENDA_CANCELADO_SOMBRA = '0 0 22px rgba(248, 113, 113, 0.42)'

/** Estilo inline dos filtros da Agenda — garante visual mesmo com CSS/PWA em cache antigo */
export const AGENDA_FILTRO_CTRL_STYLE: CSSProperties = {
  width: '100%',
  height: 48,
  minHeight: 48,
  maxHeight: 48,
  boxSizing: 'border-box',
  padding: '0 14px',
  margin: 0,
  backgroundColor: '#3a3a3a',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 12,
  color: '#ffffff',
  WebkitTextFillColor: '#ffffff',
  fontSize: 14,
  lineHeight: '46px',
  appearance: 'none',
  WebkitAppearance: 'none',
}

export const AGENDA_FILTRO_BAR_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  gap: 12,
  width: '100%',
}

export type FechamentoFluxoFinanceiroEntryLike = {
  etapa?: string
  modo?: string
  pagamento?: string
  numeroFatura?: string
  situacaoFatura?: string
}

export type FechamentoFluxoFase = 'sem_numero_fatura' | 'aguardar_pagamento' | 'pago' | 'nao_pago'

export type EstadoCobrancaFinanceiraVisual = 'vermelho' | 'azul' | 'verde' | 'amarelo'

function parseFluxoEntry(fr: unknown): FechamentoFluxoFinanceiroEntryLike | null {
  if (!fr || typeof fr !== 'object' || Array.isArray(fr)) return null
  return fr as FechamentoFluxoFinanceiroEntryLike
}

/** Fase do fluxo: sem nº fatura → aguardar pagamento → pago / não pago. */
export function getFechamentoFluxoFase(fr: unknown): FechamentoFluxoFase {
  const frObj = parseFluxoEntry(fr)
  if (!frObj) return 'sem_numero_fatura'
  if (frObj.pagamento === 'pago' || frObj.situacaoFatura === 'paga') return 'pago'
  if (frObj.pagamento === 'devedor' || frObj.situacaoFatura === 'nao_paga') return 'nao_pago'
  const num = String(frObj.numeroFatura ?? '').trim()
  if (!num) return 'sem_numero_fatura'
  return 'aguardar_pagamento'
}

export function fechamentoFluxoFasePisca(fase: FechamentoFluxoFase): boolean {
  return fase === 'sem_numero_fatura' || fase === 'aguardar_pagamento'
}

/** Cor do cartão / grupo (compatível com CSS existente). */
export function getEstadoCobrancaFinanceiraVisual(fr: unknown): EstadoCobrancaFinanceiraVisual {
  const fase = getFechamentoFluxoFase(fr)
  if (fase === 'pago') return 'verde'
  if (fase === 'nao_pago' || fase === 'sem_numero_fatura') return 'vermelho'
  return 'azul'
}

export function classNameFechamentoFluxoBar(fase: FechamentoFluxoFase, compact?: boolean): string {
  const pisca = fechamentoFluxoFasePisca(fase)
  return [
    'fechamento-fluxo-bar',
    compact ? 'fechamento-fluxo-bar--compact' : '',
    `fechamento-fluxo-bar--${fase.replace(/_/g, '-')}`,
    pisca ? 'fechamento-fluxo-bar--pisca' : 'fechamento-fluxo-bar--fixo',
  ]
    .filter(Boolean)
    .join(' ')
}

export function classNameFinanceiroDespesasBibCardPorEstado(estado: EstadoCobrancaFinanceiraVisual): string {
  return `financeiro-despesas-bib-card financeiro-despesas-bib-card--${estado}`
}

export function classNameFinanceiroDespesasBibGrupoPorEstado(
  estado: EstadoCobrancaFinanceiraVisual | 'misto'
): string {
  return `financeiro-despesas-bib-grupo financeiro-despesas-bib-grupo--${estado}`
}

const PRIORIDADE_ESTADOS: EstadoCobrancaFinanceiraVisual[] = ['vermelho', 'amarelo', 'azul', 'verde']

export function getEstadoCobrancaFinanceiraGrupo(
  relatorioIds: string[],
  fluxoPorId: Record<string, unknown>
): EstadoCobrancaFinanceiraVisual {
  if (!relatorioIds.length) return 'vermelho'
  const estados = relatorioIds.map((id) => getEstadoCobrancaFinanceiraVisual(fluxoPorId[id]))
  for (const p of PRIORIDADE_ESTADOS) {
    if (estados.includes(p)) return p
  }
  return 'vermelho'
}

export type EstadoCobrancaFinanceiraGrupoExibicao = EstadoCobrancaFinanceiraVisual | 'misto'

export const ORDEM_ESTADOS_COBRANCA_FINANCEIRA: EstadoCobrancaFinanceiraVisual[] = [
  'vermelho',
  'amarelo',
  'azul',
  'verde',
]

export function getEstadoCobrancaFinanceiraGrupoExibicao(
  relatorioIds: string[],
  fluxoPorId: Record<string, unknown>
): EstadoCobrancaFinanceiraGrupoExibicao {
  if (!relatorioIds.length) return 'vermelho'
  const unicos = new Set(relatorioIds.map((id) => getEstadoCobrancaFinanceiraVisual(fluxoPorId[id])))
  if (unicos.size <= 1) return [...unicos][0] ?? 'vermelho'
  return 'misto'
}

/** Pasta cliente na Biblioteca — destaque em todo o botão/cartão (não só na coluna fatura). */
export function classNameBibliotecaClienteFluxoFinanceiro(
  relatorioIds: string[],
  fluxoPorId: Record<string, unknown>
): string {
  if (!relatorioIds.length) return ''
  const estado = getEstadoCobrancaFinanceiraGrupoExibicao(relatorioIds, fluxoPorId)
  const fases = relatorioIds.map((id) => getFechamentoFluxoFase(fluxoPorId[id]))
  const pisca =
    estado !== 'misto' && fases.some((f) => fechamentoFluxoFasePisca(f))
  return [
    'biblioteca-relatorios-cliente--fluxo',
    `biblioteca-relatorios-cliente--fluxo-${estado}`,
    pisca ? 'biblioteca-relatorios-cliente--fluxo-pisca' : 'biblioteca-relatorios-cliente--fluxo-fixo',
  ].join(' ')
}

/** Grupo cliente em Gestão Financeira — animação no cartão inteiro quando falta fatura ou aguarda pagamento. */
export function financeiroDespesasBibGrupoDevePiscar(
  relatorioIds: string[],
  fluxoPorId: Record<string, unknown>,
  variosEstados: boolean
): boolean {
  if (variosEstados || !relatorioIds.length) return false
  return relatorioIds.some((id) => fechamentoFluxoFasePisca(getFechamentoFluxoFase(fluxoPorId[id])))
}

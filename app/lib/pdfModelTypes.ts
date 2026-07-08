/** Modelos de PDF partilhados entre relatórios, orçamentos e pedidos. */

export const PDF_MODELO_LABEL_KEYS: Record<string, string> = {
  classico: 'modeloClassico',
  detalhado: 'modeloDetalhado',
  compacto: 'modeloCompacto',
  moderno: 'modeloModerno',
  profissional: 'modeloProfissional',
  minimalista: 'modeloMinimalista',
  tecnico: 'modeloTecnico',
  executivo: 'modeloExecutivo',
  negro: 'modeloNegro',
  ferwood: 'modeloFerwood',
  resumido: 'modeloResumido',
  colorido: 'modeloColorido',
  formal: 'modeloFormal',
  lista: 'modeloLista',
}

export const PDF_MODELO_ALL = new Set(Object.keys(PDF_MODELO_LABEL_KEYS))

export const PDF_MODELO_GROUPS = [
  {
    id: 'recomendados' as const,
    models: ['classico', 'detalhado', 'compacto', 'moderno', 'profissional'],
  },
  {
    id: 'outros' as const,
    models: ['minimalista', 'tecnico', 'executivo', 'negro', 'ferwood', 'resumido', 'colorido', 'formal', 'lista'],
  },
]

/** Subconjunto usado em orçamentos / pedidos (temas CSS disponíveis). */
export const PDF_MODELO_ORCAMENTO_GROUPS = [
  {
    id: 'recomendados' as const,
    models: ['profissional', 'classico', 'moderno', 'detalhado', 'compacto'],
  },
  {
    id: 'outros' as const,
    models: ['minimalista', 'executivo', 'formal', 'resumido', 'colorido'],
  },
]

export const PDF_MODELO_PADRAO = 'profissional'

export function normalizePdfModelo(model: string | undefined | null, fallback = PDF_MODELO_PADRAO): string {
  const m = String(model ?? '').trim()
  return PDF_MODELO_ALL.has(m) ? m : fallback
}

export function pdfModeloBodyClass(model: string, prefix: 'rs-pdf' | 'orc-pdf-pro'): string {
  const m = normalizePdfModelo(model)
  return `${prefix} ${prefix}--${m}`
}

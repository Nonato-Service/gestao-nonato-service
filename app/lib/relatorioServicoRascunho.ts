/** Rascunho automático do Relatório de Serviço (chave separada — não sobrescreve a lista). */

export const RELATORIO_SERVICO_RASCUNHO_KEY = 'nonato-relatorio-servico-rascunho'

/** Forma mínima para ler/gravar sem acoplar ao monólito. */
export type RelatorioServicoRascunhoLike = {
  id?: string
  numero?: string
  tecnico?: string
  cliente?: string
  clienteId?: string
  cidade?: string
  telefone?: string
  data?: string
  maquinaModelo?: string
  numeroMaquina?: string
  tipoServico?: string
  diasTrabalho?: unknown[]
  observacoes?: string
  pontosAberto?: string
  equipamentos?: Array<{
    equipamentoId?: string
    maquinaModelo?: string
    numeroMaquina?: string
  }>
  [key: string]: unknown
}

export function lerRascunhoRelatorioServico(): RelatorioServicoRascunhoLike | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(RELATORIO_SERVICO_RASCUNHO_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as RelatorioServicoRascunhoLike
    if (!p || typeof p !== 'object') return null
    return p
  } catch {
    return null
  }
}

export function gravarRascunhoRelatorioServico(rel: RelatorioServicoRascunhoLike): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(RELATORIO_SERVICO_RASCUNHO_KEY, JSON.stringify(rel))
  } catch {
    /* quota — não apagar lista nem outros dados */
  }
}

export function limparRascunhoRelatorioServico(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(RELATORIO_SERVICO_RASCUNHO_KEY)
  } catch {
    /* ignorar */
  }
}

/** Conteúdo útil (ignora só número/data auto gerados num formulário vazio). */
export function rascunhoRelatorioServicoTemConteudo(rel: RelatorioServicoRascunhoLike | null | undefined): boolean {
  if (!rel || typeof rel !== 'object') return false
  const eqs = (rel.equipamentos || []).filter(
    (e) => e?.equipamentoId || e?.maquinaModelo || e?.numeroMaquina
  )
  const dias = Array.isArray(rel.diasTrabalho) ? rel.diasTrabalho : []
  return Boolean(
    String(rel.tecnico || '').trim() ||
      String(rel.cliente || '').trim() ||
      String(rel.maquinaModelo || '').trim() ||
      String(rel.numeroMaquina || '').trim() ||
      String(rel.tipoServico || '').trim() ||
      String(rel.observacoes || '').trim() ||
      String(rel.pontosAberto || '').trim() ||
      eqs.length > 0 ||
      dias.length > 0
  )
}

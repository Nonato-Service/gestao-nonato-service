/** Linha vazia e normalização do orçamento de serviço técnico. */

import type { OstPropostaLinha } from './ostTipos'

export function newOstEntityId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function emptyOstPropostaLinha(): OstPropostaLinha {
  return { rowId: newOstEntityId(), servicoId: '', quantidadeStr: '1' }
}

export function normalizeOstPropostaLinha(l: Partial<OstPropostaLinha>): OstPropostaLinha {
  return {
    rowId: l.rowId && String(l.rowId).trim() ? String(l.rowId) : newOstEntityId(),
    servicoId: l.servicoId || '',
    quantidadeStr:
      l.quantidadeStr != null && String(l.quantidadeStr).trim() !== '' ? String(l.quantidadeStr) : '1',
  }
}

export function normalizeOstPropostaLinhas(linhas: readonly Partial<OstPropostaLinha>[] | undefined): OstPropostaLinha[] {
  if (!linhas || linhas.length === 0) return [emptyOstPropostaLinha()]
  return linhas.map(normalizeOstPropostaLinha)
}

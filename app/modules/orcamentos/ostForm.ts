/** Linha vazia e normalização do orçamento de serviço técnico. */

import type { OstPropostaLinha } from './ostTipos'

export type OstIdDeps = {
  nowMs: number
  random: () => number
  randomUUID?: () => string
}

/** Relógio (`nowMs`), aleatório (`random`) e UUID opcional injectados. */
export function newOstEntityId(deps: OstIdDeps): string {
  if (deps.randomUUID) return deps.randomUUID()
  return `r-${deps.nowMs}-${deps.random().toString(36).slice(2, 9)}`
}

export function emptyOstPropostaLinha(deps: OstIdDeps): OstPropostaLinha {
  return { rowId: newOstEntityId(deps), servicoId: '', quantidadeStr: '1' }
}

export function normalizeOstPropostaLinha(l: Partial<OstPropostaLinha>, deps: OstIdDeps): OstPropostaLinha {
  return {
    rowId: l.rowId && String(l.rowId).trim() ? String(l.rowId) : newOstEntityId(deps),
    servicoId: l.servicoId || '',
    quantidadeStr:
      l.quantidadeStr != null && String(l.quantidadeStr).trim() !== '' ? String(l.quantidadeStr) : '1',
  }
}

export function normalizeOstPropostaLinhas(
  linhas: readonly Partial<OstPropostaLinha>[] | undefined,
  deps: OstIdDeps
): OstPropostaLinha[] {
  if (!linhas || linhas.length === 0) return [emptyOstPropostaLinha(deps)]
  return linhas.map((linha) => normalizeOstPropostaLinha(linha, deps))
}

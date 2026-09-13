/** Linha vazia e normalização do orçamento de peças especiais. */

import type { LinhaOrcamentoPecasEsp } from './pecasEspeciaisTipos'

export type PecasEspeciaisIdDeps = {
  nowMs: number
  random: () => number
  randomUUID?: () => string
}

/** Relógio (`nowMs`), aleatório (`random`) e UUID opcional injectados. */
export function newPecasEspeciaisEntityId(deps: PecasEspeciaisIdDeps): string {
  if (deps.randomUUID) return deps.randomUUID()
  return `r-${deps.nowMs}-${deps.random().toString(36).slice(2, 9)}`
}

export function emptyLinhaOrcamentoPecasEsp(deps: PecasEspeciaisIdDeps): LinhaOrcamentoPecasEsp {
  return {
    rowId: newPecasEspeciaisEntityId(deps),
    numeroArtigo: '',
    quantidade: '1',
    precoUnitario: '',
    titulo: '',
    descricao: '',
    descricaoOriginal: '',
    infoExtra: '',
    imagem: '',
    pecaId: '',
  }
}

export function normalizeLinhaOrcamentoPecasEsp(
  l: Partial<LinhaOrcamentoPecasEsp>,
  deps: PecasEspeciaisIdDeps
): LinhaOrcamentoPecasEsp {
  const descOriginal = String(l.descricaoOriginal ?? l.descricao ?? '').trim()
  return {
    rowId: l.rowId || newPecasEspeciaisEntityId(deps),
    numeroArtigo: String(l.numeroArtigo ?? ''),
    quantidade: String(l.quantidade ?? '1'),
    precoUnitario: String(l.precoUnitario ?? ''),
    titulo: String(l.titulo ?? ''),
    descricao: String(l.descricao ?? descOriginal),
    descricaoOriginal: descOriginal,
    infoExtra: String(l.infoExtra ?? ''),
    imagem: String(l.imagem ?? ''),
    pecaId: String(l.pecaId ?? ''),
  }
}

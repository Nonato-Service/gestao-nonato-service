/** Linha vazia e normalização do orçamento de peças especiais. */

import type { LinhaOrcamentoPecasEsp } from './pecasEspeciaisTipos'

export function newPecasEspeciaisEntityId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function emptyLinhaOrcamentoPecasEsp(): LinhaOrcamentoPecasEsp {
  return {
    rowId: newPecasEspeciaisEntityId(),
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

export function normalizeLinhaOrcamentoPecasEsp(l: Partial<LinhaOrcamentoPecasEsp>): LinhaOrcamentoPecasEsp {
  const descOriginal = String(l.descricaoOriginal ?? l.descricao ?? '').trim()
  return {
    rowId: l.rowId || newPecasEspeciaisEntityId(),
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

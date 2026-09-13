/** Validação e mapeamento puro da peça de substituição / instalação. */

import type { PecaSubstituicao } from './pecaSubstituicao'

export type PecaBibliotecaParaSubstituicao = {
  nome?: string
  descricao?: string
  codigo?: string
  imagem?: string
}

export function isPecaSubstituicaoFormValid(
  form: Pick<PecaSubstituicao, 'descricao' | 'codigo' | 'quantidade'>
): boolean {
  return Boolean(form.descricao && form.codigo && form.quantidade)
}

export type CreatePecaSubstituicaoFromFormOpts = {
  id?: string
  nowMs: number
  random: () => number
}

export function createPecaSubstituicaoFromForm(
  form: PecaSubstituicao,
  opts: CreatePecaSubstituicaoFromFormOpts
): PecaSubstituicao {
  return {
    ...form,
    id: opts.id ?? opts.nowMs.toString() + opts.random().toString(36).substr(2, 9),
  }
}

export function pecaBibliotecaToPecaSubstituicaoForm(
  peca: PecaBibliotecaParaSubstituicao
): PecaSubstituicao {
  return {
    id: '',
    descricao: peca.nome || '',
    codigo: peca.codigo || '',
    quantidade: '1',
    imagem: peca.imagem,
  }
}

export function createPecaSubstituicaoFromBiblioteca(
  peca: PecaBibliotecaParaSubstituicao,
  quantidade = '1',
  opts: CreatePecaSubstituicaoFromFormOpts
): PecaSubstituicao | null {
  const codigo = String(peca.codigo ?? '').trim()
  if (!codigo) return null
  return {
    id: opts.id ?? `${opts.nowMs}-${opts.random().toString(36).slice(2, 9)}`,
    descricao: peca.nome || peca.descricao || '',
    codigo,
    quantidade: String(quantidade),
    imagem: peca.imagem,
  }
}

export function pecaSubstituicaoCodigoDuplicado(
  lista: Array<Pick<PecaSubstituicao, 'codigo'>>,
  codigo: string
): boolean {
  const chave = String(codigo ?? '').trim().toLowerCase()
  if (!chave) return false
  return lista.some((p) => String(p.codigo ?? '').trim().toLowerCase() === chave)
}

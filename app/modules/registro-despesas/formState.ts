/** Formulários vazios do cartão empresa e da linha de despesa. */

import type { CartaoEmpresaDespesas } from './tipos'

export type CartaoEmpresaDespesasFormState = {
  apelido: string
  ultimos4: string
}

export function emptyCartaoEmpresaDespesasForm(): CartaoEmpresaDespesasFormState {
  return { apelido: '', ultimos4: '' }
}

export type DespesaRegistroFormState = {
  tipoId: string
  tipoNome: string
  valor: number
  descricao: string
  codigoBarras: string
  fotos: string[]
  data: string
  cartaoId: string
}

export function emptyDespesaRegistroForm(): DespesaRegistroFormState {
  return {
    tipoId: '',
    tipoNome: '',
    valor: 0,
    descricao: '',
    codigoBarras: '',
    fotos: [],
    data: new Date().toISOString().split('T')[0],
    cartaoId: '',
  }
}

/** Apelido + últimos 4 (nunca o PAN completo). */
export function rotuloCartaoEmpresaDespesas(c: Pick<CartaoEmpresaDespesas, 'apelido' | 'ultimos4'>): string {
  const u = String(c.ultimos4 || '').replace(/\D/g, '').slice(-4).padStart(4, '0')
  return `${String(c.apelido || '').trim()} •••• ${u}`
}

export function rotuloLinhaCartaoEmpresa(
  cartaoId: string | undefined,
  cartoes: readonly CartaoEmpresaDespesas[]
): string | undefined {
  if (!cartaoId) return undefined
  const c = cartoes.find((x) => x.id === cartaoId)
  return c ? rotuloCartaoEmpresaDespesas(c) : undefined
}

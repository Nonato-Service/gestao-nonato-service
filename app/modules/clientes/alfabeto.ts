/** Índice A–Z e filtro pela letra inicial do nome do cliente. */

export const CLIENTES_ALFABETO_INDICE = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#'] as const

/** Alias histórico (orçamentos / listas partilhadas usam o mesmo índice). */
export const ORCAMENTOS_ALFABETO_INDICE = CLIENTES_ALFABETO_INDICE

export function getClienteLetraAlfabeto(nome: string): string {
  const n = (nome || '').trim()
  if (!n) return '#'
  const match = n.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/)
  if (!match) return '#'
  const ch = match[0].toUpperCase()
  const base = ch.normalize('NFD').replace(/\p{M}/gu, '')
  if (/[A-Z]/.test(base)) return base
  return '#'
}

function normalizarLetraPalavra(palavra: string): string | null {
  const match = palavra.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/)
  if (!match) return null
  const base = match[0].toUpperCase().normalize('NFD').replace(/\p{M}/gu, '')
  return /[A-Z]/.test(base) ? base : null
}

export function extrairPalavrasNomeCliente(nome: string): string[] {
  return (nome || '')
    .split(/[\s(,;/\[\]{}]+/)
    .map((p) => p.replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ]+|[^A-Za-zÀ-ÖØ-öø-ÿ]+$/g, '').trim())
    .filter((p) => p.length >= 2)
}

/** Letra principal do nome (primeira letra A–Z) — usada no índice A–Z de clientes. */
export function clienteNomeMatchesLetraAlfabeto(nome: string, letra: string): boolean {
  const alvo = letra.toUpperCase()
  return getClienteLetraAlfabeto(nome) === alvo
}

/**
 * Qualquer palavra do nome começa com a letra (ex.: «BRUNO MORAIS» em M).
 * Só para pesquisa auxiliar (orçamentos); o índice A–Z de clientes usa a letra principal.
 */
export function clienteNomeMatchesLetraEmQualquerPalavra(nome: string, letra: string): boolean {
  const alvo = letra.toUpperCase()
  if (alvo === '#') return getClienteLetraAlfabeto(nome) === '#'
  if (getClienteLetraAlfabeto(nome) === alvo) return true
  return extrairPalavrasNomeCliente(nome).some((palavra) => normalizarLetraPalavra(palavra) === alvo)
}

export function contarClientesPorLetraAlfabeto<T extends { nomeEmpresa?: string | null }>(
  clientes: T[],
  letra: string
): number {
  const alvo = letra.toUpperCase()
  return clientes.filter((c) => getClienteLetraAlfabeto(c.nomeEmpresa || '') === alvo).length
}

export function filtrarClientesPorLetraAlfabeto<T extends { nomeEmpresa?: string | null }>(
  clientes: T[],
  letra: string
): T[] {
  const alvo = letra.toUpperCase()
  return clientes.filter((c) => getClienteLetraAlfabeto(c.nomeEmpresa || '') === alvo)
}

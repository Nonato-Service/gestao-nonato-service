import { getClienteLetraAlfabeto, ORCAMENTOS_ALFABETO_INDICE } from './orcamentosAlfabeto'

export { ORCAMENTOS_ALFABETO_INDICE as ALFABETO_INDICE, getClienteLetraAlfabeto as getLetraAlfabetoNome }

export type NomeAlfabetoRow = { id: string; nome: string }

export function filtrarPorNomeBusca<T extends NomeAlfabetoRow>(items: T[], busca: string): T[] {
  const q = busca.trim().toLowerCase()
  if (!q) return [...items]
  return items.filter((i) => (i.nome || '').toLowerCase().includes(q))
}

export function agruparPorLetraNome<T extends NomeAlfabetoRow>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const it of items) {
    const letra = getClienteLetraAlfabeto(it.nome)
    if (!map.has(letra)) map.set(letra, [])
    map.get(letra)!.push(it)
  }
  return map
}

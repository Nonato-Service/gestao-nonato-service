/** Tipos e texto de meta do índice A–Z genérico (nome). */

export type AlfabetoIndiceBuscaLabels = {
  buscar?: string
  nenhumEncontrado?: string
  selecioneLetra?: string
  mostrando?: string
  de?: string
  itens?: string
  comInicial?: string
  outros?: string
  semItensLetra?: string
  indiceAz?: string
  limpar?: string
  filtrados?: string
  promptLetra?: string
}

export type AlfabetoIndiceBuscaMetaOpts = {
  labels?: AlfabetoIndiceBuscaLabels
  itemLabel: string
  letraAtiva: string | null
  countLetraAtiva: number
  busca: string
  filtradosCount: number
  totalCount: number
}

export function formatAlfabetoIndiceBuscaMeta(opts: AlfabetoIndiceBuscaMetaOpts): string {
  const L = opts.labels ?? {}
  const buscaTrim = opts.busca.trim()
  if (opts.letraAtiva) {
    return `${opts.countLetraAtiva} ${opts.itemLabel} ${L.comInicial || 'com inicial'} «${
      opts.letraAtiva === '#' ? L.outros || 'Outros' : opts.letraAtiva
    }»${buscaTrim ? ` (${L.de || 'de'} ${opts.filtradosCount} ${L.filtrados || 'filtrados'})` : ''}`
  }
  return `${L.mostrando || 'Mostrando'} ${opts.filtradosCount} ${L.de || 'de'} ${opts.totalCount} ${opts.itemLabel} — ${
    L.selecioneLetra || 'selecione uma letra abaixo'
  }`
}

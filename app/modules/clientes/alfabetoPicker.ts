/** Tipos e texto de meta do picker A–Z de clientes. */

export type ClienteAlfabetoPickerLabels = {
  buscar?: string
  nenhumEncontrado?: string
  selecioneLetra?: string
  prompt?: string
  mostrando?: string
  de?: string
  clientes?: string
  comInicial?: string
  outros?: string
  semClientesLetra?: string
  indiceAz?: string
  limpar?: string
  cliente?: string
  filtrados?: string
  devedor?: string
  toqueFiltrar?: string
  expandirTodos?: string
  retrairTodos?: string
  carregarMais?: string
}

export type ClienteAlfabetoPickerAction = {
  id: string
  label: string
  active?: boolean
  onClick: () => void
}

export type ClienteAlfabetoPickerMetaOpts = {
  labels?: ClienteAlfabetoPickerLabels
  letraAtiva: string | null
  countLetraAtiva: number
  busca: string
  buscaAtiva: boolean
  filtradosCount: number
  totalCount: number
}

export function formatClienteAlfabetoPickerMeta(opts: ClienteAlfabetoPickerMetaOpts): string {
  const L = opts.labels ?? {}
  const buscaTrim = opts.busca.trim()
  if (opts.letraAtiva) {
    return `${opts.countLetraAtiva} ${L.clientes || 'cliente(s)'} ${L.comInicial || 'com inicial'} «${
      opts.letraAtiva === '#' ? L.outros || 'Outros' : opts.letraAtiva
    }»${buscaTrim ? ` (${L.de || 'de'} ${opts.filtradosCount} ${L.filtrados || 'filtrados'})` : ''}`
  }
  if (opts.buscaAtiva) {
    return `${opts.filtradosCount} ${L.clientes || 'cliente(s)'} — «${buscaTrim}»`
  }
  return `${L.mostrando || 'Mostrando'} ${opts.filtradosCount} ${L.de || 'de'} ${opts.totalCount} ${
    L.clientes || 'cliente(s)'
  } — ${L.toqueFiltrar || 'toque numa letra para filtrar'}`
}

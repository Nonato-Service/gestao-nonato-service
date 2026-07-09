export type FechamentoItemLike = {
  id: string
  valorTotal: number
  cobrarDiaria?: boolean
}

export type FechamentoIvaLike = { incluirIva: boolean; taxaIva: number }

export type RelatorioClienteLike = {
  id: string
  numero: string
  data: string
  tipoServico: string
  servicoConcluido: boolean
  maquinaModelo?: string
  numeroMaquina?: string
}

import {
  equipamentoIdETecnicoGerado,
  resolverIdEquipamentoCliente,
  resolverIdEquipamentoVisivelCliente,
  type EquipamentoArmazemIdLookup,
} from './relatorioServicoEquipamentos'

export type { EquipamentoArmazemIdLookup } from './relatorioServicoEquipamentos'

export type EquipamentoClienteLike = {
  id?: string
  tipoEquipamento: string
  modelo: string
  marca: string
  numeroSerie: string
  photo?: string
  coverPhoto?: string
}

export type RotuloIdEquipamentoCliente = {
  texto: string
  titulo?: string
  tecnico?: boolean
}

/** ID para listas/cartões: código visível, ID próprio ou referência técnica (nunca oculto na UI). */
export function rotuloIdEquipamentoCliente(
  eq: { id?: string; numeroSerie?: string },
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = [],
  index = 0
): RotuloIdEquipamentoCliente | null {
  const sn = String(eq.numeroSerie ?? '').trim()
  const vis = resolverIdEquipamentoVisivelCliente(eq, equipamentosArmazem).trim()
  if (vis) return { texto: vis, titulo: vis }

  const raw = String(eq.id ?? '').trim()
  if (raw) {
    if (sn && raw.toLowerCase() === sn.toLowerCase()) return null
    if (!equipamentoIdETecnicoGerado(raw)) return { texto: raw, titulo: raw }
    const curto = raw.length > 28 ? `${raw.slice(0, 14)}…${raw.slice(-8)}` : raw
    return { texto: curto, titulo: raw, tecnico: true }
  }

  const chave = resolverIdEquipamentoCliente(eq, index).trim()
  if (chave && (!sn || chave.toLowerCase() !== sn.toLowerCase())) {
    return { texto: chave, titulo: chave, tecnico: true }
  }
  return null
}

export type FaturaPecasLike = {
  id: string
  clienteId: string
  valorTotal: number
  valorIVA: number
  valorSemIVA: number
  status: string
}

export type ClienteDetalheFinanceiroResumo = {
  totalFaturado: number
  pagos: number
  pendentes: number
  devedores: number
  ivaTotal: number
  vendasSemIva: number
}

export type ClienteDetalheServicoFinanceiro = {
  relatorioId: string
  titulo: string
  numero: string
  data: string
  subtotal: number
  iva: number
  total: number
  pagamento: 'pago' | 'pendente' | 'devedor'
}

function localeFromLanguage(language: string): string {
  const lang = (language || 'pt-BR').trim()
  if (lang === 'en') return 'en-GB'
  if (lang === 'de') return 'de-DE'
  if (lang === 'es') return 'es-ES'
  if (lang === 'fr') return 'fr-FR'
  if (lang === 'it') return 'it-IT'
  if (lang.startsWith('pt')) return 'pt-PT'
  return 'pt-PT'
}

export function fmtEuro(valor: number, language: string): string {
  return new Intl.NumberFormat(localeFromLanguage(language), {
    style: 'currency',
    currency: 'EUR',
  }).format(Number.isFinite(valor) ? valor : 0)
}

/** @deprecated use fmtEuro */
export function fmtEuroPt(valor: number): string {
  return fmtEuro(valor, 'pt-BR')
}

export function formatarData(dataIso: string | undefined, language: string, vazio = '—'): string {
  const s = (dataIso || '').trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return vazio
  const [y, m, d] = s.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return vazio
  return new Intl.DateTimeFormat(localeFromLanguage(language)).format(date)
}

/** @deprecated use formatarData */
export function formatarDataPt(dataIso: string | undefined): string {
  return formatarData(dataIso, 'pt-BR')
}

export function idClienteExibicao(id: string): string {
  const t = (id || '').trim()
  if (!t) return '—'
  if (t.length <= 12) return t
  return `${t.slice(0, 8)}…`
}

function totaisFechamentoLiquidoComIva(
  itens: FechamentoItemLike[],
  opts?: FechamentoIvaLike | null
): { liquido: number; iva: number; comIva: number } {
  const liquido = itens.reduce(
    (s, i) => s + (i.id === 'diarias' && i.cobrarDiaria === false ? 0 : Number(i.valorTotal) || 0),
    0
  )
  const incluir = Boolean(opts?.incluirIva)
  let taxa = Number(opts?.taxaIva)
  if (!Number.isFinite(taxa) || taxa < 0) taxa = 0
  if (taxa > 100) taxa = 100
  const iva = incluir ? Math.round(liquido * (taxa / 100) * 100) / 100 : 0
  const comIva = Math.round((liquido + iva) * 100) / 100
  return { liquido, iva, comIva }
}

function filtrarFechamentoItensPorOmitidos(
  omitidosPorRelatorio: Record<string, string[]>,
  relatorioId: string,
  itens: FechamentoItemLike[]
): FechamentoItemLike[] {
  const omit = new Set(omitidosPorRelatorio[relatorioId] || [])
  return itens.filter((i) => !omit.has(i.id))
}

export function getPagamentoRelatorio(fr: unknown): 'pago' | 'pendente' | 'devedor' {
  const frObj =
    fr && typeof fr === 'object' && !Array.isArray(fr)
      ? (fr as { pagamento?: string; situacaoFatura?: string })
      : null
  if (!frObj) return 'pendente'
  if (frObj.pagamento === 'pago' || frObj.situacaoFatura === 'paga') return 'pago'
  if (frObj.pagamento === 'devedor' || frObj.situacaoFatura === 'nao_paga') return 'devedor'
  return 'pendente'
}

export function coletarRelatoriosCliente(
  relatorios?: Record<string, RelatorioClienteLike[]>
): RelatorioClienteLike[] {
  const map = new Map<string, RelatorioClienteLike>()
  if (relatorios) {
    for (const key of Object.keys(relatorios)) {
      for (const r of relatorios[key] || []) {
        if (r?.id) map.set(r.id, r)
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => (b.data || '').localeCompare(a.data || ''))
}

export type RelatorioServicoFinanceiroLike = {
  id: string
  numero: string
  data: string
  tipoServico?: string
  servicoConcluido?: boolean
}

/** Relatórios com fechamento na biblioteca — fonte: cadastro do cliente + lista global de relatórios. */
export function coletarRelatoriosFinanceirosCliente(params: {
  relatoriosCliente?: Record<string, RelatorioClienteLike[]>
  relatoriosServico?: RelatorioServicoFinanceiroLike[]
  fechamentosGuardadosBibliotecaIds: string[]
  fechamentosRelatorios: Record<string, FechamentoItemLike[] | undefined>
}): RelatorioClienteLike[] {
  const map = new Map<string, RelatorioClienteLike>()
  for (const r of coletarRelatoriosCliente(params.relatoriosCliente)) {
    map.set(r.id, r)
  }

  const bibSet = new Set(params.fechamentosGuardadosBibliotecaIds)
  for (const rel of params.relatoriosServico ?? []) {
    if (!rel?.id || !bibSet.has(rel.id)) continue
    const itens = params.fechamentosRelatorios[rel.id]
    if (!itens?.length) continue
    map.set(rel.id, {
      id: rel.id,
      numero: rel.numero,
      data: rel.data,
      tipoServico: rel.tipoServico || rel.numero,
      servicoConcluido: Boolean(rel.servicoConcluido),
      maquinaModelo: undefined,
      numeroMaquina: undefined,
    })
  }

  return Array.from(map.values()).sort((a, b) => (b.data || '').localeCompare(a.data || ''))
}

export function dataClienteDesde(relatorios: RelatorioClienteLike[], language: string, vazio = '—'): string {
  if (!relatorios.length) return vazio
  const datas = relatorios.map((r) => r.data).filter(Boolean).sort()
  return formatarData(datas[0], language, vazio)
}

export function dataEquipamentoAdicionado(
  equipamento: EquipamentoClienteLike,
  index: number,
  relatorios: Record<string, RelatorioClienteLike[]> | undefined,
  language: string,
  vazio = '—'
): string {
  const equipamentoId = equipamento.numeroSerie || equipamento.modelo || String(index)
  const rels = relatorios?.[equipamentoId] || []
  if (!rels.length) return vazio
  const datas = rels.map((r) => r.data).filter(Boolean).sort()
  return formatarData(datas[0], language, vazio)
}

export function calcularResumoFinanceiroCliente(params: {
  clienteId: string
  relatorioIds: string[]
  faturasPecas: FaturaPecasLike[]
  fechamentosGuardadosBibliotecaIds: string[]
  fechamentosRelatorios: Record<string, FechamentoItemLike[]>
  fechamentoFluxoFinanceiroPorRelatorioId: Record<string, unknown>
  fechamentoIvaPorRelatorioId: Record<string, FechamentoIvaLike | undefined>
  fechamentoItensOmitidosPorRelatorio: Record<string, string[]>
  saldoDevedorPecas?: number
}): ClienteDetalheFinanceiroResumo {
  let totalFaturado = 0
  let pagos = 0
  let pendentes = 0
  let devedores = 0
  let ivaTotal = 0
  let vendasSemIva = 0

  const bibSet = new Set(params.fechamentosGuardadosBibliotecaIds)

  for (const relId of params.relatorioIds) {
    if (!bibSet.has(relId)) continue
    const itensRaw = params.fechamentosRelatorios[relId]
    if (!itensRaw?.length) continue
    const itens = filtrarFechamentoItensPorOmitidos(
      params.fechamentoItensOmitidosPorRelatorio,
      relId,
      itensRaw
    )
    const tot = totaisFechamentoLiquidoComIva(itens, params.fechamentoIvaPorRelatorioId[relId])
    const pag = getPagamentoRelatorio(params.fechamentoFluxoFinanceiroPorRelatorioId[relId])

    totalFaturado += tot.comIva
    vendasSemIva += tot.liquido
    ivaTotal += tot.iva

    if (pag === 'pago') pagos += tot.comIva
    else if (pag === 'devedor') devedores += tot.comIva
    else pendentes += tot.comIva
  }

  for (const f of params.faturasPecas) {
    if (f.clienteId !== params.clienteId || f.status === 'cancelada') continue
    totalFaturado += Number(f.valorTotal) || 0
    vendasSemIva += Number(f.valorSemIVA) || 0
    ivaTotal += Number(f.valorIVA) || 0
    if (f.status === 'paga') pagos += Number(f.valorTotal) || 0
    else if (f.status === 'vencida') devedores += Number(f.valorTotal) || 0
    else if (f.status === 'pendente') pendentes += Number(f.valorTotal) || 0
  }

  if (params.saldoDevedorPecas && params.saldoDevedorPecas > 0) {
    devedores = Math.max(devedores, params.saldoDevedorPecas)
  }

  const round = (n: number) => Math.round(n * 100) / 100
  return {
    totalFaturado: round(totalFaturado),
    pagos: round(pagos),
    pendentes: round(pendentes),
    devedores: round(devedores),
    ivaTotal: round(ivaTotal),
    vendasSemIva: round(vendasSemIva),
  }
}

export function buildServicosFinanceirosCliente(params: {
  relatorios: RelatorioClienteLike[]
  fechamentosGuardadosBibliotecaIds: string[]
  fechamentosRelatorios: Record<string, FechamentoItemLike[]>
  fechamentoFluxoFinanceiroPorRelatorioId: Record<string, unknown>
  fechamentoIvaPorRelatorioId: Record<string, FechamentoIvaLike | undefined>
  fechamentoItensOmitidosPorRelatorio: Record<string, string[]>
}): ClienteDetalheServicoFinanceiro[] {
  const bibSet = new Set(params.fechamentosGuardadosBibliotecaIds)
  const rows: ClienteDetalheServicoFinanceiro[] = []

  for (const rel of params.relatorios) {
    if (!bibSet.has(rel.id)) continue
    const itensRaw = params.fechamentosRelatorios[rel.id]
    if (!itensRaw?.length) continue
    const itens = filtrarFechamentoItensPorOmitidos(
      params.fechamentoItensOmitidosPorRelatorio,
      rel.id,
      itensRaw
    )
    const tot = totaisFechamentoLiquidoComIva(itens, params.fechamentoIvaPorRelatorioId[rel.id])
    rows.push({
      relatorioId: rel.id,
      titulo: rel.tipoServico || rel.numero,
      numero: rel.numero,
      data: rel.data,
      subtotal: tot.liquido,
      iva: tot.iva,
      total: tot.comIva,
      pagamento: getPagamentoRelatorio(params.fechamentoFluxoFinanceiroPorRelatorioId[rel.id]),
    })
  }

  return rows.sort((a, b) => (b.data || '').localeCompare(a.data || ''))
}

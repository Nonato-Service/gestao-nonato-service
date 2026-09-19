/** Totais e agrupamento por mês / instituição — funções puras. */

import type { EmpresaRecebedora, PagamentoSaida } from './tipos'

export function compararNomePt(a: string, b: string): number {
  return String(a || '').localeCompare(String(b || ''), 'pt', { sensitivity: 'base' })
}

export function ordenarEmpresasAlfabeto(list: EmpresaRecebedora[]): EmpresaRecebedora[] {
  return [...(Array.isArray(list) ? list : [])].sort((a, b) => compararNomePt(a.nome, b.nome))
}

export const PAGAMENTOS_MES_SEM_DATA = 'sem-data'

export function dataLocalISOFromMs(nowMs: number): string {
  const d = new Date(nowMs)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function normalizarDataPagamento(raw: string): string {
  const ymd = String(raw || '').trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : ''
}

export function formatarDataPagamentoVisivel(data: string, locale: string, semData: string): string {
  const ymd = normalizarDataPagamento(data)
  if (!ymd) return semData
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export type TotalInstituicaoPagamento = {
  empresaId: string
  empresaNome: string
  totalPago: number
  totalGeral: number
  qtdPago: number
}

export type GrupoMesPagamento = {
  mes: string
  itens: PagamentoSaida[]
  totalPago: number
  totalGeral: number
  porInstituicao: TotalInstituicaoPagamento[]
}

export function mesKeyPagamento(dataPagamento: string): string {
  const key = String(dataPagamento || '').trim().slice(0, 7)
  return /^\d{4}-\d{2}$/.test(key) ? key : PAGAMENTOS_MES_SEM_DATA
}

export function pagamentosDoMes(list: PagamentoSaida[], mes: string): PagamentoSaida[] {
  if (!mes || mes === 'todos') return [...list]
  return list.filter((p) => mesKeyPagamento(p.dataPagamento) === mes)
}

export function mergePagamentosPorId(local: PagamentoSaida[], incoming: PagamentoSaida[]): PagamentoSaida[] {
  const map = new Map<string, PagamentoSaida>()
  for (const p of incoming) {
    if (p && p.id) map.set(p.id, p)
  }
  for (const p of local) {
    if (!p || !p.id) continue
    const other = map.get(p.id)
    if (!other || String(p.atualizadoEm || '') >= String(other.atualizadoEm || '')) {
      map.set(p.id, p)
    }
  }
  return [...map.values()]
}

export function asListaPagamentos(value: unknown): PagamentoSaida[] {
  if (Array.isArray(value)) return value as PagamentoSaida[]
  if (value && typeof value === 'object') {
    const o = value as { registos?: unknown; items?: unknown; data?: unknown }
    if (Array.isArray(o.registos)) return o.registos as PagamentoSaida[]
    if (Array.isArray(o.items)) return o.items as PagamentoSaida[]
    if (Array.isArray(o.data)) return o.data as PagamentoSaida[]
  }
  return []
}

export function somarValorPagamentos(list: PagamentoSaida[], soPago = false): number {
  let total = 0
  for (const p of list) {
    if (soPago && p.status !== 'pago') continue
    const n = Number(p.valor)
    if (Number.isFinite(n)) total += n
  }
  return Math.round(total * 100) / 100
}

export function totaisPorInstituicao(list: PagamentoSaida[]): TotalInstituicaoPagamento[] {
  const map = new Map<string, TotalInstituicaoPagamento>()
  for (const p of list) {
    const id = p.empresaId || p.empresaNome || '—'
    const cur = map.get(id) || {
      empresaId: p.empresaId || id,
      empresaNome: p.empresaNome || id,
      totalPago: 0,
      totalGeral: 0,
      qtdPago: 0,
    }
    const n = Number(p.valor)
    const valor = Number.isFinite(n) ? n : 0
    cur.totalGeral = Math.round((cur.totalGeral + valor) * 100) / 100
    if (p.status === 'pago') {
      cur.totalPago = Math.round((cur.totalPago + valor) * 100) / 100
      cur.qtdPago += 1
    }
    map.set(id, cur)
  }
  return [...map.values()].sort((a, b) => a.empresaNome.localeCompare(b.empresaNome, 'pt'))
}

export function mesesDisponiveisPagamentos(list: PagamentoSaida[]): string[] {
  const set = new Set<string>()
  for (const p of list) set.add(mesKeyPagamento(p.dataPagamento))
  return [...set].sort((a, b) => {
    if (a === PAGAMENTOS_MES_SEM_DATA) return 1
    if (b === PAGAMENTOS_MES_SEM_DATA) return -1
    return b.localeCompare(a)
  })
}

export function agruparPagamentosPorMes(list: PagamentoSaida[]): GrupoMesPagamento[] {
  const byMes = new Map<string, PagamentoSaida[]>()
  for (const p of list) {
    const key = mesKeyPagamento(p.dataPagamento)
    const arr = byMes.get(key) || []
    arr.push(p)
    byMes.set(key, arr)
  }
  return mesesDisponiveisPagamentos(list).map((mes) => {
    const itens = (byMes.get(mes) || []).slice().sort((a, b) =>
      compararNomePt(a.paraQuem || a.empresaNome, b.paraQuem || b.empresaNome)
    )
    return {
      mes,
      itens,
      totalPago: somarValorPagamentos(itens, true),
      totalGeral: somarValorPagamentos(itens, false),
      porInstituicao: totaisPorInstituicao(itens),
    }
  })
}

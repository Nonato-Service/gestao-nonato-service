/**
 * Cobrança do Relatório Especial por intervalos de dias (várias notas).
 * Intervalos são inclusivos em ambas as pontas: [dataInicio, dataFim].
 * A cobrança completa (todos os dias) continua a ser o modo por omissão.
 */
import { diaTrabalhoDataChaveOrdenacao, sortDiasTrabalhoEspecialCronologicamente } from './calculos'
import type { DiaTrabalhoEspecial, RelatorioEspecial } from './tipos'

/** Separador na chave de persistência: `{parentId}::iv::{inicio}_{fim}` ou `…::iv::dias::{hash}`. */
export const FECHAMENTO_INTERVALO_SEP = '::iv::'

export type IntervaloCobrancaEspecial = {
  id: string
  /** YYYY-MM-DD inclusivo */
  dataInicio: string
  /** YYYY-MM-DD inclusivo */
  dataFim: string
  /**
   * Se preenchido, filtra pelos IDs exactos dos dias (permite dias não contínuos).
   * Caso contrário usa o intervalo de datas inclusivo.
   */
  diaIds?: string[]
}

export type DiaCobrancaEspecialResumo = {
  id: string
  data: string
  dataChave: string
}

export function normalizarDataChaveCobranca(raw: string | undefined | null): string {
  return diaTrabalhoDataChaveOrdenacao(String(raw ?? '').trim())
}

export function criarIntervaloCobrancaEspecialVazio(opts: {
  nowMs: number
  random: () => number
  dataInicio?: string
  dataFim?: string
}): IntervaloCobrancaEspecial {
  const ini = normalizarDataChaveCobranca(opts.dataInicio) || ''
  const fim = normalizarDataChaveCobranca(opts.dataFim) || ini
  return {
    id: `iv-${opts.nowMs}-${opts.random().toString(36).slice(2, 9)}`,
    dataInicio: ini,
    dataFim: fim || ini,
    diaIds: undefined,
  }
}

export function listarDiasCobrancaRelatorioEspecial(
  r: RelatorioEspecial | null | undefined
): DiaCobrancaEspecialResumo[] {
  if (!r) return []
  const dias = sortDiasTrabalhoEspecialCronologicamente(r.diasTrabalho || [])
  return dias.map((d) => ({
    id: String(d.id || ''),
    data: String(d.data || ''),
    dataChave: normalizarDataChaveCobranca(d.data),
  })).filter((d) => d.id)
}

export function intervaloCobrancaValido(iv: IntervaloCobrancaEspecial | null | undefined): boolean {
  if (!iv) return false
  if (Array.isArray(iv.diaIds) && iv.diaIds.length > 0) {
    return iv.diaIds.some((id) => String(id || '').trim().length > 0)
  }
  const ini = normalizarDataChaveCobranca(iv.dataInicio)
  const fim = normalizarDataChaveCobranca(iv.dataFim)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ini) || !/^\d{4}-\d{2}-\d{2}$/.test(fim)) return false
  return ini <= fim
}

export function filtrarDiasPorIntervaloCobranca(
  dias: DiaTrabalhoEspecial[] | undefined | null,
  iv: IntervaloCobrancaEspecial | null | undefined
): DiaTrabalhoEspecial[] {
  const lista = Array.isArray(dias) ? dias : []
  if (!intervaloCobrancaValido(iv)) return []
  const intervalo = iv!
  if (Array.isArray(intervalo.diaIds) && intervalo.diaIds.length > 0) {
    const set = new Set(intervalo.diaIds.map((id) => String(id || '').trim()).filter(Boolean))
    return lista.filter((d) => set.has(String(d.id || '').trim()))
  }
  const ini = normalizarDataChaveCobranca(intervalo.dataInicio)
  const fim = normalizarDataChaveCobranca(intervalo.dataFim)
  return lista.filter((d) => {
    const k = normalizarDataChaveCobranca(d.data)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return false
    return k >= ini && k <= fim
  })
}

/** Cópia do relatório especial só com os dias do intervalo (totais recalculados pelo build de itens). */
export function relatorioEspecialComDiasDoIntervalo(
  r: RelatorioEspecial,
  iv: IntervaloCobrancaEspecial | null | undefined
): RelatorioEspecial {
  if (!intervaloCobrancaValido(iv)) {
    return { ...r, diasTrabalho: [] }
  }
  return {
    ...r,
    diasTrabalho: filtrarDiasPorIntervaloCobranca(r.diasTrabalho, iv),
  }
}

export function datasCobertasPeloIntervalo(
  r: RelatorioEspecial | null | undefined,
  iv: IntervaloCobrancaEspecial | null | undefined
): string[] {
  if (!r || !intervaloCobrancaValido(iv)) return []
  const set = new Set<string>()
  for (const d of filtrarDiasPorIntervaloCobranca(r.diasTrabalho, iv)) {
    const k = normalizarDataChaveCobranca(d.data)
    if (k) set.add(k)
  }
  return Array.from(set).sort()
}

/** Aviso se dois intervalos inclusivos partilham pelo menos um dia civil do relatório. */
export function intervalosCobrancaSobrepostos(
  r: RelatorioEspecial | null | undefined,
  intervalos: IntervaloCobrancaEspecial[]
): Array<{ aId: string; bId: string; datas: string[] }> {
  const validos = (intervalos || []).filter(intervaloCobrancaValido)
  const out: Array<{ aId: string; bId: string; datas: string[] }> = []
  for (let i = 0; i < validos.length; i++) {
    const da = new Set(datasCobertasPeloIntervalo(r, validos[i]))
    for (let j = i + 1; j < validos.length; j++) {
      const db = datasCobertasPeloIntervalo(r, validos[j])
      const comum = db.filter((d) => da.has(d))
      if (comum.length > 0) {
        out.push({ aId: validos[i].id, bId: validos[j].id, datas: comum })
      }
    }
  }
  return out
}

export function buildChaveFechamentoIntervalo(
  parentRelatorioId: string,
  iv: IntervaloCobrancaEspecial
): string {
  const parent = String(parentRelatorioId || '').trim()
  if (!parent) return ''
  if (Array.isArray(iv.diaIds) && iv.diaIds.length > 0) {
    const sorted = [...iv.diaIds].map((x) => String(x || '').trim()).filter(Boolean).sort()
    return `${parent}${FECHAMENTO_INTERVALO_SEP}dias::${encodeURIComponent(sorted.join('|'))}`
  }
  const ini = normalizarDataChaveCobranca(iv.dataInicio)
  const fim = normalizarDataChaveCobranca(iv.dataFim)
  return `${parent}${FECHAMENTO_INTERVALO_SEP}${ini}_${fim}`
}

export function isChaveFechamentoIntervalo(id: string | undefined | null): boolean {
  return String(id ?? '').includes(FECHAMENTO_INTERVALO_SEP)
}

export function parseChaveFechamentoIntervalo(
  id: string | undefined | null
): { parentId: string; dataInicio: string; dataFim: string; diaIds?: string[] } | null {
  const raw = String(id ?? '')
  const ix = raw.indexOf(FECHAMENTO_INTERVALO_SEP)
  if (ix <= 0) return null
  const parentId = raw.slice(0, ix)
  const rest = raw.slice(ix + FECHAMENTO_INTERVALO_SEP.length)
  if (rest.startsWith('dias::')) {
    const encoded = rest.slice('dias::'.length)
    let decoded = encoded
    try {
      decoded = decodeURIComponent(encoded)
    } catch {
      decoded = encoded
    }
    const diaIds = decoded.split('|').map((x) => x.trim()).filter(Boolean)
    return { parentId, dataInicio: '', dataFim: '', diaIds }
  }
  const m = rest.match(/^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/)
  if (!m) return { parentId, dataInicio: '', dataFim: '' }
  return { parentId, dataInicio: m[1], dataFim: m[2] }
}

export function parentIdFechamentoPersistKey(persistKey: string | undefined | null): string {
  const raw = String(persistKey ?? '').trim()
  if (!raw) return ''
  return parseChaveFechamentoIntervalo(raw)?.parentId || raw
}

/** True se existe cobrança completa (chave = id do relatório, todos os dias). */
export function relatorioTemFechamentoCompletoNaBiblioteca(
  relatorioId: string | undefined | null,
  guardadosIds: string[] | undefined | null
): boolean {
  const id = String(relatorioId ?? '').trim()
  if (!id) return false
  return (Array.isArray(guardadosIds) ? guardadosIds : []).includes(id)
}

/** True se o relatório (id pai) tem cobrança completa ou alguma nota de intervalo na Biblioteca. */
export function relatorioTemFechamentoNaBiblioteca(
  relatorioId: string | undefined | null,
  guardadosIds: string[] | undefined | null
): boolean {
  const id = String(relatorioId ?? '').trim()
  if (!id) return false
  const list = Array.isArray(guardadosIds) ? guardadosIds : []
  if (list.includes(id)) return true
  return list.some((k) => parseChaveFechamentoIntervalo(k)?.parentId === id)
}

/** Chaves `::iv::` já guardadas para um relatório especial (várias notas de período). */
export function listarChavesIntervaloFechamento(
  parentRelatorioId: string | undefined | null,
  guardadosIds: string[] | undefined | null
): string[] {
  const id = String(parentRelatorioId ?? '').trim()
  if (!id) return []
  const list = Array.isArray(guardadosIds) ? guardadosIds : []
  return list.filter((k) => parseChaveFechamentoIntervalo(k)?.parentId === id)
}

export function formatDataCobrancaUi(dataChave: string, locale = 'pt-PT'): string {
  const k = normalizarDataChaveCobranca(dataChave)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return String(dataChave || '')
  const [y, m, d] = k.split('-').map((n) => parseInt(n, 10))
  try {
    return new Date(y, m - 1, d).toLocaleDateString(locale)
  } catch {
    return k
  }
}

export function rotuloIntervaloCobrancaEspecial(
  iv: IntervaloCobrancaEspecial,
  opts?: { locale?: string; diasCount?: number; labelDias?: string }
): string {
  const locale = opts?.locale || 'pt-PT'
  if (Array.isArray(iv.diaIds) && iv.diaIds.length > 0) {
    const n = opts?.diasCount ?? iv.diaIds.length
    const base = opts?.labelDias || '{n} dias'
    return base.replace(/\{n\}/g, String(n))
  }
  const a = formatDataCobrancaUi(iv.dataInicio, locale)
  const b = formatDataCobrancaUi(iv.dataFim, locale)
  if (a && b && a !== b) return `${a} – ${b}`
  return a || b || '—'
}

export function intervaloFromDiasSelecionados(
  dias: DiaCobrancaEspecialResumo[],
  diaIdsSelecionados: string[],
  opts: { nowMs: number; random: () => number }
): IntervaloCobrancaEspecial | null {
  const set = new Set(diaIdsSelecionados.map((x) => String(x || '').trim()).filter(Boolean))
  if (set.size === 0) return null
  const escolhidos = dias.filter((d) => set.has(d.id) && d.dataChave)
  if (escolhidos.length === 0) return null
  const chaves = escolhidos.map((d) => d.dataChave).sort()
  const min = chaves[0]
  const max = chaves[chaves.length - 1]
  /** Se todos os dias do relatório entre min e max estão selecionados → intervalo de datas; senão IDs. */
  const todasNoRange = dias.filter((d) => d.dataChave >= min && d.dataChave <= max)
  const todosSelecionadosNoRange =
    todasNoRange.length > 0 && todasNoRange.every((d) => set.has(d.id))
  const iv = criarIntervaloCobrancaEspecialVazio({
    nowMs: opts.nowMs,
    random: opts.random,
    dataInicio: min,
    dataFim: max,
  })
  if (!todosSelecionadosNoRange) {
    iv.diaIds = escolhidos.map((d) => d.id)
  }
  return iv
}

export function numeroRelatorioComIntervalo(
  numeroBase: string | undefined | null,
  iv: IntervaloCobrancaEspecial,
  opts?: { locale?: string; diasCount?: number; labelDias?: string }
): string {
  const base = String(numeroBase || '').trim() || '—'
  return `${base} · ${rotuloIntervaloCobrancaEspecial(iv, opts)}`
}

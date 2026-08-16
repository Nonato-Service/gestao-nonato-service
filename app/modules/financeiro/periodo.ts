import { diaTrabalhoDataChaveOrdenacao } from '../relatorio-servico'
import type { TipoPeriodoFinanceiro } from './tiposOs'

export function parseDataFinanceiroParaDate(raw: string | undefined | null): Date | null {
  const key = diaTrabalhoDataChaveOrdenacao(raw ?? '')
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null
  const [y, m, d] = key.split('-').map((x) => parseInt(x, 10))
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
  return new Date(y, m - 1, d)
}

export function periodoFinanceiroFromDate(
  d: Date,
  tipo: TipoPeriodoFinanceiro
): { periodo: string; dataInicio: Date; dataFim: Date } {
  const y = d.getFullYear()
  const m = d.getMonth()
  if (tipo === 'anual') {
    return {
      periodo: String(y),
      dataInicio: new Date(y, 0, 1),
      dataFim: new Date(y, 11, 31, 23, 59, 59, 999),
    }
  }
  if (tipo === 'mensal') {
    return {
      periodo: `${y}-${String(m + 1).padStart(2, '0')}`,
      dataInicio: new Date(y, m, 1),
      dataFim: new Date(y, m + 1, 0, 23, 59, 59, 999),
    }
  }
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay())
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  const weekNum = Math.ceil(
    (d.getTime() - new Date(y, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
  )
  return { periodo: `${y}-W${String(weekNum).padStart(2, '0')}`, dataInicio: start, dataFim: end }
}

export function isoWeekStringFromDate(d: Date): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function dateFromIsoWeekString(isoWeek: string): Date {
  const m = isoWeek.match(/^(\d{4})-W(\d{2})$/)
  if (!m) return new Date()
  const y = parseInt(m[1], 10)
  const w = parseInt(m[2], 10)
  const jan4 = new Date(y, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (w - 1) * 7)
  monday.setHours(12, 0, 0, 0)
  return monday
}

export function financeiroReferenciaDateFromFiltros(
  tipo: TipoPeriodoFinanceiro,
  refMes: string,
  refAno: number,
  refSemana: string
): Date {
  if (tipo === 'mensal') {
    const [y, mo] = refMes.split('-').map((x) => parseInt(x, 10))
    if (Number.isFinite(y) && Number.isFinite(mo)) return new Date(y, mo - 1, 15)
  }
  if (tipo === 'anual') return new Date(refAno, 6, 1)
  return dateFromIsoWeekString(refSemana)
}

export function dataDentroPeriodoFinanceiro(d: Date, inicio: Date, fim: Date): boolean {
  const t = d.getTime()
  return t >= inicio.getTime() && t <= fim.getTime()
}

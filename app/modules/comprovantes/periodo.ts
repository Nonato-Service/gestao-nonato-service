/** Chaves de período e formatação de datas para lista de comprovantes. */

import type { ComprovanteDespesa } from './tipos'

/** Semana do ano a partir de YYYY-MM-DD → `YYYY-Wnn`. */
export function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const start = new Date(d.getFullYear(), 0, 1)
  const dayOfYear = 1 + Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  const weekNum = Math.ceil(dayOfYear / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

/** Mês de arquivo / IRS (YYYY-MM): explícito no registo ou derivado da data do recibo. */
export function mesCompetenciaKey(c: Pick<ComprovanteDespesa, 'mesCompetencia' | 'data'>): string {
  const m = c.mesCompetencia
  if (typeof m === 'string' && /^\d{4}-\d{2}$/.test(m)) return m
  const ds = String(c.data ?? '').trim().slice(0, 10)
  const d = new Date(ds + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function anoCompetenciaKey(c: Pick<ComprovanteDespesa, 'mesCompetencia' | 'data'>): string {
  const m = mesCompetenciaKey(c)
  if (m.length >= 4) return m.slice(0, 4)
  return String(c.data ?? '').trim().slice(0, 4)
}

/** Últimos N meses YYYY-MM a partir de `now` (mês actual inclusive). */
export function mesesRollingCompetenciaKeys(count = 30, now: Date = new Date()): string[] {
  const meses: string[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return meses
}

/** Locale BCP-47 para datas na lista de comprovantes. */
export function localeListaComprovantes(selectedLanguage: string): string {
  if (selectedLanguage === 'pt-BR') return 'pt-PT'
  if (selectedLanguage === 'es') return 'es-ES'
  if (selectedLanguage === 'fr') return 'fr-FR'
  if (selectedLanguage === 'it') return 'it-IT'
  if (selectedLanguage === 'de') return 'de-DE'
  return 'en-GB'
}

export function formatarDataListaComprovante(iso: string, locale: string): string {
  if (!iso || iso === '—') return '—'
  const d = new Date(iso.slice(0, 10) + 'T12:00:00')
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
}

export type ComprovantesGrupoPorData = {
  data: string
  items: ComprovanteDespesa[]
  subtotal: number
}

/** Agrupa comprovantes filtrados por data (YYYY-MM-DD), mais recentes primeiro. */
export function agruparComprovantesPorData(filtrados: ComprovanteDespesa[]): ComprovantesGrupoPorData[] {
  const m = new Map<string, ComprovanteDespesa[]>()
  for (const c of filtrados) {
    const key = String(c.data ?? '')
      .trim()
      .slice(0, 10)
    const k = key || '—'
    if (!m.has(k)) m.set(k, [])
    m.get(k)!.push(c)
  }
  return [...m.entries()]
    .sort((a, b) => {
      if (a[0] === '—') return 1
      if (b[0] === '—') return -1
      return b[0].localeCompare(a[0])
    })
    .map(([data, items]) => ({
      data,
      items: [...items].sort((a, b) => String(b.id).localeCompare(String(a.id))),
      subtotal: items.reduce((s, x) => s + (Number(x.valorTotal) || 0), 0),
    }))
}

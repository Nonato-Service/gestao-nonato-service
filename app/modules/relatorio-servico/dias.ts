import type { DiaTrabalho } from './tipos'

/** Normaliza a data do dia para YYYY-MM-DD para ordenação. */
export function diaTrabalhoDataChaveOrdenacao(data: string | undefined): string {
  if (!data) return ''
  const s = String(data).trim()
  if (!s) return ''
  if (s.includes('T') && s.length >= 10) return s.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  const m2 = s.match(/^(\d{2})\/(\d{2})\/(\d{2})$/)
  if (m2) {
    const yy = parseInt(m2[3], 10)
    const yyyy = Number.isFinite(yy) ? 2000 + yy : 2000
    return `${yyyy}-${m2[2]}-${m2[1]}`
  }
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return s
}

export function sortDiasTrabalhoCronologicamente(dias: DiaTrabalho[]): DiaTrabalho[] {
  return [...dias].sort((a, b) => {
    const ka = diaTrabalhoDataChaveOrdenacao(a.data)
    const kb = diaTrabalhoDataChaveOrdenacao(b.data)
    const c = ka.localeCompare(kb)
    if (c !== 0) return c
    return String(a.id ?? '').localeCompare(String(b.id ?? ''))
  })
}

export function diasTrabalhoRelatorioOrdenados(relatorio: {
  diasTrabalho?: DiaTrabalho[]
}): DiaTrabalho[] {
  return sortDiasTrabalhoCronologicamente(
    Array.isArray(relatorio.diasTrabalho) ? relatorio.diasTrabalho : []
  )
}

export function normalizarDiasTrabalhoParaPersist(dias: DiaTrabalho[]): DiaTrabalho[] {
  return dias.map((dia) => {
    const key = diaTrabalhoDataChaveOrdenacao(dia.data)
    if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) return { ...dia, data: key }
    return dia
  })
}

export function formatDiaTrabalhoCurtoPt(
  dataRaw: string | undefined,
  localeTag: string = 'pt-BR'
): string {
  const key = diaTrabalhoDataChaveOrdenacao(dataRaw)
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return (dataRaw && String(dataRaw).trim()) || '-'
  const [y, m, d] = key.split('-').map((x) => parseInt(x, 10))
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return '-'
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString(localeTag, { day: '2-digit', month: '2-digit', year: '2-digit' })
}

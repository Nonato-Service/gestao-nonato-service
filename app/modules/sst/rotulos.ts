/** Rótulos e referência SST (partilhados entre texto de envio e PDF). */

export function sstRefValFromId(id: string): string {
  return `SST-${String(id).replace(/[^a-zA-Z0-9]/g, '').slice(-10).toUpperCase() || 'DOC'}`
}

export type SstUrgenciaLabels = {
  baixa?: string
  media?: string
  alta?: string
  critica?: string
}

export function rotuloNivelUrgenciaSst(
  nivel: string | undefined | null,
  labels: SstUrgenciaLabels
): string {
  if (nivel === 'baixa') return labels.baixa ?? 'Baixa'
  if (nivel === 'media') return labels.media ?? 'Média'
  if (nivel === 'alta') return labels.alta ?? 'Alta'
  if (nivel === 'critica') return labels.critica ?? 'Crítica'
  return ''
}

export type SstHorarioLabels = {
  manha?: string
  tarde?: string
  dia?: string
  noite?: string
  livre?: string
}

export function rotuloHorarioPreferidoSst(
  horarioKey: string | undefined | null,
  labels: SstHorarioLabels
): string {
  const hk = String(horarioKey || '').trim()
  if (!hk) return ''
  const map: Record<string, string> = {
    manha: labels.manha ?? '',
    tarde: labels.tarde ?? '',
    dia: labels.dia ?? '',
    noite: labels.noite ?? '',
    livre: labels.livre ?? '',
  }
  return map[hk] || hk
}

export function sstHtmlLangFromUiLanguage(selectedLanguage: string): string {
  const lang = String(selectedLanguage || '')
  if (lang === 'en' || lang.toLowerCase().startsWith('en')) return 'en'
  if (lang === 'de') return 'de'
  if (lang === 'fr') return 'fr'
  if (lang === 'it') return 'it'
  if (lang === 'es') return 'es'
  return 'pt'
}

export function formatDataSstLista(iso: string | undefined, locale: string): string {
  if (!iso) return '—'
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso.length >= 10 ? iso.slice(0, 10) : '—'
  return new Date(t).toLocaleDateString(locale)
}

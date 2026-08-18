/** Biblioteca de logos para PDFs (Administrador) — tipo e parsers puros. */

export type LogoRelatorio = {
  id: string
  name: string
  data: string
  type: 'image' | 'video'
}

/** Interpreta payload de `nonato-logos-relatorios` (array ou JSON string). */
export function parseLogosRelatoriosArr(raw: unknown): LogoRelatorio[] | null {
  let v: unknown = raw
  if (typeof v === 'string' && v.trim().startsWith('[')) {
    try {
      v = JSON.parse(v)
    } catch {
      return null
    }
  }
  return Array.isArray(v) ? (v as LogoRelatorio[]) : null
}

/**
 * Preferir a lista mais rica (maior length) ao fundir fontes
 * (localStorage / IndexedDB / cache servidor) sem apagar dados.
 */
export function preferRicherLogosRelatorios(
  current: LogoRelatorio[] | null,
  candidate: LogoRelatorio[] | null
): LogoRelatorio[] | null {
  if (!candidate || candidate.length === 0) return current
  if (!current || candidate.length > current.length) return candidate
  return current
}

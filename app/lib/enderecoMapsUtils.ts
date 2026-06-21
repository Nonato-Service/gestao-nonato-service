export type EnderecoMapsParts = {
  morada?: string
  localidade?: string
  conselho?: string
  codigoPostal?: string
  pais?: string
}

export function buildEnderecoMapsQuery(parts: EnderecoMapsParts): string {
  return [parts.morada, parts.localidade, parts.conselho, parts.codigoPostal, parts.pais]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(', ')
}

export function buildGoogleMapsSearchUrl(query: string): string {
  const q = query.trim()
  if (!q) return ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function buildGoogleMapsNavigationUrl(query: string): string {
  const q = query.trim()
  if (!q) return ''
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`
}

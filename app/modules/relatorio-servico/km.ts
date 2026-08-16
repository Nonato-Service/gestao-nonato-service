/** KM no formulário: vazio se zero; valor canónico sem zeros à esquerda. */
export function kmStringForNumberField(raw: string | undefined | null): string {
  if (raw == null) return ''
  const t = String(raw).trim().replace(',', '.')
  if (t === '') return ''
  const n = parseFloat(t)
  if (!Number.isFinite(n) || n === 0) return ''
  return String(n)
}

export function sanitizeKmFieldTyping(raw: string): string {
  if (raw === '') return ''
  let v = raw.replace(',', '.').replace(/[^\d.]/g, '')
  const firstDot = v.indexOf('.')
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '')
  }
  if (!v.includes('.')) {
    return v.replace(/^0+/, '')
  }
  const parts = v.split('.')
  const intPart = parts[0] ?? ''
  const fracPart = parts.slice(1).join('.')
  let ai = intPart.replace(/^0+/, '')
  if (ai === '' && (fracPart !== '' || v.endsWith('.'))) {
    ai = '0'
  }
  if (v.endsWith('.') && fracPart === '') {
    return `${ai}.`
  }
  return fracPart !== '' ? `${ai}.${fracPart}` : ai
}

export function normalizeKmForPersist(raw: string | undefined): string {
  const t = (raw ?? '').trim().replace(',', '.')
  if (t === '') return ''
  const n = parseFloat(t)
  if (!Number.isFinite(n) || n === 0) return ''
  return String(n)
}

export function isKmFieldEmpty(raw: string | undefined | null): boolean {
  return kmStringForNumberField(raw) === ''
}

export function getKmPadraoDoCliente(cliente?: {
  kmIdaPadrao?: string
  kmRetornoPadrao?: string
} | null): { kmIda: string; kmRetorno: string } {
  return {
    kmIda: kmStringForNumberField(cliente?.kmIdaPadrao),
    kmRetorno: kmStringForNumberField(cliente?.kmRetornoPadrao),
  }
}

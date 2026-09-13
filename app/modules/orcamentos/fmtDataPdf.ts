/** Data de documento no PDF de orçamento. Relógio injectado (`nowMs`) se a data vier vazia. */

export function fmtDataPdf(iso: string | undefined, nowMs: number): string {
  if (!iso) return new Date(nowMs).toLocaleDateString('pt-PT')
  try {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
    return d.toLocaleDateString('pt-PT')
  } catch {
    return iso
  }
}

/** Localizar PDF de secção Elétrica / Mecânica dentro de um ZIP de manual. */

export type ManualSection = 'eletrica' | 'mecanica'

/** PDF de secção Elétrica / Mecânica dentro do ZIP (HOMAG / Movecho). */
export function findManualSectionPdf(entryPaths: string[], section: ManualSection): string | null {
  const pdfs = entryPaths.filter((p) => /\.pdf$/i.test(p))
  const folderRes =
    section === 'eletrica'
      ? /^(elektr|eletric|electric|elektro|el)$/i
      : /^(mechan|mecan|mechanik|mk)$/i
  const pathRes =
    section === 'eletrica'
      ? /elektr|eletric|electric|elektro|(^|[\\/])el[\.\-_/\\]/i
      : /mechan|mecan|mechanik|(^|[\\/])mk[\.\-_/\\]/i

  const inSection = pdfs.filter((p) => {
    const parts = p.split(/[/\\]/)
    if (parts.some((part) => folderRes.test(part))) return true
    return pathRes.test(p)
  })

  if (inSection.length === 0) return null

  const indexInSection = inSection.find((p) => /index\.pdf$/i.test(p))
  if (indexInSection) return indexInSection

  inSection.sort(
    (a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b, undefined, { sensitivity: 'base' })
  )
  return inSection[0]
}

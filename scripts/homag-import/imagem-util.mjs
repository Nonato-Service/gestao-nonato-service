/** Utilitários partilhados — o que conta como «sem foto» na HOMAG/biblioteca. */

export const HOMAG_PLACEHOLDER_RE = /default-product-image\.svg/i

export function isHomagPlaceholderImagem(imagem) {
  const s = String(imagem ?? '').trim()
  if (!s) return false
  return HOMAG_PLACEHOLDER_RE.test(s)
}

/** Peça export/resume precisa de foto real (vazia ou só placeholder HOMAG). */
export function homagExportItemPrecisaFoto(item) {
  const img = String(item?.imagem ?? item?.imagem_url ?? '').trim()
  if (!img) return true
  if (isHomagPlaceholderImagem(img)) return true
  return false
}

/** Entrada da biblioteca JSON precisa de foto real. */
export function bibliotecaPecaPrecisaFoto(imagem) {
  const s = String(imagem ?? '').trim()
  if (!s) return true
  if (isHomagPlaceholderImagem(s)) return true
  return false
}

/**
 * I/O de canvas — compressão de imagem canónica (anexos do diário / fatura / stock).
 */

const MAX_W = 1400
const MAX_H = 1400
const QUALITY_START = 0.82
const QUALITY_MIN = 0.48
const QUALITY_STEP = 0.06
const MAX_DATA_URL_LEN = 960_000

/** Limite agressivo para POST de stock (evita HTTP 413 no Railway). */
const STOCK_SYNC_MAX_W = 720
const STOCK_SYNC_MAX_H = 720
const STOCK_SYNC_QUALITY_START = 0.72
const STOCK_SYNC_QUALITY_MIN = 0.32
const STOCK_SYNC_MAX_DATA_URL_LEN = 160_000

type CompressOpts = {
  maxW: number
  maxH: number
  qualityStart: number
  qualityMin: number
  qualityStep: number
  maxDataUrlLen: number
}

const DEFAULT_OPTS: CompressOpts = {
  maxW: MAX_W,
  maxH: MAX_H,
  qualityStart: QUALITY_START,
  qualityMin: QUALITY_MIN,
  qualityStep: QUALITY_STEP,
  maxDataUrlLen: MAX_DATA_URL_LEN,
}

const STOCK_SYNC_OPTS: CompressOpts = {
  maxW: STOCK_SYNC_MAX_W,
  maxH: STOCK_SYNC_MAX_H,
  qualityStart: STOCK_SYNC_QUALITY_START,
  qualityMin: STOCK_SYNC_QUALITY_MIN,
  qualityStep: QUALITY_STEP,
  maxDataUrlLen: STOCK_SYNC_MAX_DATA_URL_LEN,
}

async function compressViaCanvas(file: File, opts: CompressOpts): Promise<string> {
  const bmp = await createImageBitmap(file)
  try {
    const { width: w, height: h } = bmp
    const scale = Math.min(1, opts.maxW / Math.max(1, w), opts.maxH / Math.max(1, h))
    const tw = Math.max(1, Math.round(w * scale))
    const th = Math.max(1, Math.round(h * scale))
    if (typeof document === 'undefined') throw new Error('no document')
    const canvas = document.createElement('canvas')
    canvas.width = tw
    canvas.height = th
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas')
    ctx.drawImage(bmp, 0, 0, tw, th)
    let quality = opts.qualityStart
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    while (dataUrl.length > opts.maxDataUrlLen && quality > opts.qualityMin) {
      quality -= opts.qualityStep
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }
    return dataUrl
  } finally {
    bmp.close()
  }
}

/**
 * Redimensiona e comprime uma imagem para data-URL JPEG,
 * limitando resolução e tamanho aproximado do payload.
 */
/** Comprime fotos já gravadas (stock) quando o data-URL é grande demais para sincronizar. */
export async function compressImageDataUrlIfNeeded(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:image/') || dataUrl.length <= MAX_DATA_URL_LEN) return dataUrl
  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], 'peca.jpg', { type: blob.type || 'image/jpeg' })
  return compressImageFileToJpegDataUrl(file)
}

/**
 * Compressão agressiva para sync de stock (5–19 peças com fotos → caber no POST).
 * Sempre re-comprime data-URLs acima de `maxLen` (default 160 KB).
 */
export async function compressStockImageDataUrlForSync(
  dataUrl: string,
  maxLen = STOCK_SYNC_MAX_DATA_URL_LEN
): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) return dataUrl
  if (dataUrl.length <= maxLen) return dataUrl
  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], 'stock.jpg', { type: blob.type || 'image/jpeg' })
  const opts = { ...STOCK_SYNC_OPTS, maxDataUrlLen: maxLen }
  let out = await compressViaCanvas(file, opts)
  // Segunda passagem se ainda enorme (fotos 4K / PNG).
  if (out.length > maxLen * 1.5) {
    const blob2 = await (await fetch(out)).blob()
    const file2 = new File([blob2], 'stock2.jpg', { type: 'image/jpeg' })
    out = await compressViaCanvas(file2, {
      ...opts,
      maxW: 480,
      maxH: 480,
      qualityStart: 0.55,
      qualityMin: 0.28,
    })
  }
  return out
}

export async function compressImageFileToJpegDataUrl(file: File): Promise<string> {
  return compressViaCanvas(file, DEFAULT_OPTS)
}

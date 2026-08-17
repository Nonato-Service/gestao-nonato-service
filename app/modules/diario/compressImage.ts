/** Comprime ficheiro de imagem para JPEG data-URL (anexos do diário). */

const MAX_W = 1400
const MAX_H = 1400
const QUALITY_START = 0.82
const QUALITY_MIN = 0.48
const QUALITY_STEP = 0.06
const MAX_DATA_URL_LEN = 960_000

/**
 * Redimensiona e comprime uma imagem para data-URL JPEG,
 * limitando resolução e tamanho aproximado do payload.
 */
export async function compressImageFileToJpegDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file)
  try {
    let { width: w, height: h } = bmp
    const scale = Math.min(1, MAX_W / Math.max(1, w), MAX_H / Math.max(1, h))
    const tw = Math.max(1, Math.round(w * scale))
    const th = Math.max(1, Math.round(h * scale))
    if (typeof document === 'undefined') throw new Error('no document')
    const canvas = document.createElement('canvas')
    canvas.width = tw
    canvas.height = th
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas')
    ctx.drawImage(bmp, 0, 0, tw, th)
    let quality = QUALITY_START
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    while (dataUrl.length > MAX_DATA_URL_LEN && quality > QUALITY_MIN) {
      quality -= QUALITY_STEP
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }
    return dataUrl
  } finally {
    bmp.close()
  }
}

/** Marca d'água do PDF de protocolo — só o desenho, sem fundo branco do PNG */

const PROTOCOLO_WATERMARK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 15 250 290"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#22c55e"/><stop offset="100%" stop-color="#15803d"/></linearGradient></defs><path d="M248 78C272 118 284 162 276 206C266 252 228 286 182 298C132 310 78 292 48 252C18 212 12 154 34 104C56 54 108 22 162 24C198 26 228 44 248 78" fill="none" stroke="url(#g1)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/><g transform="translate(118 168)"><circle r="46" fill="url(#g1)"/><circle r="18" fill="#ecfdf5"/><g fill="url(#g1)"><rect x="-7" y="-58" width="14" height="18" rx="3"/><rect x="-7" y="40" width="14" height="18" rx="3"/><rect x="-58" y="-7" width="18" height="14" rx="3"/><rect x="40" y="-7" width="18" height="14" rx="3"/><rect x="-41" y="-41" width="14" height="18" rx="3" transform="rotate(-45)"/><rect x="27" y="27" width="14" height="18" rx="3" transform="rotate(-45)"/><rect x="27" y="-41" width="14" height="18" rx="3" transform="rotate(45)"/><rect x="-41" y="27" width="14" height="18" rx="3" transform="rotate(45)"/></g></g><g transform="translate(196 108)"><circle r="30" fill="url(#g1)"/><circle r="11" fill="#ecfdf5"/><g fill="url(#g1)"><rect x="-5" y="-38" width="10" height="12" rx="2"/><rect x="-5" y="26" width="10" height="12" rx="2"/><rect x="-38" y="-5" width="12" height="10" rx="2"/><rect x="26" y="-5" width="12" height="10" rx="2"/></g></g></svg>'

export const PROTOCOLO_WATERMARK_FALLBACK_DATA_URI = `data:image/svg+xml,${encodeURIComponent(PROTOCOLO_WATERMARK_SVG)}`

export function extractImgSrcFromLogoHtml(logoHtml: string): string {
  const m = String(logoHtml || '').match(/\ssrc\s*=\s*(["'])([\s\S]*?)\1/i)
  return m?.[2]?.trim() || ''
}

function isBackgroundPixel(r: number, g: number, b: number, threshold: number): boolean {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max === 0 ? 0 : (max - min) / max
  if (max >= threshold && sat < 0.14) return true
  return r >= threshold && g >= threshold && b >= threshold
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('logo watermark load failed'))
    img.src = src
  })
}

/** Remove fundo branco/claro do PNG — fica só o desenho com transparência */
export async function stripLogoBackgroundForWatermark(
  src: string,
  threshold = 236
): Promise<string> {
  if (typeof document === 'undefined') return src
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')
  if (!ctx || canvas.width < 1 || canvas.height < 1) return src

  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    if (isBackgroundPixel(d[i], d[i + 1], d[i + 2], threshold)) {
      d[i + 3] = 0
    }
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

/** Prepara URL da marca d'água: logo do admin sem fundo, ou SVG de fallback */
export async function prepareProtocoloWatermarkSrc(logoHtml: string): Promise<string> {
  const raw = extractImgSrcFromLogoHtml(logoHtml)
  if (!raw) return PROTOCOLO_WATERMARK_FALLBACK_DATA_URI
  if (typeof document === 'undefined') return raw
  try {
    return await stripLogoBackgroundForWatermark(raw)
  } catch {
    return raw.startsWith('data:') ? raw : PROTOCOLO_WATERMARK_FALLBACK_DATA_URI
  }
}

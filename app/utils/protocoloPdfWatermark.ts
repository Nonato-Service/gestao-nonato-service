/** Marca d'água do PDF de protocolo — só o desenho, sem fundo branco do PNG */

const PROTOCOLO_WATERMARK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 15 250 290"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#22c55e"/><stop offset="100%" stop-color="#15803d"/></linearGradient></defs><path d="M248 78C272 118 284 162 276 206C266 252 228 286 182 298C132 310 78 292 48 252C18 212 12 154 34 104C56 54 108 22 162 24C198 26 228 44 248 78" fill="none" stroke="url(#g1)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/><g transform="translate(118 168)"><circle r="46" fill="url(#g1)"/><circle r="18" fill="#ecfdf5"/><g fill="url(#g1)"><rect x="-7" y="-58" width="14" height="18" rx="3"/><rect x="-7" y="40" width="14" height="18" rx="3"/><rect x="-58" y="-7" width="18" height="14" rx="3"/><rect x="40" y="-7" width="18" height="14" rx="3"/><rect x="-41" y="-41" width="14" height="18" rx="3" transform="rotate(-45)"/><rect x="27" y="27" width="14" height="18" rx="3" transform="rotate(-45)"/><rect x="27" y="-41" width="14" height="18" rx="3" transform="rotate(45)"/><rect x="-41" y="27" width="14" height="18" rx="3" transform="rotate(45)"/></g></g><g transform="translate(196 108)"><circle r="30" fill="url(#g1)"/><circle r="11" fill="#ecfdf5"/><g fill="url(#g1)"><rect x="-5" y="-38" width="10" height="12" rx="2"/><rect x="-5" y="26" width="10" height="12" rx="2"/><rect x="-38" y="-5" width="12" height="10" rx="2"/><rect x="26" y="-5" width="12" height="10" rx="2"/></g></g></svg>'

export const PROTOCOLO_WATERMARK_FALLBACK_DATA_URI = `data:image/svg+xml,${encodeURIComponent(PROTOCOLO_WATERMARK_SVG)}`

export function extractImgSrcFromLogoHtml(logoHtml: string): string {
  const m = String(logoHtml || '').match(/\ssrc\s*=\s*(["'])([\s\S]*?)\1/i)
  return m?.[2]?.trim() || ''
}

type Rgb = { r: number; g: number; b: number }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('logo watermark load failed'))
    img.src = src
  })
}

function sampleCornerColor(data: Uint8ClampedArray, width: number, height: number): Rgb {
  const pts: Array<[number, number]> = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [0, Math.floor(height / 2)],
  ]
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (const [x, y] of pts) {
    const i = (y * width + x) * 4
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
    n += 1
  }
  return { r: r / n, g: g / n, b: b / n }
}

function colorDistance(r: number, g: number, b: number, c: Rgb): number {
  return Math.abs(r - c.r) + Math.abs(g - c.g) + Math.abs(b - c.b)
}

function isBgLike(r: number, g: number, b: number, corner: Rgb, tol: number): boolean {
  if (colorDistance(r, g, b, corner) <= tol) return true
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max === 0 ? 0 : (max - min) / max
  return max >= 205 && sat < 0.22
}

/** Remove todos os pixels claros (não só os ligados à borda) — elimina retângulo branco interno */
function removeAllBackgroundPixels(data: Uint8ClampedArray, corner: Rgb, tol: number): void {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 8) continue
    if (isBgLike(data[i], data[i + 1], data[i + 2], corner, tol)) {
      data[i + 3] = 0
    }
  }
}

function countOpaqueBackgroundPixels(data: Uint8ClampedArray, corner: Rgb, tol: number): { bg: number; total: number } {
  let bg = 0
  let total = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 20) continue
    total += 1
    if (isBgLike(data[i], data[i + 1], data[i + 2], corner, tol)) bg += 1
  }
  return { bg, total }
}

/** Remove fundo ligado às bordas (flood fill) — típico de PNG com retângulo branco */
function floodFillEdgeBackground(data: Uint8ClampedArray, width: number, height: number, corner: Rgb, tol: number): void {
  const visited = new Uint8Array(width * height)
  const stack: number[] = []

  const tryPush = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const pi = y * width + x
    if (visited[pi]) return
    const i = pi * 4
    if (!isBgLike(data[i], data[i + 1], data[i + 2], corner, tol)) return
    visited[pi] = 1
    stack.push(pi)
  }

  for (let x = 0; x < width; x++) {
    tryPush(x, 0)
    tryPush(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y)
    tryPush(width - 1, y)
  }

  while (stack.length) {
    const pi = stack.pop()!
    const i = pi * 4
    data[i + 3] = 0
    const x = pi % width
    const y = (pi / width) | 0
    tryPush(x - 1, y)
    tryPush(x + 1, y)
    tryPush(x, y - 1)
    tryPush(x, y + 1)
  }
}

function trimTransparentBounds(data: Uint8ClampedArray, width: number, height: number) {
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let visible = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3]
      if (a > 12) {
        visible += 1
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  if (!visible) return null
  return { minX, minY, maxX, maxY, visible }
}

function cropCanvasToBounds(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): HTMLCanvasElement {
  const w = bounds.maxX - bounds.minX + 1
  const h = bounds.maxY - bounds.minY + 1
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const octx = out.getContext('2d')
  if (!octx) return canvas
  octx.drawImage(canvas, bounds.minX, bounds.minY, w, h, 0, 0, w, h)
  return out
}

/** Logos verticais (ícone + texto): usa só a parte superior com o desenho */
function cropTopIconRegion(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): HTMLCanvasElement {
  const w = canvas.width
  const h = canvas.height
  if (h / w < 1.12) return canvas
  const cropH = Math.max(1, Math.round(h * 0.52))
  const out = document.createElement('canvas')
  out.width = w
  out.height = cropH
  const octx = out.getContext('2d')
  if (!octx) return canvas
  octx.drawImage(canvas, 0, 0, w, cropH, 0, 0, w, cropH)
  return out
}

/** Remove fundo branco/claro — flood fill + recorte; fallback se falhar */
export async function stripLogoBackgroundForWatermark(src: string): Promise<string> {
  if (typeof document === 'undefined') return PROTOCOLO_WATERMARK_FALLBACK_DATA_URI
  const img = await loadImage(src)
  let canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  let ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx || canvas.width < 2 || canvas.height < 2) return PROTOCOLO_WATERMARK_FALLBACK_DATA_URI

  ctx.drawImage(img, 0, 0)
  canvas = cropTopIconRegion(canvas, ctx)
  ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return PROTOCOLO_WATERMARK_FALLBACK_DATA_URI

  const width = canvas.width
  const height = canvas.height
  const imageData = ctx.getImageData(0, 0, width, height)
  const d = imageData.data
  const corner = sampleCornerColor(d, width, height)

  floodFillEdgeBackground(d, width, height, corner, 48)
  removeAllBackgroundPixels(d, corner, 44)

  const remain = countOpaqueBackgroundPixels(d, corner, 38)
  if (remain.total > 0 && remain.bg / remain.total > 0.06) {
    return PROTOCOLO_WATERMARK_FALLBACK_DATA_URI
  }

  ctx.putImageData(imageData, 0, 0)
  const bounds = trimTransparentBounds(d, width, height)
  if (!bounds || bounds.visible < width * height * 0.004) {
    return PROTOCOLO_WATERMARK_FALLBACK_DATA_URI
  }

  const trimmed = cropCanvasToBounds(canvas, ctx, bounds)
  const tctx = trimmed.getContext('2d', { willReadFrequently: true })
  if (!tctx) return PROTOCOLO_WATERMARK_FALLBACK_DATA_URI
  const td = tctx.getImageData(0, 0, trimmed.width, trimmed.height).data
  const after = countOpaqueBackgroundPixels(td, corner, 38)
  if (after.total > 0 && after.bg / after.total > 0.04) {
    return PROTOCOLO_WATERMARK_FALLBACK_DATA_URI
  }
  return trimmed.toDataURL('image/png')
}

/** Prepara URL da marca d'água: tenta logo do admin sem fundo; se restar branco, SVG só engrenagens */
export async function prepareProtocoloWatermarkSrc(logoHtml: string): Promise<string> {
  if (typeof document === 'undefined') return PROTOCOLO_WATERMARK_FALLBACK_DATA_URI
  const raw = extractImgSrcFromLogoHtml(logoHtml)
  if (!raw || /^data:image\/jpe?g/i.test(raw)) {
    return PROTOCOLO_WATERMARK_FALLBACK_DATA_URI
  }
  try {
    const stripped = await stripLogoBackgroundForWatermark(raw)
    if (!stripped || stripped === PROTOCOLO_WATERMARK_FALLBACK_DATA_URI) {
      return PROTOCOLO_WATERMARK_FALLBACK_DATA_URI
    }
    return stripped
  } catch {
    return PROTOCOLO_WATERMARK_FALLBACK_DATA_URI
  }
}

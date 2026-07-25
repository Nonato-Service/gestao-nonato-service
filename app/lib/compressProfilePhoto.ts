const MAX_BYTES = 420_000
const MAX_EDGE = 480
const JPEG_QUALITY = 0.86

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image_load_failed'))
    }
    img.src = url
  })
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL('image/jpeg', quality)
}

/** Redimensiona e comprime foto de perfil para base64 JPEG (~400 KB máx.). */
export async function compressProfilePhotoFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('invalid_image_type')
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('file_too_large')
  }

  const img = await loadImageFromFile(file)
  let w = img.naturalWidth || img.width
  let h = img.naturalHeight || img.height
  if (w < 1 || h < 1) throw new Error('invalid_dimensions')

  const scale = Math.min(1, MAX_EDGE / Math.max(w, h))
  w = Math.max(1, Math.round(w * scale))
  h = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas_unavailable')
  ctx.drawImage(img, 0, 0, w, h)

  let quality = JPEG_QUALITY
  let dataUrl = canvasToJpeg(canvas, quality)
  while (dataUrl.length > MAX_BYTES && quality > 0.45) {
    quality -= 0.08
    dataUrl = canvasToJpeg(canvas, quality)
  }
  return dataUrl
}

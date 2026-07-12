/**
 * Imagens HOMAG — ficheiro por código + nome, download com Referer correcto.
 */
import fs from 'fs'
import path from 'path'

export const HOMAG_ORIGIN = 'https://shop.homag.com'

export function decodeHtmlText(s) {
  return String(s || '')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function slugPart(s) {
  return (
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 55) || ''
  )
}

/** Nome de ficheiro: 2201663021_SUCTION_CUP_... */
export function imageFileBase(codigo, nome) {
  const c = slugPart(codigo)
  const n = slugPart(nome)
  if (!c) return 'item'
  if (!n || n === c) return c
  return `${c}_${n}`.slice(0, 100)
}

export function imageExtFromUrl(url) {
  const u = String(url || '').toLowerCase()
  if (u.includes('.webp')) return '.webp'
  if (u.includes('.jpg') || u.includes('jpeg')) return '.jpg'
  if (u.includes('.gif')) return '.gif'
  return '.png'
}

export function absHomagUrl(url, origin = HOMAG_ORIGIN) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return `${origin}${url}`
  return url
}

export async function downloadHomagImage(context, url, filePath, referer = HOMAG_ORIGIN) {
  if (!url || !url.startsWith('http')) return false
  const headers = {
    Referer: referer,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  }
  try {
    const r = await context.request.get(url, { headers })
    if (r.ok()) {
      fs.writeFileSync(filePath, await r.body())
      return true
    }
  } catch {
    /* fallback fetch */
  }
  try {
    const r2 = await fetch(url, { headers })
    if (!r2.ok) return false
    fs.writeFileSync(filePath, Buffer.from(await r2.arrayBuffer()))
    return true
  } catch {
    return false
  }
}

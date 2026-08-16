/** Parse de catálogo a partir de HTML (DOMParser). */

import {
  looksLikeHomagClipboard,
  matchHomagCodeLine,
  mergeHomagClipboardItems,
  parseHomagPlainTextCatalog,
} from '../../lib/parseHomagClipboard'
import { pushIfValidCatalogItem } from './importParsePlain'

const decodeHtmlUrl = (u: string) =>
  u.trim().replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#38;/g, '&')

const extractBackgroundImageFromStyle = (styleVal: string): string => {
  if (!styleVal) return ''
  const m = styleVal.match(/background-image\s*:\s*url\(\s*["']?([^"')]+)["']?\s*\)/i)
  if (!m?.[1]) return ''
  const u = decodeHtmlUrl(m[1])
  if (u.startsWith('data:') || u.startsWith('blob:')) return ''
  return u
}

/** Extrai URL de imagem: img (lazy-load), picture, background CSS, link para .jpg, etc. */
const extractImgSrcFromNode = (root: Element | null): string => {
  if (!root || typeof (root as Element).querySelector !== 'function') return ''

  const styleAttr = (root as HTMLElement).getAttribute('style') || ''
  const bgRoot = extractBackgroundImageFromStyle(styleAttr)
  if (bgRoot) return bgRoot.startsWith('//') ? `https:${bgRoot}` : bgRoot

  const pic = root.querySelector('picture source[srcset], picture source[src]') as HTMLSourceElement | null
  if (pic) {
    const ss = pic.getAttribute('srcset') || pic.getAttribute('src') || ''
    const first = ss.split(',')[0]?.trim().split(/\s+/)[0]
    if (first && !first.startsWith('data:') && !first.startsWith('blob:')) {
      const d = decodeHtmlUrl(first)
      return d.startsWith('//') ? `https:${d}` : d
    }
  }

  const link = root.querySelector(
    'a[href*=".jpg" i],a[href*=".jpeg" i],a[href*=".png" i],a[href*=".webp" i],a[href*=".gif" i],a[href*=".svg" i]'
  ) as HTMLAnchorElement | null
  if (link?.href && !link.href.startsWith('data:') && !link.href.startsWith('blob:')) return link.href

  const img = root.querySelector('img') as HTMLImageElement | null
  if (img) {
    const attrs = [
      'src',
      'data-src',
      'data-lazy-src',
      'data-original',
      'data-url',
      'data-image',
      'data-image-url',
      'data-lazy',
      'data-zoom-image',
      'data-large_image_url',
      'data-full-src',
      'data-img',
      'data-full-url',
      'data-href',
      'data-photosrc',
      'data-aura-rendered-src',
    ]
    for (const attr of attrs) {
      const v = img.getAttribute(attr)
      if (v && v.trim() && !v.startsWith('data:') && !v.startsWith('blob:')) {
        let decoded = decodeHtmlUrl(v)
        if (decoded.startsWith('//')) return `https:${decoded}`
        return decoded
      }
    }
    const lazySrcset = img.getAttribute('data-lazy-srcset') || img.getAttribute('data-srcset')
    const srcset = img.getAttribute('srcset') || lazySrcset
    if (srcset) {
      const candidates = srcset
        .split(',')
        .map((p) => p.trim().split(/\s+/)[0])
        .filter(Boolean)
      for (const first of candidates) {
        if (first && !first.startsWith('data:') && !first.startsWith('blob:')) {
          const decoded = decodeHtmlUrl(first)
          return decoded.startsWith('//') ? `https:${decoded}` : decoded
        }
      }
    }
  }

  const bgNode = root.querySelector('[style*="background"]')
  if (bgNode) {
    const s = (bgNode as HTMLElement).getAttribute('style') || ''
    const u = extractBackgroundImageFromStyle(s)
    if (u) return u.startsWith('//') ? `https:${u}` : u
  }

  return ''
}

/** Extrai itens brutos de HTML (tabelas, cards, scripts JSON, fallback HOMAG/texto). */
export function parseRawCatalogItensHtml(
  raw: string,
  lojaOrigin: string,
  pageBaseHref: string
): any[] {
  let itens: any[] = []
  const pushIfValid = (obj: any) => pushIfValidCatalogItem(itens, obj)

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(raw, 'text/html')
    const baseHref = (doc.querySelector('base[href]') as HTMLBaseElement | null)?.href || ''
    const documentBase = baseHref || pageBaseHref || (lojaOrigin ? `${lojaOrigin}/` : '')

    const resolveUrl = (u: string): string => {
      if (!u) return ''
      const t = u.trim().replace(/&amp;/g, '&')
      if (!t || t.startsWith('data:') || t.startsWith('blob:')) return t
      try {
        if (t.startsWith('//')) return `https:${t}`
        if (documentBase) return new URL(t, documentBase).href
        if (t.startsWith('/') && lojaOrigin) return new URL(t, `${lojaOrigin}/`).href
        return t
      } catch {
        return t
      }
    }

    const isJunkImgUrl = (src: string): boolean => {
      const s = src.toLowerCase()
      if (!s || s.length < 10) return true
      if (/spacer|blank\.|clear\.gif|pixel\.|1x1|transparent|placeholder|loading\.svg|s\.gif|w\.gif/i.test(s))
        return true
      return false
    }
    const firstValidImgInRow = (row: Element): string => {
      for (const node of row.querySelectorAll('img')) {
        const s = extractImgSrcFromNode(node)
        if (s && !isJunkImgUrl(s)) return s
      }
      return ''
    }

    // 1) Tentar tabelas HTML comuns
    const rows = Array.from(doc.querySelectorAll('table tr'))
    rows.forEach((row) => {
      const cellEls = Array.from(row.querySelectorAll('th,td'))
      const cells = cellEls.map((c) => (c.textContent || '').trim())
      let imagem =
        firstValidImgInRow(row) ||
        cellEls.map((c) => extractImgSrcFromNode(c)).find((src) => src && !isJunkImgUrl(src)) ||
        (() => {
          const s = extractImgSrcFromNode(row)
          return s && !isJunkImgUrl(s) ? s : ''
        })()
      if (imagem) imagem = resolveUrl(imagem)
      if (!imagem) {
        for (const c of cellEls) {
          const html = typeof (c as HTMLElement).innerHTML === 'string' ? (c as HTMLElement).innerHTML : ''
          const abs = html.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif|svg)(?:\?[^\s"'<>]*)?/i)
          if (abs) {
            imagem = resolveUrl(abs[0])
            break
          }
          const proto = html.match(/\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif|svg)(?:\?[^\s"'<>]*)?/i)
          if (proto) {
            imagem = resolveUrl(`https:${proto[0]}`)
            break
          }
          const srcRel = html.match(/\bsrc\s*=\s*["']([^"']+)["']/i)
          if (srcRel?.[1]) {
            const cand = srcRel[1].replace(/&amp;/g, '&').trim()
            if (cand) imagem = resolveUrl(cand.startsWith('//') ? `https:${cand}` : cand)
            if (imagem && !isJunkImgUrl(imagem)) break
            imagem = ''
          }
        }
      }
      const texts = cells.map((t) => t.trim()).filter(Boolean)
      if (texts.length < 2 && !imagem) return
      const joined = cells.join(' ').toLowerCase()
      if (
        joined.includes('código') ||
        joined.includes('codigo') ||
        joined.includes('part') ||
        joined.includes('refer') ||
        joined.includes('preço') ||
        joined.includes('preco') ||
        joined.includes('descr')
      ) {
        return // linha provável de cabeçalho
      }
      pushIfValid({
        codigo: texts[0] || '',
        nome: texts[1] || texts[0] || '',
        descricao: texts[2] || texts[1] || '',
        preco: cells.find((c) => /(\d+[.,]\d{2})/.test(c)) || '',
        imagem,
      })
    })

    // 2) Tentar estruturas comuns em cards/listas de e-commerce
    if (itens.length === 0) {
      const cardSelectors = [
        '[data-part-number]',
        '[data-product-code]',
        '[data-sku]',
        '.product-item',
        '.product-card',
        '.slds-card',
      ]
      const cards = Array.from(doc.querySelectorAll(cardSelectors.join(',')))
      cards.forEach((card) => {
        const codeAttr =
          (card as HTMLElement).getAttribute('data-part-number') ||
          (card as HTMLElement).getAttribute('data-product-code') ||
          (card as HTMLElement).getAttribute('data-sku') ||
          ''
        const text = (card.textContent || '').replace(/\s+/g, ' ').trim()
        const mCode = text.match(/\b([A-Z0-9][A-Z0-9\-_.\/]{3,})\b/)
        const mPrice = text.match(/(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{2})\s?(?:€|eur)?)/i)
        const titleEl = card.querySelector('h1,h2,h3,h4,.title,.name,[data-name],[data-title]')
        let imagem = extractImgSrcFromNode(card)
        if (imagem) imagem = resolveUrl(imagem)
        pushIfValid({
          codigo: codeAttr || (mCode ? mCode[1] : ''),
          nome: (titleEl?.textContent || '').trim() || text.slice(0, 140),
          descricao: text,
          preco: mPrice ? mPrice[1] : '',
          imagem,
        })
      })
    }

    // 3) Tentar scripts com JSON embutido
    if (itens.length === 0) {
      const scripts = Array.from(doc.querySelectorAll('script'))
      scripts.forEach((s) => {
        const txt = (s.textContent || '').trim()
        if (!txt) return
        // Captura candidatos JSON com chaves comuns de catálogo.
        const candidates = [
          ...(txt.match(/\{[\s\S]*?"(?:parts|items|products|pecas|data)"[\s\S]*?\}/gi) || []),
          ...(txt.match(/\[[\s\S]*?\]/g) || []),
        ]
        for (const candidate of candidates) {
          try {
            const parsed = JSON.parse(candidate)
            if (Array.isArray(parsed)) {
              parsed.forEach(pushIfValid)
            } else if (parsed && typeof parsed === 'object') {
              const arr =
                (Array.isArray((parsed as any).pecas) && (parsed as any).pecas) ||
                (Array.isArray((parsed as any).parts) && (parsed as any).parts) ||
                (Array.isArray((parsed as any).items) && (parsed as any).items) ||
                (Array.isArray((parsed as any).products) && (parsed as any).products) ||
                (Array.isArray((parsed as any).data) && (parsed as any).data) ||
                null
              if (arr) arr.forEach(pushIfValid)
            }
          } catch {
            // ignorar trecho não-JSON
          }
        }
      })
    }

    // 4) Fallback: texto visível da página (sites com HTML vazio mas texto copiado)
    if (itens.length === 0) {
      const textFromHtml = (doc.body?.innerText || doc.body?.textContent || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\r/g, '')
        .trim()
      if (textFromHtml.length >= 12) {
        if (looksLikeHomagClipboard(textFromHtml)) {
          itens = parseHomagPlainTextCatalog(textFromHtml)
        } else {
          const innerLines = textFromHtml
            .split(/\n/)
            .map((l) => l.trim())
            .filter(Boolean)
          if (innerLines.length >= 2) {
            let homagBuf: string[] = []
            for (const line of innerLines) {
              const codigoHomag = matchHomagCodeLine(line)
              if (codigoHomag) {
                if (homagBuf.length) {
                  pushIfValid({
                    codigo: codigoHomag,
                    nome: homagBuf[0],
                    descricao: homagBuf.slice(1).join(' ').trim() || homagBuf[0],
                  })
                  homagBuf = []
                }
              } else {
                homagBuf.push(line)
              }
            }
          }
        }
      }
    }
    if (itens.length > 0 && looksLikeHomagClipboard(doc.body?.innerText || '')) {
      const homagFromText = parseHomagPlainTextCatalog(doc.body?.innerText || '')
      if (homagFromText.length > itens.length) {
        itens = homagFromText
      } else if (homagFromText.length > 0) {
        itens = mergeHomagClipboardItems(
          itens.map((x) => ({
            codigo: String(x?.codigo ?? ''),
            nome: String(x?.nome ?? x?.name ?? ''),
            descricao: String(x?.descricao ?? x?.description ?? ''),
            preco: x?.preco != null ? String(x.preco) : undefined,
            imagem: x?.imagem != null ? String(x.imagem) : undefined,
          })),
          homagFromText
        )
      }
    }
  } catch {
    // segue para retorno vazio caso não consiga analisar HTML
  }

  return itens
}

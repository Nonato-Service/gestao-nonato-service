/**
 * Deteção HOMAG — nós folha com código 10 dígitos (ordenados por posição vertical).
 */

export async function discoverHomagProducts(page) {
  await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {})
  await page.waitForTimeout(400)
  return page.evaluate(() => {
    const items = []
    const seen = new Set()
    const CODE_RE = /^([1-9]\d{9})$/

    function push(codigo, nome, imagemUrl, top = 0) {
      const c = String(codigo || '')
        .trim()
        .replace(/\s+/g, '')
      let n = String(nome || codigo || '')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/>>+\s*$/, '')
        .trim()
      if (!c || !/^[1-9]\d{9}$/.test(c)) return
      if (seen.has(c)) return
      seen.add(c)
      items.push({ codigo: c, descricao: n || c, imagemUrl: imagemUrl || '', _top: top })
    }

    function absUrl(src) {
      if (!src) return ''
      if (src.startsWith('http')) return src
      if (src.startsWith('/')) return `${location.origin}${src}`
      return src
    }

    function walkShadowRoots(root, fn) {
      fn(root)
      root.querySelectorAll?.('*')?.forEach?.((el) => {
        if (el.shadowRoot) walkShadowRoots(el.shadowRoot, fn)
      })
    }

    const rangeRe = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
    const rangeMatches = [...(document.body?.innerText || '').matchAll(rangeRe)]
    const activeRange = rangeMatches.length ? rangeMatches[rangeMatches.length - 1][0] : ''
    const startItem = activeRange
      ? parseInt(activeRange.match(/(\d+)\s*-\s*(\d+)/)?.[1] || '1', 10)
      : 1
    const currentPage = Math.max(1, Math.ceil(startItem / 20))

    /** Estratégia principal: nós folha com código exacto (20 produtos visíveis). */
    const leafHits = []
    walkShadowRoots(document, (root) => {
      root.querySelectorAll?.('*')?.forEach?.((el) => {
        if (el.children?.length > 0) return
        const t = (el.textContent || '').trim()
        const m = t.match(CODE_RE)
        if (!m) return
        const r = el.getBoundingClientRect?.()
        if (!r || r.width < 2 || r.height < 2) return
        leafHits.push({ code: m[1], el, top: r.top, left: r.left })
      })
    })
    leafHits.sort((a, b) => a.top - b.top || a.left - b.left)

    const skipLine =
      /^(sort by|filters|clear all|category|loading|best match|spare parts|price reduced|log in|search|home|>>)$/i

    for (const hit of leafHits) {
      let nome = ''
      let el = hit.el.parentElement
      for (let i = 0; i < 8 && el; i++) {
        const parts = (el.textContent || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
        const idx = parts.findIndex((p) => p === hit.code)
        if (idx > 0) {
          for (let j = idx - 1; j >= 0; j--) {
            const prev = parts[j]
            if (CODE_RE.test(prev)) break
            if (skipLine.test(prev)) continue
            if (prev.length >= 3 && prev.length < 200) {
              nome = prev
              break
            }
          }
        }
        if (nome) break
        el = el.parentElement
      }
      push(hit.code, nome, '', hit.top)
      if (items.length >= 24) break
    }

    /** Fallback: texto após último range. */
    if (items.length < 8) {
      const bodyText = document.body?.innerText || ''
      const rangeStart = rangeMatches.length ? rangeMatches[rangeMatches.length - 1].index : 0
      let section = bodyText.slice(rangeStart + activeRange.length)
      const m2 = section.match(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i)
      if (m2 && m2.index > 0) section = section.slice(0, m2.index)
      section = section.slice(0, 14000)
      const lines = section
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      for (let i = 0; i < lines.length; i++) {
        const codeOnly = lines[i].match(/^([1-9]\d{9})$/)
        if (!codeOnly) continue
        let nome = ''
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          const prev = lines[j]
          if (/^[1-9]\d{9}$/.test(prev)) break
          if (skipLine.test(prev)) continue
          if (prev.length >= 3 && prev.length < 200) {
            nome = prev
            break
          }
        }
        push(codeOnly[1], nome, '')
        if (items.length >= 24) break
      }
    }

    /** Imagens CMS só pág.≤250 (acima ficam stale). */
    if (currentPage <= 250 && items.length > 0) {
      const imgEls = []
      walkShadowRoots(document, (root) => {
        root.querySelectorAll?.('img[src*="cms/delivery/media"]')?.forEach?.((img) => {
          const r = img.getBoundingClientRect?.()
          if (!r || r.width < 16 || r.height < 16) return
          if (r.bottom < 0 || r.top > window.innerHeight + 200) return
          imgEls.push({ img, top: r.top, left: r.left })
        })
      })
      imgEls.sort((a, b) => a.top - b.top || a.left - b.left)
      for (let i = 0; i < items.length && i < imgEls.length; i++) {
        if (!items[i].imagemUrl) {
          const img = imgEls[i].img
          items[i].imagemUrl = absUrl(img.getAttribute('src') || img.getAttribute('data-src') || '')
        }
      }
    }

    return items.slice(0, 24).map(({ _top, ...rest }) => rest)
  })
}

export async function waitForHomagProductsReady(page, minCount = 1, maxWaitMs = 90000) {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(800)
    const items = await discoverHomagProducts(page)
    if (items.length >= minCount) return items
  }
  return discoverHomagProducts(page)
}

export async function waitForHomagProductsChange(
  page,
  previousFirstCode,
  maxWaitMs = 25000,
  previousRange = ''
) {
  const prev = String(previousFirstCode || '').trim()
  const prevRange = String(previousRange || '').trim()
  if (!prev) {
    await page.waitForTimeout(1500)
    return discoverHomagProducts(page)
  }
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(600)
    const items = await discoverHomagProducts(page)
    const first = items[0]?.codigo || ''
    const rangeNow =
      (await page.evaluate(() => {
        const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
        const all = document.body.innerText.match(re) || []
        return all.length ? all[all.length - 1] : ''
      })) || ''
    if (items.length > 0 && first && first !== prev) return items
    if (prevRange && rangeNow && rangeNow !== prevRange && first && first !== prev) return items
  }
  return discoverHomagProducts(page)
}

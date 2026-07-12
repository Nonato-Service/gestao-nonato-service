/**
 * Paginação robusta para HOMAG / Salesforce Commerce (LWC).
 * Tenta vários seletores e fallback por texto Next/Weiter.
 */

const DEFAULT_NEXT_SELECTORS = [
  'button[aria-label="Next"]',
  'button[aria-label="Next Page"]',
  'a[aria-label="Next"]',
  'button[title="Next"]',
  'a[title="Next"]',
  'lightning-button[title="Next"] button',
  'lightning-button[aria-label="Next"] button',
  '[data-testid*="pagination-next" i]',
  'button:has-text("Next")',
  'a:has-text("Next")',
]

const DEFAULT_LOAD_MORE = [
  'button:has-text("Load more")',
  'button:has-text("Show more")',
  'button:has-text("Mehr laden")',
  'button:has-text("Mehr anzeigen")',
  'button:has-text("Weitere")',
  'a:has-text("Load more")',
  'a:has-text("Show more")',
]

function splitSelectors(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function countActiveItems(page, itemSel) {
  const parts = splitSelectors(itemSel)
  for (const part of parts) {
    try {
      const n = await page.locator(part).count()
      if (n > 0) return n
    } catch {
      /* ignore */
    }
  }
  return 0
}

export async function dismissCookieBanner(page) {
  for (const label of [/accept everything/i, /aceitar/i, /accept all/i, /agree/i, /ok/i]) {
    try {
      const btn = page.getByRole('button', { name: label }).first()
      if ((await btn.count()) > 0 && (await btn.isVisible().catch(() => false))) {
        await btn.click({ timeout: 5000 })
        await page.waitForTimeout(800)
        console.log('[HOMAG] Banner de cookies fechado.')
        return true
      }
    } catch {
      /* ignore */
    }
  }
  return false
}

async function getItemRange(page) {
  return page.evaluate(() => {
    const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
    const all = document.body.innerText.match(re) || []
    return all.length ? all[all.length - 1] : ''
  })
}

/** Só espera pela barra «1 - 20 of 31130 Items» — suficiente para saltar páginas. */
export async function waitForHomagRange(page, maxMs = 90000) {
  console.log('[HOMAG] A aguardar barra de paginação (sem esperar produtos na pág.1)…')
  const start = Date.now()
  let lastLog = 0
  while (Date.now() - start < maxMs) {
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {})
    const range = await getItemRange(page)
    if (range) {
      console.log(`[HOMAG] Paginação visível: ${range}`)
      await patchHomagPagination(page)
      return range
    }
    await page.waitForTimeout(2000)
    const elapsed = Math.round((Date.now() - start) / 1000)
    if (elapsed - lastLog >= 6) {
      console.log(`[HOMAG] A aguardar paginação… (${elapsed}s)`)
      lastLog = elapsed
    }
  }
  console.warn('[HOMAG] Barra de paginação não apareceu a tempo.')
  return ''
}

async function scrollToPagingArea(page, fast = false) {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight)
    const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
    const all = document.body.innerText.match(re) || []
    const target = all.length ? all[all.length - 1] : ''
    if (!target) return
    const nodes = [...document.querySelectorAll('*')]
    for (const el of nodes) {
      const t = el.textContent || ''
      if (t.includes(target) && t.length < 80) {
        el.scrollIntoView({ block: 'center' })
        break
      }
    }
  })
  await page.waitForTimeout(fast ? 150 : 1000)
}

async function clickLocatorIfReady(page, selector, force = false) {
  try {
    const loc = page.locator(selector).first()
    const n = await loc.count()
    if (n === 0) return false
    await loc.scrollIntoViewIfNeeded().catch(() => {})
    const disabled = await loc.isDisabled().catch(() => false)
    if (disabled) return false
    if (!force) {
      const vis = await loc.isVisible({ timeout: 1500 }).catch(() => false)
      if (!vis) return false
    }
    await loc.click({ timeout: 10000, force })
    return true
  } catch {
    return false
  }
}

async function getPagingBar(page) {
  const rangeLoc = page.getByText(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i).last()
  if ((await rangeLoc.count()) === 0) return null
  for (let level = 2; level <= 14; level++) {
    const anc = rangeLoc.locator(`xpath=ancestor::*[${level}]`)
    const n = await anc.locator('button').count().catch(() => 0)
    if (n >= 4) return anc
  }
  return null
}

/** Botões de página — só dentro da barra de paginação (evita cliques errados / >250). */
async function pageNumberButton(page, num) {
  const n = parseInt(num, 10)
  if (!Number.isFinite(n) || n < 1 || n > HOMAG_MAX_DIRECT_PAGE) return page.locator('_never_')
  const bar = await getPagingBar(page)
  const re = new RegExp(`^${n}$`)
  if (bar) return bar.locator('button:not([disabled])').filter({ hasText: re }).first()
  return page.locator('button:not([disabled])').filter({ hasText: re }).first()
}

function parseRangePageNum(range) {
  const m = String(range || '').match(/(\d+)\s*-\s*(\d+)\s+of\s+(\d+)/i)
  if (!m) return 1
  const start = parseInt(m[1], 10)
  const end = parseInt(m[2], 10)
  const pageSize = Math.max(1, end - start + 1)
  return Math.ceil(start / pageSize)
}

/** HOMAG só permite ir directo às páginas 1–250 (input «Specify a valid page between 0 and 250»). */
export const HOMAG_MAX_DIRECT_PAGE = 250

/** Script injectado em cada página — bloqueia cliques/input >250 antes do site mostrar erro. */
export function getHomagPaginationGuardInitScript() {
  return `
(function () {
  const MAX = 250;
  function guardEl(el) {
    if (!el || el.__homagPagGuard) return;
    el.__homagPagGuard = true;
    if (el.tagName === 'BUTTON') {
      const t = (el.textContent || '').trim();
      if (/^\\d+$/.test(t) && parseInt(t, 10) > MAX) {
        el.addEventListener('click', (e) => { e.preventDefault(); e.stopImmediatePropagation(); }, true);
      }
    }
    if (el.tagName === 'INPUT') {
      const ph = ((el.placeholder || '') + (el.getAttribute('aria-label') || '')).toLowerCase();
      if (/page|página|go to|jump|number/.test(ph) || el.type === 'number') {
        el.setAttribute('max', String(MAX));
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const v = parseInt(el.value, 10);
            if (!Number.isFinite(v) || v > MAX || v < 0) { e.preventDefault(); e.stopImmediatePropagation(); }
          }
        }, true);
        el.addEventListener('change', (e) => {
          const v = parseInt(el.value, 10);
          if (Number.isFinite(v) && v > MAX) { el.value = String(MAX); e.stopImmediatePropagation(); }
        }, true);
      }
    }
  }
  function scan() {
    document.querySelectorAll('button, input').forEach(guardEl);
    document.querySelectorAll('*').forEach((el) => { if (el.shadowRoot) el.shadowRoot.querySelectorAll('button, input').forEach(guardEl); });
  }
  scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
`
}

export async function installHomagPaginationGuard(context) {
  await context.addInitScript(getHomagPaginationGuardInitScript())
}

export async function patchHomagPagination(page) {
  await page.evaluate((max) => {
    function walk(root) {
      root.querySelectorAll?.('button')?.forEach?.((btn) => {
        const t = (btn.textContent || '').trim()
        if (/^\d+$/.test(t) && parseInt(t, 10) > max) {
          btn.disabled = true
          btn.setAttribute('aria-disabled', 'true')
        }
      })
      root.querySelectorAll?.('input')?.forEach?.((inp) => {
        const ph = ((inp.placeholder || '') + (inp.getAttribute('aria-label') || '')).toLowerCase()
        if (/page|página|go to|jump|number/.test(ph) || inp.type === 'number') {
          inp.setAttribute('max', String(max))
          const v = parseInt(inp.value, 10)
          if (Number.isFinite(v) && v > max) inp.value = String(max)
        }
      })
      root.querySelectorAll?.('*')?.forEach?.((el) => {
        if (el.shadowRoot) walk(el.shadowRoot)
      })
    }
    walk(document)
  }, HOMAG_MAX_DIRECT_PAGE)
}

let _lastToastLog = 0
let _toastLoggedOnce = false

export async function dismissHomagErrorToast(page) {
  const found = await page.evaluate(() => {
    const re = /valid page between|specify a valid page/i
    const roots = document.querySelectorAll(
      '[class*="toast" i], [class*="notification" i], [class*="slds-notify" i], [role="alert"]'
    )
    for (const el of roots) {
      const t = (el.textContent || '').trim()
      if (!re.test(t) || t.length > 300) continue
      const r = el.getBoundingClientRect()
      if (r.width < 8 || r.height < 8) continue
      const close = el.querySelector('button,[aria-label*="close" i],[aria-label*="dismiss" i]')
      if (close) close.click()
      else el.remove?.()
      return true
    }
    return false
  })
  if (found) {
    const now = Date.now()
    if (!_toastLoggedOnce || now - _lastToastLog > 120000) {
      console.warn('[HOMAG] Aviso paginação (>250) fechado — a usar só seta Next.')
      _toastLoggedOnce = true
      _lastToastLog = now
    }
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(300)
  }
  return found
}

function isSafePagingNumberLabel(text) {
  const t = String(text || '').trim()
  if (!/^\d+$/.test(t)) return false
  const n = parseInt(t, 10)
  return n >= 1 && n <= HOMAG_MAX_DIRECT_PAGE
}

async function blurHomagPageInput(page) {
  await page.evaluate(() => {
    function walk(root) {
      root.querySelectorAll?.('input')?.forEach?.((inp) => {
        const ph = (inp.placeholder || inp.getAttribute('aria-label') || '').toLowerCase()
        const type = (inp.type || '').toLowerCase()
        if (type === 'number' || /page|página|go to|jump/i.test(ph)) {
          try {
            inp.blur()
          } catch {
            /* ignore */
          }
        }
      })
      root.querySelectorAll?.('*')?.forEach?.((el) => {
        if (el.shadowRoot) walk(el.shadowRoot)
      })
    }
    walk(document)
  })
  await page.keyboard.press('Escape').catch(() => {})
}

/** Clica seta Next/Previous SÓ na barra de paginação — nunca números >250. */
async function clickPagingBarArrow(page, direction = 'next') {
  await blurHomagPageInput(page)
  const clicked = await page.evaluate((dir) => {
    const rangeRe = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i
    let rangeEl = null
    function walk(root) {
      root.querySelectorAll?.('*')?.forEach?.((el) => {
        const t = (el.textContent || '').trim()
        if (rangeRe.test(t) && t.length < 80) rangeEl = el
      })
      root.querySelectorAll?.('*')?.forEach?.((el) => {
        if (el.shadowRoot) walk(el.shadowRoot)
      })
    }
    walk(document)
    if (!rangeEl) return false
    let node = rangeEl
    for (let lvl = 0; lvl < 14 && node; lvl++) {
      const buttons = [...node.querySelectorAll('button:not([disabled])')]
      for (const btn of buttons) {
        const text = (btn.textContent || '').trim()
        if (/^\d+$/.test(text)) {
          const n = parseInt(text, 10)
          if (n > 250) continue
        }
        const label = [btn.getAttribute('aria-label'), btn.getAttribute('title'), text]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (dir === 'next') {
          if (!/next/.test(label) || /previous|prev|zurück|back/.test(label)) continue
        } else {
          if (!/previous|prev|zurück|back/.test(label) || /next/.test(label)) continue
        }
        btn.click()
        return true
      }
      node = node.parentElement
    }
    return false
  }, direction)
  if (clicked) {
    await page.waitForTimeout(350)
    await blurHomagPageInput(page)
  }
  return clicked
}

/** Seta «Next» — só barra de paginação (nunca botão «256» nem input >250). */
async function clickSafeNextInPagingBar(page, skipScroll = false) {
  if (!skipScroll) await scrollToPagingArea(page, true)
  await patchHomagPagination(page)
  await blurHomagPageInput(page)
  if (await clickPagingBarArrow(page, 'next')) {
    await patchHomagPagination(page)
    await dismissHomagErrorToast(page)
    return true
  }
  const bar = await getPagingBar(page)
  if (bar) {
    for (const name of [/^Next Page$/i, /^Next$/i]) {
      try {
        const btn = bar.getByRole('button', { name }).first()
        if ((await btn.count()) > 0 && !(await btn.isDisabled().catch(() => true))) {
          await blurHomagPageInput(page)
          await btn.click({ force: true, timeout: 12000 })
          await blurHomagPageInput(page)
          return true
        }
      } catch {
        /* try next */
      }
    }
  }
  return false
}

export async function getCurrentHomagPage(page) {
  return parseRangePageNum(await getItemRange(page))
}

async function clickHomagPageNumber(page, pageNum) {
  const n = parseInt(pageNum, 10)
  if (!Number.isFinite(n) || n < 1 || n > HOMAG_MAX_DIRECT_PAGE) return false
  const cur = await getCurrentHomagPage(page)
  if (cur > HOMAG_MAX_DIRECT_PAGE) return false
  await scrollToPagingArea(page)
  await blurHomagPageInput(page)
  const btn = await pageNumberButton(page, n)
  if ((await btn.count()) === 0) return false
  const beforeRange = await getItemRange(page)
  await btn.scrollIntoViewIfNeeded().catch(() => {})
  await btn.click({ force: true, timeout: 12000 })
  await waitRangeChanged(page, beforeRange, 15000)
  const hadError = await dismissHomagErrorToast(page)
  return !hadError
}

async function waitRangeChanged(page, beforeRange, maxMs = 15000, fast = false) {
  const start = Date.now()
  const step = fast ? 120 : 350
  while (Date.now() - start < maxMs) {
    await page.waitForTimeout(step)
    const r = await getItemRange(page)
    if (r && r !== beforeRange) return true
  }
  return false
}

async function clickHighestVisiblePageButton(page, maxPage = HOMAG_MAX_DIRECT_PAGE) {
  const cur = await getCurrentHomagPage(page)
  if (cur > HOMAG_MAX_DIRECT_PAGE) return 0
  await scrollToPagingArea(page)
  await blurHomagPageInput(page)
  const beforeRange = await getItemRange(page)
  const current = parseRangePageNum(beforeRange)
  const cap = Math.min(maxPage, HOMAG_MAX_DIRECT_PAGE)
  const bar = await getPagingBar(page)
  const buttons = bar ? bar.locator('button:not([disabled])') : page.locator('button:not([disabled])')
  const n = await buttons.count()
  let best = 0
  let bestIdx = -1
  for (let i = 0; i < n; i++) {
    const btn = buttons.nth(i)
    const text = ((await btn.innerText().catch(() => '')) || '').trim()
    if (!isSafePagingNumberLabel(text)) continue
    const num = parseInt(text, 10)
    if (num > cap || num <= current) continue
    if (num > best) {
      best = num
      bestIdx = i
    }
  }
  if (bestIdx < 0 || best <= 0) return 0
  await buttons.nth(bestIdx).scrollIntoViewIfNeeded().catch(() => {})
  await buttons.nth(bestIdx).click({ force: true, timeout: 12000 })
  await waitRangeChanged(page, beforeRange, 15000)
  const hadError = await dismissHomagErrorToast(page)
  return hadError ? 0 : best
}

async function advanceOnePageByArrow(page, fast = false) {
  const cur = await getCurrentHomagPage(page)
  if (!fast) await blurHomagPageInput(page)
  const beforeRange = await getItemRange(page)
  if (await clickSafeNextInPagingBar(page, true)) {
    await waitRangeChanged(page, beforeRange, fast ? 7000 : 10000, fast)
    await dismissHomagErrorToast(page)
    return true
  }
  if (!fast && cur <= HOMAG_MAX_DIRECT_PAGE && (await clickNextPlaywright(page))) {
    await waitRangeChanged(page, beforeRange, 10000, false)
    return true
  }
  return false
}

async function burstAdvancePages(page, targetPage, current, fast) {
  const burstMax = fast ? 40 : 15
  await scrollToPagingArea(page, fast)
  if (fast) await dismissHomagErrorToast(page)
  let burst = 0
  while (burst < burstMax && current < targetPage) {
    if (!(await advanceOnePageByArrow(page, fast))) break
    burst++
    const now = await getCurrentHomagPage(page)
    if (now > current) current = now
    else break
  }
  return { current, burst }
}

async function getFirstProductCode(page) {
  const { discoverHomagProducts } = await import('./discover-products.mjs')
  return (await discoverHomagProducts(page))[0]?.codigo || ''
}

async function waitFirstProductCodeChange(page, beforeCode, maxMs = 18000) {
  if (!beforeCode) {
    await page.waitForTimeout(1200)
    return true
  }
  const { discoverHomagProducts } = await import('./discover-products.mjs')
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    await page.waitForTimeout(450)
    const first = (await discoverHomagProducts(page))[0]?.codigo || ''
    if (first && first !== beforeCode) return true
  }
  return false
}

async function clickSafePreviousInPagingBar(page) {
  await scrollToPagingArea(page, true)
  if (await clickPagingBarArrow(page, 'prev')) return true
  const bar = await getPagingBar(page)
  if (bar) {
    for (const name of [/^Previous Page$/i, /^Previous$/i]) {
      try {
        const btn = bar.getByRole('button', { name }).first()
        if ((await btn.count()) > 0 && !(await btn.isDisabled().catch(() => true))) {
          await blurHomagPageInput(page)
          await btn.click({ force: true, timeout: 12000 })
          return true
        }
      } catch {
        /* try next */
      }
    }
  }
  return false
}

/**
 * Acima da pág.250 só funciona seta Next.
 * @param {{ fast?: boolean }} opts — fast=true (default): rajadas só por range; fast=false: 1-a-1 com códigos
 */
async function advanceViaNextOnly(page, targetPage, startAt = null, opts = {}) {
  const fastNav = opts.fast !== false
  let at = startAt ?? (await getCurrentHomagPage(page))
  if (at >= targetPage) return at

  console.log(
    `[HOMAG] Avanço Next (pág.${at}→${targetPage}${fastNav ? ', rajada' : ', 1-a-1'})…`
  )

  while (at < targetPage) {
    if (fastNav) {
      const chunk = Math.min(15, targetPage - at)
      let moved = 0
      for (let i = 0; i < chunk; i++) {
        const brStep = await getItemRange(page)
        if (!(await advanceOnePageByArrow(page, true))) break
        await waitRangeChanged(page, brStep, 8000, true)
        moved++
        const now = await getCurrentHomagPage(page)
        if (now >= targetPage) {
          at = now
          break
        }
      }
      if (moved === 0) {
        console.warn(`[HOMAG] Next bloqueado na pág.${at}`)
        break
      }
      at = await getCurrentHomagPage(page)
      if (at % 20 === 0 || at >= targetPage) {
        console.log(`[HOMAG] Next… pág.${at}/${targetPage}`)
      }
      continue
    }

    const codeBefore = await getFirstProductCode(page)
    const br = await getItemRange(page)
    if (!(await advanceOnePageByArrow(page, false))) {
      console.warn(`[HOMAG] Next bloqueado na pág.${at}`)
      break
    }
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await waitRangeChanged(page, br, 15000, false)
    if (codeBefore) await waitFirstProductCodeChange(page, codeBefore, 12000)

    const atAfter = await getCurrentHomagPage(page)
    if (atAfter <= at) {
      console.warn(`[HOMAG] Range não avançou na pág.${at}`)
      break
    }
    at = atAfter
    if (at % 10 === 0 || at === targetPage) {
      console.log(`[HOMAG] Next validado… pág.${at}/${targetPage}`)
    }
  }
  return at
}

/** Resync: pág.≤250 usa recuo; pág.>250 ancora em 250 e avança só com Next. */
async function resyncHomagProductGrid(page, targetPage) {
  if (targetPage > HOMAG_MAX_DIRECT_PAGE) {
    let at = await getCurrentHomagPage(page)
    if (at !== HOMAG_MAX_DIRECT_PAGE) {
      console.log(`[HOMAG] Resync >250: ir à pág.${HOMAG_MAX_DIRECT_PAGE} (âncora)…`)
      await jumpToHomagPage(page, HOMAG_MAX_DIRECT_PAGE, { fast: true, sync: false })
      at = await getCurrentHomagPage(page)
    }
    return advanceViaNextOnly(page, targetPage, at, { fast: true })
  }

  const tail = Math.min(18, Math.max(6, targetPage - 1))
  const tailStart = Math.max(1, targetPage - tail)
  let at = await getCurrentHomagPage(page)
  if (at < tailStart) {
    await jumpToHomagPage(page, tailStart, { fast: true, sync: false })
    at = await getCurrentHomagPage(page)
  }
  if (at > tailStart + 2) {
    console.log(`[HOMAG] Resync: recuar pág.${tailStart} (estava ${at})…`)
    if (await clickHomagPageNumber(page, tailStart)) {
      at = await getCurrentHomagPage(page)
    } else {
      let guard = 0
      while (at > tailStart && guard < 40) {
        const br = await getItemRange(page)
        if (!(await clickSafePreviousInPagingBar(page))) break
        await waitRangeChanged(page, br, 12000, false)
        at = await getCurrentHomagPage(page)
        guard++
      }
    }
  }
  console.log(`[HOMAG] Resync grelha: pág.${at} → ${targetPage}…`)
  let sameCodeStreak = 0
  while (at < targetPage) {
    const codeBefore = await getFirstProductCode(page)
    const br = await getItemRange(page)
    if (!(await advanceOnePageByArrow(page, false))) break
    await waitRangeChanged(page, br, 15000, false)
    await waitFirstProductCodeChange(page, codeBefore, 20000)
    at = await getCurrentHomagPage(page)
    const codeNow = await getFirstProductCode(page)
    if (codeNow && codeNow === codeBefore) {
      sameCodeStreak++
      if (sameCodeStreak >= 4) {
        console.warn(`[HOMAG] Resync: grelha presa em ${codeNow} — continuar na pág.${at}`)
        break
      }
    } else {
      sameCodeStreak = 0
    }
    console.log(`[HOMAG] Resync pág.${at}/${targetPage} — código ${codeNow || '?'}`)
  }
  return at
}

/** Salto para página N — cliques no maior nº visível + 250 + rajada Next (modo rápido). */
export async function jumpToHomagPage(page, targetPage, opts = {}) {
  const fast = opts.fast !== false
  const sync = opts.sync !== false
  const directCap = HOMAG_MAX_DIRECT_PAGE
  if (targetPage <= 1) return 1
  await dismissCookieBanner(page)
  await scrollToPagingArea(page, fast)
  let current = await getCurrentHomagPage(page)
  if (current >= targetPage) {
    if (sync && targetPage > directCap) {
      await jumpToHomagPage(page, directCap, { fast: true, sync: false })
      current = await advanceViaNextOnly(page, targetPage, directCap, { fast: !sync })
    } else if (sync && targetPage > 15) {
      current = await resyncHomagProductGrid(page, targetPage)
    }
    console.log(`[HOMAG] Já na página ${current}.`)
    return current
  }
  const fastStop =
    targetPage > directCap
      ? directCap
      : sync && targetPage > 22
        ? Math.max(1, targetPage - 18)
        : targetPage
  console.log(
    `[HOMAG] Salto${fast ? ' rápido' : ''}: pág.${current} → ${targetPage}` +
      (fastStop < targetPage ? ` (até pág.${fastStop}, depois Next)` : '') +
      (targetPage > directCap ? ` — acima de ${directCap} só seta Next` : '')
  )

  if (targetPage <= directCap && fastStop === targetPage && (await clickHomagPageNumber(page, targetPage))) {
    current = await getCurrentHomagPage(page)
    if (current >= targetPage - 1) {
      if (sync && targetPage > 15) current = await resyncHomagProductGrid(page, targetPage)
      console.log(`[HOMAG] Retoma na página ${current}.`)
      return current
    }
  }

  let noProgress = 0
  while (current < fastStop && noProgress < 8) {
    const before = current

    for (const p of [250, 200, 150, 100, 50, 25, 10, 3].filter((x) => x > current && x <= Math.min(fastStop, directCap))) {
      if (await clickHomagPageNumber(page, p)) {
        current = await getCurrentHomagPage(page)
        console.log(`[HOMAG] Salto directo… página ${current}/${fastStop}`)
        break
      }
    }
    if (current > before) {
      noProgress = 0
      continue
    }

    const high = await clickHighestVisiblePageButton(page, Math.min(fastStop, directCap))
    if (high > 0) {
      current = await getCurrentHomagPage(page)
      if (current > before) {
        noProgress = 0
        console.log(`[HOMAG] Salto (nº ${high})… página ${current}/${fastStop}`)
        continue
      }
    }

    const burst = await burstAdvancePages(page, fastStop, current, fast)
    current = burst.current
    if (burst.burst > 0) {
      console.log(`[HOMAG] Avanço… ${current}/${fastStop}`)
    }

    if (current <= before) noProgress++
    else noProgress = 0
  }

  if (targetPage > directCap) {
    current = await advanceViaNextOnly(page, targetPage, current, { fast: !sync })
  } else if (sync && targetPage > 15) {
    current = await resyncHomagProductGrid(page, targetPage)
  } else if (current < targetPage) {
    while (current < targetPage) {
      const br = await getItemRange(page)
      if (!(await advanceOnePageByArrow(page, fast))) break
      await waitRangeChanged(page, br, fast ? 7000 : 12000, fast)
      current = await getCurrentHomagPage(page)
    }
  }

  console.log(`[HOMAG] Retoma na página ${current}.`)
  return current
}

/** Recuar até pág.250 + Next até N — sem reabrir catálogo (rápido). */
export async function forceHomagGridAtPage(page, targetPage, startUrl, opts = {}) {
  const p = Math.max(HOMAG_MAX_DIRECT_PAGE + 1, Number(targetPage) || HOMAG_MAX_DIRECT_PAGE + 1)
  const allowReload = opts.allowReload === true
  let at = await getCurrentHomagPage(page)

  if (at > HOMAG_MAX_DIRECT_PAGE && at <= p + 35 && !allowReload) {
    console.warn(`[HOMAG] Refresh local: recuar pág.${HOMAG_MAX_DIRECT_PAGE} → ${p} (sem reabrir)…`)
    let guard = 0
    while (at > HOMAG_MAX_DIRECT_PAGE && guard < 50) {
      const br = await getItemRange(page)
      if (!(await clickSafePreviousInPagingBar(page))) break
      await waitRangeChanged(page, br, 12000, false)
      at = await getCurrentHomagPage(page)
      guard++
    }
    at = await advanceViaNextOnly(page, p, at, { fast: true })
  } else if (allowReload && startUrl) {
    console.warn(`[HOMAG] Refresh completo: reabrir catálogo → pág.250 → ${p}…`)
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await dismissCookieBanner(page)
    await waitForHomagRange(page, 90000)
    await page.waitForTimeout(2000)
    await jumpToHomagPage(page, HOMAG_MAX_DIRECT_PAGE, { fast: true, sync: false })
    at = await advanceViaNextOnly(page, p, HOMAG_MAX_DIRECT_PAGE, { fast: true })
  } else {
    await jumpToHomagPage(page, p, { fast: true, sync: false })
    at = await getCurrentHomagPage(page)
    if (at > HOMAG_MAX_DIRECT_PAGE) {
      at = await advanceViaNextOnly(page, p, HOMAG_MAX_DIRECT_PAGE, { fast: true })
    }
  }

  const { discoverHomagProducts } = await import('./discover-products.mjs')
  const domItems = await discoverHomagProducts(page)
  console.log(`[HOMAG] Grelha refrescada pág.${at}: 1º código ${domItems[0]?.codigo || '?'}`)
  return { at, domItems }
}

/** Recuar até pág.250 + Next lento até N — alinha produtos sem reabrir catálogo. */
export async function resyncLocalVia250(page, targetPage) {
  const target = Math.max(HOMAG_MAX_DIRECT_PAGE + 1, Number(targetPage) || HOMAG_MAX_DIRECT_PAGE + 1)
  let at = await getCurrentHomagPage(page)
  console.warn(`[HOMAG] Resync local: recuar pág.${HOMAG_MAX_DIRECT_PAGE} → avançar até ${target}…`)
  let guard = 0
  while (at > HOMAG_MAX_DIRECT_PAGE && guard < 60) {
    const br = await getItemRange(page)
    if (!(await clickSafePreviousInPagingBar(page))) break
    await waitRangeChanged(page, br, 12000, false)
    await patchHomagPagination(page)
    at = await getCurrentHomagPage(page)
    guard++
  }
  at = await advanceViaNextOnly(page, target, at, { fast: true })
  const { discoverHomagProducts } = await import('./discover-products.mjs')
  const domItems = await discoverHomagProducts(page)
  console.log(`[HOMAG] Resync local pág.${at}: 1º código ${domItems[0]?.codigo || '?'}`)
  return { at, domItems }
}

async function clickPagingArrow(page) {
  return clickSafeNextInPagingBar(page)
}

async function clickNextPlaywright(page) {
  const cur = await getCurrentHomagPage(page)
  if (cur > HOMAG_MAX_DIRECT_PAGE) {
    return (await clickSafeNextInPagingBar(page, true)) ? 'arrow-safe' : false
  }
  await dismissCookieBanner(page)
  if (await clickSafeNextInPagingBar(page)) return 'arrow-safe'

  const bar = await getPagingBar(page)
  const tries = bar
    ? [
        () => bar.getByRole('button', { name: /^Next Page$/i }).first(),
        () => bar.getByRole('button', { name: /^Next$/i }).first(),
      ]
    : [
        () => page.getByRole('button', { name: /^Next Page$/i }).first(),
        () => page.getByRole('button', { name: /^Next$/i }).first(),
      ]
  for (const getLoc of tries) {
    try {
      const loc = getLoc()
      if ((await loc.count()) === 0) continue
      await blurHomagPageInput(page)
      await loc.scrollIntoViewIfNeeded().catch(() => {})
      await loc.click({ force: true, timeout: 12000 })
      await blurHomagPageInput(page)
      await dismissHomagErrorToast(page)
      return 'next-text'
    } catch {
      /* try next */
    }
  }

  return false
}

async function clickNextByDomText(page) {
  return page.evaluate(() => {
    const re = /\b(next|weiter|suivant|siguiente|pr[oó]ximo)\b/i
    const nodes = [...document.querySelectorAll('button, a, [role="button"], lightning-button')]
    for (const el of nodes) {
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue
      const label = [
        el.getAttribute('aria-label'),
        el.getAttribute('title'),
        el.textContent,
      ]
        .filter(Boolean)
        .join(' ')
        .trim()
      if (!label || !re.test(label)) continue
      if (label.toLowerCase().includes('previous') || label.toLowerCase().includes('zurück')) continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue
      el.click()
      return label.slice(0, 40)
    }
    return null
  })
}

async function waitForPageChange(
  page,
  itemSel,
  urlBefore,
  countBefore,
  waitMs = 90000,
  getCount,
  rangeBefore = '',
  firstCodeBefore = ''
) {
  const countItems = getCount || (() => countActiveItems(page, itemSel))
  await page.waitForLoadState('networkidle', { timeout: waitMs }).catch(() => {})
  await page.waitForTimeout(2000)
  const urlAfter = page.url()
  const countAfter = await countItems()
  const rangeAfter = await getItemRange(page)
  if (urlAfter !== urlBefore) {
    /* URL pode mudar sem trocar produtos — exigir range ou contagem */
    if (rangeBefore && rangeAfter && rangeAfter !== rangeBefore) {
      return { ok: true, reason: 'url+range', countAfter }
    }
    if (countAfter > countBefore) return { ok: true, reason: 'url+count', countAfter }
  }
  if (rangeBefore && rangeAfter && rangeAfter !== rangeBefore) {
    return { ok: true, reason: 'range', countAfter }
  }
  if (countAfter > countBefore) return { ok: true, reason: 'count', countAfter }
  if (firstCodeBefore && typeof getCount?.firstCode === 'function') {
    const fc = await getCount.firstCode()
    if (fc && fc !== firstCodeBefore) return { ok: true, reason: 'first-code', countAfter }
  }
  await page.waitForTimeout(2500)
  const countLate = await countItems()
  const rangeLate = await getItemRange(page)
  if (rangeBefore && rangeLate && rangeLate !== rangeBefore) {
    return { ok: true, reason: 'range-late', countAfter: countLate }
  }
  if (countLate > countBefore) return { ok: true, reason: 'count-late', countAfter: countLate }
  return { ok: false, reason: 'unchanged', countAfter: countLate }
}

async function tryInfiniteScroll(page, getCount, countBefore, maxAttempts = 10) {
  let prev = countBefore
  for (let i = 0; i < maxAttempts; i++) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
      const scrollables = document.querySelectorAll(
        '[class*="scroll" i], [class*="results" i], main, [role="main"], .slds-scrollable_y, commerce_search-results'
      )
      for (const el of scrollables) {
        try {
          el.scrollTop = el.scrollHeight
        } catch {
          /* ignore */
        }
      }
    })
    await page.waitForTimeout(1800)
    await page.mouse.wheel(0, 1400).catch(() => {})
    await page.waitForTimeout(1200)
    const now = await getCount()
    if (now > prev) {
      return { ok: true, countAfter: now, attempts: i + 1 }
    }
    prev = now
  }
  return { ok: false, countAfter: prev, attempts: maxAttempts }
}

/**
 * Avança para a próxima página ou carrega mais itens.
 * @param {() => Promise<number>} [getCount] — contagem alternativa (ex.: deteção DOM)
 * @returns {Promise<boolean>} true se avançou
 */
export async function goToNextHomagPage(page, cfg, itemSel, getCount) {
  const countItems = getCount || (() => countActiveItems(page, itemSel))
  const pag = cfg.pagination || {}
  const urlBefore = page.url()
  const countBefore = await countItems()
  const rangeBefore = await getItemRange(page)
  const currentPage = parseRangePageNum(rangeBefore)
  let firstCodeBefore = ''
  if (getCount?.firstCode) {
    firstCodeBefore = await getCount.firstCode()
  }

  /** Acima da pág.250: só seta Next — sem fallbacks que disparam input >250. */
  if (currentPage > HOMAG_MAX_DIRECT_PAGE) {
    await patchHomagPagination(page)
    if (await clickSafeNextInPagingBar(page, true)) {
      await waitRangeChanged(page, rangeBefore, 12000, false)
      await dismissHomagErrorToast(page)
      const rangeAfter = await getItemRange(page)
      if (rangeAfter && rangeAfter !== rangeBefore) {
        return true
      }
    }
    return false
  }

  await scrollToPagingArea(page)
  await dismissHomagErrorToast(page)

  const nextKind = await clickNextPlaywright(page)
  if (nextKind) {
    const ch = await waitForPageChange(
      page,
      itemSel,
      urlBefore,
      countBefore,
      90000,
      countItems,
      rangeBefore,
      firstCodeBefore
    )
    if (ch.ok) {
      console.log(`[HOMAG] Próxima página (${nextKind}) — ${ch.reason}`)
      return true
    }
  }

  const configured = splitSelectors(pag.nextSelector)
  const loadMore = [...splitSelectors(pag.loadMoreSelector), ...DEFAULT_LOAD_MORE]
  const selectors = [...new Set([...configured, ...DEFAULT_NEXT_SELECTORS])]

  for (const sel of selectors) {
    if (/last-child|first-child|:nth-/i.test(sel)) continue
    const clicked = await clickLocatorIfReady(page, sel, sel.includes(':has-text("Next")'))
    if (!clicked) continue
    const ch = await waitForPageChange(
      page,
      itemSel,
      urlBefore,
      countBefore,
      90000,
      countItems,
      rangeBefore,
      firstCodeBefore
    )
    if (ch.ok) {
      console.log(`[HOMAG] Próxima página (${sel.slice(0, 60)}…) — ${ch.reason}`)
      return true
    }
  }

  for (const sel of loadMore) {
    const clicked = await clickLocatorIfReady(page, sel)
    if (!clicked) continue
    const ch = await waitForPageChange(
      page,
      itemSel,
      urlBefore,
      countBefore,
      90000,
      countItems,
      rangeBefore,
      firstCodeBefore
    )
    if (ch.ok) {
      console.log(`[HOMAG] Carregar mais (${sel}) — ${ch.reason}`)
      return true
    }
  }

  const domLabel = await clickNextByDomText(page)
  if (domLabel) {
    const ch = await waitForPageChange(
      page,
      itemSel,
      urlBefore,
      countBefore,
      90000,
      countItems,
      rangeBefore,
      firstCodeBefore
    )
    if (ch.ok) {
      console.log(`[HOMAG] Próxima página (texto DOM: "${domLabel}")`)
      return true
    }
  }

  // Scroll infinito: rolar várias vezes até aparecerem mais produtos
  const scroll = await tryInfiniteScroll(page, countItems, countBefore)
  if (scroll.ok) {
    console.log(
      `[HOMAG] Mais itens após scroll infinito (${countBefore} → ${scroll.countAfter}, ${scroll.attempts} rolagem(ns))`
    )
    return true
  }

  return false
}

/** Lista candidatos a paginação (para probe). */
export async function probePaginationCandidates(page) {
  return page.evaluate(() => {
    const out = []
    const re = /\b(next|weiter|load more|show more|mehr)\b/i
    for (const el of document.querySelectorAll('button, a, lightning-button, [role="button"]')) {
      const label = [el.getAttribute('aria-label'), el.getAttribute('title'), el.textContent?.trim()]
        .filter(Boolean)
        .join(' | ')
      if (!label || !re.test(label)) continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 2) continue
      let sel = el.tagName.toLowerCase()
      if (el.id) sel += `#${el.id}`
      else if (el.className && typeof el.className === 'string') {
        const c = el.className.trim().split(/\s+/).slice(0, 2).join('.')
        if (c) sel += `.${c}`
      }
      out.push({ label: label.slice(0, 80), selectorHint: sel, disabled: !!el.disabled })
    }
    return out.slice(0, 25)
  })
}

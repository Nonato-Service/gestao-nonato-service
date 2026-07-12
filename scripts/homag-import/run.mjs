#!/usr/bin/env node
/**
 * Importação HOMAG shop — Playwright.
 *
 * Modos:
 *   Página inteira (automático): exporta todos os itens (várias páginas — até maxPages no config, botão Next / Load more / scroll).
 *   Item a item (interativo): HOMAG_INTERACTIVE=1 — lista números, escolhe quais exportar.
 *
 * Pré-requisitos: npm install && npx playwright install chromium
 * Config: copie config.example.json → config.json e ajuste os seletores CSS (F12 na página).
 *
 * PowerShell (exemplo):
 *   $env:HOMAG_MANUAL="1"; $env:HOMAG_HEADLESS="0"; $env:HOMAG_INTERACTIVE="1"; npm run homag:import
 *
 * Imagens no JSON: por defeito embute data:image (até ~600 KB). HOMAG_EMBED_IMAGES=0 desliga.
 */

import fs from 'fs'
import path from 'path'
import readline from 'node:readline'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { goToNextHomagPage, dismissCookieBanner, waitForHomagRange, installHomagPaginationGuard, forceHomagGridAtPage } from './pagination.mjs'
import { discoverHomagProducts, waitForHomagProductsChange, waitForHomagProductsReady } from './discover-products.mjs'
import { loadResume, saveResume, finalizeExport, skipToPage, parseRangePage, computeHomagTargetPage, normCodigo } from './resume.mjs'
import { runHomagApiImport } from './api-import.mjs'
import {
  absHomagUrl,
  decodeHtmlText,
  downloadHomagImage,
  HOMAG_ORIGIN,
  imageExtFromUrl,
  imageFileBase,
} from './images.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, 'out')
const IMG_DIR = path.join(OUT_DIR, 'images')
const DATA_DIR = path.join(__dirname, '..', '..', 'data')

async function restoreHomagPageAfterReload(page, targetPage, startUrl, fast = true, hardReload = false) {
  const p = Math.max(1, Number(targetPage) || 1)
  console.log(
    `[HOMAG] A restaurar página ${p}${hardReload ? ' (reload completo)' : fast ? ' (salto rápido)' : ''}…`
  )

  async function ensureCatalog() {
    if (hardReload && startUrl) {
      await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
      await dismissCookieBanner(page)
      await page.waitForTimeout(fast ? 3000 : 8000)
    }
    let range = await waitForHomagRange(page, fast ? 30000 : 45000)
    if (!range && startUrl) {
      console.warn('[HOMAG] Catálogo não visível — a reabrir URL HOMAG…')
      await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
      await dismissCookieBanner(page)
      await page.waitForTimeout(fast ? 3000 : 8000)
      range = await waitForHomagRange(page, 120000)
    }
    return range
  }

  await ensureCatalog()
  let at = await skipToPage(page, p, { fast })
  if (at < Math.min(p, 250) - 3 && p > 15) {
    console.warn(`[HOMAG] Salto incompleto (pág.${at}/${p}) — nova tentativa${hardReload ? '' : ' com reload'}…`)
    await ensureCatalog()
    at = await skipToPage(page, p, { fast })
  }
  await page.waitForTimeout(fast ? 2000 : 4000)
  let domItems = await waitForHomagProductsReady(page, 1, fast ? 45000 : 120000)
  console.log(`[HOMAG] Restaurado pág.${at}: ${domItems.length} produto(s) — 1º código ${domItems[0]?.codigo || '?'}`)
  return { at, domItems }
}

function loadConfig() {
  const candidates = [
    process.env.HOMAG_CONFIG,
    path.join(__dirname, 'config.json'),
    path.join(process.cwd(), 'scripts', 'homag-import', 'config.json'),
  ].filter(Boolean)
  for (const configPath of candidates) {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'))
    }
  }
  console.error(
    'Falta config.json. Copie scripts/homag-import/config.example.json para config.json e edite os seletores.'
  )
  console.error('Procurado em:', candidates.join(' | '))
  process.exit(1)
}

function slug(s) {
  return (
    String(s || 'item')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 80) || 'item'
  )
}

function askLine(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (ans) => {
      rl.close()
      resolve(String(ans ?? '').trim())
    })
  })
}

/** Índices 1-based como na lista impressa */
function parseIndexLine(line, max) {
  const lower = line.toLowerCase()
  if (lower === 't' || lower === 'all' || lower === 'todas' || lower === 'todos') return 'all'
  if (lower === 'p' || lower === 'next') return 'nextpage'
  if (lower === 'q' || lower === 'quit' || lower === 'sair') return 'quit'
  const nums = line
    .split(/[,;\s]+/)
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= max)
  return [...new Set(nums)]
}

async function downloadImage(context, page, url, filePath, referer) {
  const ref =
    referer ||
    (page?.url?.().includes('homag.com') ? page.url() : null) ||
    startUrlRef ||
    HOMAG_ORIGIN
  return downloadHomagImage(context, url, filePath, ref)
}

let startUrlRef = ''

async function buildItemFromDiscovered(
  context,
  page,
  meta,
  globalSeq,
  embedOff,
  maxEmbed
) {
  let imagemUrl = absHomagUrl(meta.imagemUrl || '', HOMAG_ORIGIN)
  const descricao = decodeHtmlText(meta.descricao || meta.codigo || '')
  const nomeRaw = descricao || String(meta.codigo || '').trim()
  const nome = nomeRaw.length > 200 ? `${nomeRaw.slice(0, 200)}…` : nomeRaw || meta.codigo
  let imagemLocal = ''
  if (imagemUrl && imagemUrl.startsWith('http')) {
    const base = imageFileBase(meta.codigo, nomeRaw)
    const ext = imageExtFromUrl(imagemUrl)
    const fp = path.join(IMG_DIR, `${base}${ext}`)
    if (fs.existsSync(fp) && fs.statSync(fp).size > 500) {
      imagemLocal = fp
    } else {
      const ok = await downloadImage(context, page, imagemUrl, fp, startUrlRef)
      if (ok) imagemLocal = fp
    }
  }
  const imagemDataUrl = embedLocalIfNeeded(imagemLocal, imagemUrl, embedOff, maxEmbed)
  const preco = String(meta.preco ?? '').trim()
  return {
    codigo: String(meta.codigo || '').trim(),
    nome,
    descricao,
    preco,
    imagem: imagemDataUrl,
    imagem_url: imagemUrl,
    imagem_local: imagemLocal,
  }
}

async function readRowMeta(row, list, page) {
  let codigo = ''
  let descricao = ''
  let imagemUrl = ''
  try {
    if (list.codeSelector) {
      codigo = (await row.locator(list.codeSelector).first().innerText().catch(() => '')) || ''
    }
  } catch {
    /* ignore */
  }
  try {
    if (list.descSelector) {
      descricao = (await row.locator(list.descSelector).first().innerText().catch(() => '')) || ''
    }
  } catch {
    /* ignore */
  }
  try {
    if (list.imgSelector) {
      const img = row.locator(list.imgSelector).first()
      imagemUrl =
        (await img.getAttribute('src').catch(() => null)) ||
        (await img.getAttribute('data-src').catch(() => null)) ||
        ''
      if (imagemUrl && imagemUrl.startsWith('/')) {
        const u = new URL(page.url())
        imagemUrl = `${u.origin}${imagemUrl}`
      }
    }
  } catch {
    /* ignore */
  }
  return { codigo: codigo.trim(), descricao: descricao.trim(), imagemUrl }
}

function embedLocalIfNeeded(imagemLocal, imagemUrl, embedOff, maxEmbed) {
  if (embedOff || !imagemLocal || !fs.existsSync(imagemLocal)) return ''
  try {
    const st = fs.statSync(imagemLocal)
    if (st.size > maxEmbed) return ''
    const ext = path.extname(imagemLocal).toLowerCase()
    const mime =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
            ? 'image/gif'
            : 'image/png'
    return `data:${mime};base64,${fs.readFileSync(imagemLocal).toString('base64')}`
  } catch {
    return ''
  }
}

async function buildItemFromMeta(
  context,
  page,
  list,
  loc,
  meta,
  pageNum,
  rowIndexInPage,
  globalSeq,
  embedOff,
  maxEmbed
) {
  const row = loc.nth(meta.rowIndex)
  const { codigo, descricao, imagemUrl } = meta

  let imagemLocal = ''
  if (imagemUrl && imagemUrl.startsWith('http')) {
    const base = slug(codigo || `row_${pageNum}_${rowIndexInPage}`)
    const ext = imagemUrl.includes('.jpg') || imagemUrl.includes('jpeg')
      ? '.jpg'
      : imagemUrl.includes('.webp')
        ? '.webp'
        : '.png'
    const fp = path.join(IMG_DIR, `${base}_${globalSeq}${ext}`)
    const ok = await downloadImage(context, page, imagemUrl, fp)
    if (ok) imagemLocal = fp
  }

  const imagemDataUrl = embedLocalIfNeeded(imagemLocal, imagemUrl, embedOff, maxEmbed)
  const nome =
    descricao.length > 200 ? `${descricao.slice(0, 200)}…` : descricao || codigo || `Item ${globalSeq + 1}`

  return {
    codigo,
    nome,
    descricao,
    imagem: imagemDataUrl,
    imagem_url: imagemUrl,
    imagem_local: imagemLocal
  }
}

const SF_FALLBACKS = [
  'commerce_product-tile',
  '[data-product-code]',
  '.product-tile',
  'article[class*="product"]',
  'tr[data-row]',
]

async function countItemsOnPage(page, itemSel) {
  const parts = String(itemSel)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const part of parts) {
    try {
      const n = await page.locator(part).count()
      if (n > 0) return { sel: part, count: n }
    } catch {
      /* ignore invalid selector */
    }
  }
  for (const fb of SF_FALLBACKS) {
    try {
      const n = await page.locator(fb).count()
      if (n > 0) return { sel: fb, count: n }
    } catch {
      /* ignore */
    }
  }
  return { sel: parts[0] || itemSel, count: 0 }
}

async function waitForHomagCatalog(page, itemSel, maxMs = 120000) {
  console.log('[HOMAG] A aguardar catálogo carregar (login NÃO é necessário)…')
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
    try {
      await page.waitForFunction(
        () => /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i.test(document.body?.innerText || ''),
        { timeout: 8000 }
      )
    } catch {
      /* ainda a carregar */
    }
    const dom = await discoverHomagProducts(page)
    if (dom.length > 0) {
      console.log(`[HOMAG] Catálogo pronto: ${dom.length} produto(s) detectado(s).`)
      return { sel: itemSel, count: dom.length, mode: 'text' }
    }
    const probe = await countItemsOnPage(page, itemSel)
    if (probe.count > 0) {
      console.log(`[HOMAG] Catálogo pronto (CSS): ${probe.count} produto(s).`)
      return { ...probe, mode: 'css' }
    }
    const elapsed = Math.round((Date.now() - start) / 1000)
    console.log(`[HOMAG] Ainda a carregar… (${elapsed}s)`)
    await page.waitForTimeout(3000)
  }
  return { sel: itemSel, count: 0, mode: 'none' }
}

async function saveDebugSnapshot(page, outDir) {
  try {
    fs.mkdirSync(outDir, { recursive: true })
    const html = path.join(outDir, 'debug-last-page.html')
    const png = path.join(outDir, 'debug-last-page.png')
    fs.writeFileSync(html, await page.content(), 'utf8')
    await page.screenshot({ path: png, fullPage: false }).catch(() => {})
    console.error(`[HOMAG] Debug gravado: ${html}`)
  } catch {
    /* ignore */
  }
}

async function main() {
  const cfg = loadConfig()
  const startUrl = cfg.startUrl
  startUrlRef = startUrl
  if (!startUrl || typeof startUrl !== 'string') {
    console.error('config.json: defina startUrl')
    process.exit(1)
  }

  fs.mkdirSync(IMG_DIR, { recursive: true })

  const headless = process.env.HOMAG_HEADLESS !== '0'
  const interactive = process.env.HOMAG_INTERACTIVE === '1'
  const browser = await chromium.launch({ headless })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'it-IT',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  })
  await installHomagPaginationGuard(context)
  const page = await context.newPage()
  page.setDefaultTimeout(45000)

  const embedOff = process.env.HOMAG_EMBED_IMAGES === '0'
  const maxEmbed = Math.min(Math.max(Number(process.env.HOMAG_EMBED_MAX_BYTES) || 600000, 5000), 2000000)

  const resumeOn = process.env.HOMAG_RESUME !== '0'
  const resume = resumeOn ? loadResume(OUT_DIR, DATA_DIR) : { items: [], codigosVistos: new Set(), lastPageNum: 0, lastRange: '', exportPath: path.join(OUT_DIR, 'export.json'), statePath: path.join(OUT_DIR, 'import-state.json') }
  const items = resume.items
  const codigosVistos = resume.codigosVistos
  let globalSeq = items.length
  const outFile = resume.exportPath
  const stateFile = resume.statePath

  if (items.length > 0) {
    console.log('')
    console.log('============================================================')
    console.log(`  RETOMAR — ${items.length} peça(s) JÁ GUARDADAS (não recomeça do zero)`)
    console.log(`  Vai saltar para ~página ${resume.lastPageNum + 1} e importar SÓ novas`)
    console.log('============================================================')
    console.log('')
  }

  let importCompletedFully = false
  let exitCode = 0
  let lastSavedPageNum = resume.lastPageNum || 0
  let lastSavedRange = resume.lastRange || ''

  try {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 90000 })
    await dismissCookieBanner(page)

    const manual = process.env.HOMAG_MANUAL === '1'
    const user = process.env.HOMAG_USER || ''
    const pass = process.env.HOMAG_PASS || ''

    const list = cfg.list || {}
    let itemSel = list.itemSelector
    if (!itemSel) {
      console.error('config.json: defina list.itemSelector')
      process.exit(1)
    }

    if (user && pass && cfg.login && !manual) {
      const L = cfg.login
      if (L.userSelector) await page.locator(L.userSelector).first().fill(user)
      if (L.passSelector) await page.locator(L.passSelector).first().fill(pass)
      if (L.submitSelector) await page.locator(L.submitSelector).first().click()
      await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {})
    }

    if (manual) {
      process.stdout.write(
        '\n[HOMAG] Modo pausa (opcional):\n' +
          '  → Login NÃO é obrigatório — muitos acessos são sem login.\n' +
          '  → Se precisar, navegue até ver a LISTA DE PEÇAS no browser.\n' +
          '  → Quando vir os produtos, volte aqui e prima Enter.\n\n'
      )
      await new Promise((resolve) => process.stdin.once('data', resolve))
      console.log(`[HOMAG] URL actual: ${page.url()}`)
      console.log(`[HOMAG] Título: ${await page.title().catch(() => '?')}`)
      await page.waitForTimeout(2000)
    }

    const useApiImport = process.env.HOMAG_USE_API !== '0'
    const maxPages = Math.min(Math.max(1, Number(process.env.HOMAG_MAX_PAGES || cfg.maxPages) || 20), 2000)
    let catalogMaxPage = maxPages
    let pageNum = 1
    let stopAll = false
    let useDomDiscovery = process.env.HOMAG_USE_CSS !== '1'
    const getDomCount = async () => (await discoverHomagProducts(page)).length
    getDomCount.firstCode = async () => (await discoverHomagProducts(page))[0]?.codigo || ''
    const goNext = () => goToNextHomagPage(page, cfg, itemSel, getDomCount)

    const isResume = resumeOn && (resume.lastPageNum > 0 || (resume.apiDoneBuckets?.length > 0))

    if (useApiImport) {
      console.log('')
      console.log('============================================================')
      console.log('  MODO API — SearchController (contorna grelha DOM >pág.250)')
      console.log(`  ${items.length} peça(s) já guardadas — retoma buckets em falta`)
      console.log('============================================================')
      console.log('')
      const apiResult = await runHomagApiImport({
        context,
        page,
        startUrl,
        items,
        codigosVistos,
        stateFile,
        outFile,
        interactive,
        embedOff,
        maxEmbed,
        buildItemFromDiscovered,
        apiState: { doneBuckets: resume.apiDoneBuckets || [] },
        saveResumeFn: (p) => saveResume(stateFile, outFile, p),
      })
      importCompletedFully = apiResult.completedFully
      lastSavedPageNum = resume.lastPageNum || 0
      lastSavedRange = `API: ${apiResult.bucketsDone.length} buckets, ${items.length} peças`
      console.log(`\n[HOMAG API] Concluído: +${apiResult.totalNew} novas, total ${items.length} peças`)
    } else if (isResume) {
      const targetPage = computeHomagTargetPage(items, resume.lastPageNum, resume.lastRange)
      const rangeHint = resume.lastRange ? ` [${resume.lastRange}]` : ''
      console.log('')
      console.log(`[HOMAG] RETOMA — ${items.length} peças → salto directo pág.${targetPage}${rangeHint}`)
      console.log('')
      const rec = await restoreHomagPageAfterReload(page, targetPage, startUrl)
      pageNum = rec.at
      lastSavedPageNum = pageNum
      console.log(`[HOMAG] Pronto pág.${pageNum}: ${rec.domItems.length} produto(s) — importação página-a-página a partir daqui`)
      useDomDiscovery = true
    } else if (!useApiImport) {
      if (!manual) {
        await waitForHomagCatalog(page, itemSel)
      }

      async function countItems(selector) {
        return countItemsOnPage(page, selector)
      }

      await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => {})
      let firstProbe = await countItems(itemSel)
      const initialDom = await discoverHomagProducts(page)
      if (initialDom.length === 0 && firstProbe.count === 0) {
        console.warn(`[HOMAG] 0 itens — a aguardar conteúdo dinâmico (15s)…`)
        await page.waitForTimeout(15000)
        firstProbe = await countItems(itemSel)
      }
      itemSel = (await countItems(itemSel)).sel
      const domAfterWait = await discoverHomagProducts(page)
      console.log(
        `[HOMAG] Deteção: ${domAfterWait.length} por texto, ${firstProbe.count} por CSS (seletor: ${itemSel})`
      )
      useDomDiscovery = domAfterWait.length > 0 || items.length > 0 || process.env.HOMAG_USE_CSS !== '1'
    }

    if (!useApiImport) {
    let stuckPages = 0
    let lastRangeForStuck = ''
    let lastFirstCode = ''
    let lastRangeSeen = ''
    let zeroNewPages = 0
    const importFloor = Math.max(1, Math.ceil(items.length / 20))
    let lastRailwayAt = items.length
    const railwayEvery = Math.max(50, Number(process.env.HOMAG_RAILWAY_EVERY) || 500)
    let skipStaleCheckOnce = false
    let skipCodesSignature = ''
    let skipSignaturePage = 0
    let pagesAdvancedWithoutNew = 0

    function codesSignature(domItems) {
      return (domItems || [])
        .slice(0, 8)
        .map((d) => normCodigo(d.codigo))
        .filter(Boolean)
        .join(',')
    }

    function pageCodesAllKnown(domItems) {
      if (!domItems?.length) return false
      return domItems.every((d) => {
        const c = normCodigo(d.codigo)
        return c && codigosVistos.has(c)
      })
    }

    async function burstSkipPages(n = 15) {
      console.warn(`[HOMAG] Saltar ${n} págs (Next) — sem reload…`)
      for (let i = 0; i < n; i++) {
        if (!(await goNext())) break
        await page.waitForTimeout(350)
      }
    }

    async function handleStaleGrid(stuckPage, staleCode, domItems = []) {
      const pg = Number(stuckPage) || 0
      if (pageCodesAllKnown(domItems)) {
        const skip = zeroNewPages >= 5 ? 100 : 50
        console.warn(`[HOMAG] Pág.${pg} — ${domItems.length} peças já na biblioteca — saltar +${skip} Next…`)
        await burstSkipPages(skip)
        const range = await page.evaluate(() => {
          const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
          const all = document.body.innerText.match(re) || []
          return all.length ? all[all.length - 1] : ''
        })
        const itemsAfter = await discoverHomagProducts(page)
        skipStaleCheckOnce = true
        return {
          at: parseRangePage(range).page || pg + skip,
          domItems: itemsAfter,
          range,
        }
      }
      console.warn(`[HOMAG] Grelha presa (${staleCode}) — refresh completo pág.${pg}…`)
      const rec = await forceHomagGridAtPage(page, pg, startUrl, { allowReload: true })
      skipStaleCheckOnce = true
      const range = await page.evaluate(() => {
        const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
        const all = document.body.innerText.match(re) || []
        return all.length ? all[all.length - 1] : ''
      })
      return { at: rec.at, domItems: rec.domItems, range }
    }
    if (useDomDiscovery) {
      while (pageNum <= Math.min(maxPages, catalogMaxPage) && !stopAll) {
        let domItems = lastFirstCode
          ? await waitForHomagProductsChange(page, lastFirstCode, 25000, lastRangeSeen)
          : await discoverHomagProducts(page)
        let rangeNow = await page.evaluate(
          () => {
            const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
            const all = document.body.innerText.match(re) || []
            return all.length ? all[all.length - 1] : ''
          }
        )
        const pageFromRange = parseRangePage(rangeNow).page || pageNum
        if (parseRangePage(rangeNow).total > 0) {
          catalogMaxPage = Math.min(maxPages, Math.ceil(parseRangePage(rangeNow).total / 20))
        }
        const pageLimit = Math.min(maxPages, catalogMaxPage)
        if (pageFromRange > pageLimit) {
          console.warn(
            `[HOMAG] Pág.${pageFromRange} ≥ limite ${pageLimit} — progresso guardado (fim do catálogo ou HOMAG_MAX_PAGES).`
          )
          saveResume(stateFile, outFile, {
            items,
            startUrl,
            pageNum: pageFromRange,
            range: rangeNow,
            interactive,
          })
          break
        }
        if (items.length >= 500 && pageFromRange < importFloor) {
          const tgt = importFloor + 1
          console.warn(
            `[HOMAG] Pág.${pageFromRange} com ${items.length} peças — salto pág.${tgt} (sem 1-a-1)…`
          )
          const rec = await restoreHomagPageAfterReload(page, tgt, startUrl)
          pageNum = rec.at
          lastFirstCode = ''
          zeroNewPages = 0
          continue
        }
        const prevFirstCode = lastFirstCode
        const prevRange = lastRangeSeen
        if (
          !skipStaleCheckOnce &&
          rangeNow &&
          prevRange &&
          rangeNow !== prevRange &&
          domItems[0]?.codigo &&
          prevFirstCode &&
          domItems[0].codigo === prevFirstCode &&
          pageFromRange > 250
        ) {
          const stuckPage = pageFromRange || pageNum
          console.warn(
            `[HOMAG] Grelha presa (${domItems[0].codigo}, ${prevRange} → ${rangeNow}) — pág.${stuckPage}…`
          )
          const rec = await handleStaleGrid(stuckPage, domItems[0].codigo, domItems)
          domItems = rec.domItems
          pageNum = rec.at
          lastFirstCode = rec.domItems[0]?.codigo || ''
          zeroNewPages = 0
          if (rec.range) rangeNow = rec.range
        } else if (
          rangeNow &&
          prevRange &&
          rangeNow !== prevRange &&
          domItems[0]?.codigo &&
          prevFirstCode &&
          domItems[0].codigo === prevFirstCode
        ) {
          const stuckPage = pageFromRange || pageNum
          console.warn(
            `[HOMAG] DOM preso (códigos ${domItems[0].codigo} repetidos, range ${rangeNow}) — reabrir pág.${stuckPage}…`
          )
          const rec = await restoreHomagPageAfterReload(page, stuckPage, startUrl, true, true)
          domItems = rec.domItems
          pageNum = rec.at
          lastFirstCode = domItems[0]?.codigo || ''
          zeroNewPages = 0
          const rangeAfter = await page.evaluate(
            () => {
              const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
              const all = document.body.innerText.match(re) || []
              return all.length ? all[all.length - 1] : ''
            }
          )
          if (rangeAfter) rangeNow = rangeAfter
        }
        skipStaleCheckOnce = false
        const pageFromRangeFinal = parseRangePage(rangeNow).page || pageNum
        console.log(`[HOMAG] Página ${pageFromRangeFinal} — ${domItems.length} produto(s) [${rangeNow}]`)
        if (domItems.length === 0 && items.length === 0 && pageNum === 1) {
          await saveDebugSnapshot(page, OUT_DIR)
          console.error(
            '\n[HOMAG] ERRO: 0 peças encontradas.\n' +
              '  → A página pode ainda estar em «Loading» — tente HOMAG_MANUAL=1 e prima Enter quando vir a lista.\n' +
              '  → Ficheiros debug em scripts/homag-import/out/\n' +
              '  → Execute TESTAR-HOMAG-PAGINAS.bat para diagnosticar.\n'
          )
          process.exit(1)
        }
        if (domItems.length === 0) {
          const retryPage = pageFromRangeFinal || pageNum
          console.warn(`[HOMAG] Página ${retryPage}: 0 produtos — a aguardar / restaurar…`)
          domItems = await waitForHomagProductsReady(page, 1, 90000)
          if (domItems.length === 0 && retryPage > 1) {
            const rec = await restoreHomagPageAfterReload(page, retryPage, startUrl)
            domItems = rec.domItems
            pageNum = rec.at
            lastFirstCode = ''
          }
          if (domItems.length === 0) {
            console.warn('[HOMAG] Ainda 0 produtos — progresso guardado. Execute o BAT outra vez.')
            break
          }
        }
        let addedThisPage = 0
        let imagensThisPage = 0
        for (const meta of domItems) {
          const codKey = String(meta.codigo || '')
            .trim()
            .toLowerCase()
          if (codKey && codigosVistos.has(codKey)) {
            /** Peça já existe — preencher imagem em falta (import antigo sem fotos). */
            if (meta.imagemUrl) {
              const idx = items.findIndex((it) => String(it.codigo || '').trim().toLowerCase() === codKey)
              const cur = idx >= 0 ? items[idx] : null
              if (cur && !cur.imagem && !cur.imagem_url) {
                const it = await buildItemFromDiscovered(context, page, meta, globalSeq, embedOff, maxEmbed)
                if (it.imagem || it.imagem_url) {
                  items[idx] = { ...cur, imagem: it.imagem || cur.imagem, imagem_url: it.imagem_url, imagem_local: it.imagem_local }
                  imagensThisPage++
                }
              }
            }
            continue
          }
          const it = await buildItemFromDiscovered(context, page, meta, globalSeq, embedOff, maxEmbed)
          if (codKey) codigosVistos.add(codKey)
          items.push(it)
          globalSeq++
          addedThisPage++
        }
        console.log(
          `[HOMAG] Acumulado: ${items.length} peça(s) (+${addedThisPage} novas, +${imagensThisPage} fotos nesta página).`
        )
        if (domItems[0]?.codigo) lastFirstCode = domItems[0].codigo
        if (rangeNow) lastRangeSeen = rangeNow
        saveResume(stateFile, outFile, {
          items,
          startUrl,
          pageNum: pageFromRangeFinal,
          range: rangeNow,
          interactive,
        })
        lastSavedPageNum = pageFromRangeFinal
        lastSavedRange = rangeNow
        if (addedThisPage === 0 && imagensThisPage === 0) {
          zeroNewPages++
          const skipAhead = importFloor + 1
          if (pageFromRangeFinal < skipAhead) {
            console.warn(
              `[HOMAG] Pág.${pageFromRangeFinal} já importada (+0 novas) — salto directo pág.${skipAhead} (sem 1-a-1)…`
            )
            const rec = await restoreHomagPageAfterReload(page, skipAhead, startUrl, true)
            pageNum = rec.at
            lastFirstCode = ''
            zeroNewPages = 0
            stuckPages = 0
            lastRangeForStuck = rangeNow
            continue
          }
          if (zeroNewPages >= 1 && pageFromRangeFinal >= skipAhead) {
            const allKnown = pageCodesAllKnown(domItems)
            if (allKnown && zeroNewPages >= 1) {
              const sig = codesSignature(domItems)
              const pageGap = skipSignaturePage > 0 ? pageFromRangeFinal - skipSignaturePage : 0
              const staleSkip =
                sig &&
                skipCodesSignature &&
                sig === skipCodesSignature &&
                pageGap >= 80
              if (staleSkip || pagesAdvancedWithoutNew >= 300) {
                console.warn(
                  `[HOMAG] ALERTA: +0 novas em ~${pagesAdvancedWithoutNew || pageGap} págs` +
                    ` com os mesmos códigos (1º ${domItems[0]?.codigo || '?'}) — reload pág.${pageFromRangeFinal}…`
                )
                const rec = await forceHomagGridAtPage(page, pageFromRangeFinal, startUrl, {
                  allowReload: true,
                })
                pageNum = rec.at
                lastFirstCode = rec.domItems[0]?.codigo || ''
                zeroNewPages = 0
                skipCodesSignature = ''
                skipSignaturePage = 0
                pagesAdvancedWithoutNew = 0
                continue
              }
              const pagesLeft = Math.max(0, pageLimit - pageFromRangeFinal)
              let skipN = zeroNewPages >= 4 ? 100 : 50
              if (pagesLeft > 0 && skipN > pagesLeft) {
                skipN = pagesLeft
                console.warn(`[HOMAG] Fim do catálogo próximo — saltar só +${skipN} (restam ${pagesLeft} págs).`)
              }
              console.warn(
                `[HOMAG] Pág.${pageFromRangeFinal} — ${domItems.length} peças já na biblioteca` +
                  ` (1º ${domItems[0]?.codigo || '?'}) — saltar +${skipN} Next…`
              )
              skipCodesSignature = sig
              skipSignaturePage = pageFromRangeFinal
              pagesAdvancedWithoutNew += skipN
              await burstSkipPages(skipN)
              const afterRange = await page.evaluate(() => {
                const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
                const all = document.body.innerText.match(re) || []
                return all.length ? all[all.length - 1] : ''
              })
              const rangePage = parseRangePage(afterRange).page || 0
              pageNum = Math.max(rangePage, pageFromRangeFinal + skipN)
              lastFirstCode = ''
              lastRangeForStuck = ''
              continue
            }
            if (zeroNewPages >= 4 && zeroNewPages % 4 === 0) {
              console.warn(
                `[HOMAG] ${zeroNewPages} págs +0 seguidas — avançar Next x10 (pág.${pageFromRangeFinal})…`
              )
              let burst = 0
              while (burst < 10) {
                if (!(await goNext())) break
                burst++
                await page.waitForTimeout(800)
              }
              const afterBurstPage = parseRangePage(
                await page.evaluate(() => {
                  const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
                  const all = document.body.innerText.match(re) || []
                  return all.length ? all[all.length - 1] : ''
                })
              ).page
              pageNum = afterBurstPage || pageFromRangeFinal + burst
              lastFirstCode = ''
              lastRangeForStuck = ''
              continue
            }
            console.warn(
              `[HOMAG] Pág.${pageFromRangeFinal} +0 novas — Next (+1) [${domItems[0]?.codigo || '?'}]…`
            )
            const advancedSkip = await goNext()
            if (advancedSkip) {
              await page.waitForTimeout(1200)
              const newRange = await page.evaluate(
                () => {
                  const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
                  const all = document.body.innerText.match(re) || []
                  return all.length ? all[all.length - 1] : ''
                }
              )
              const newPage = parseRangePage(newRange).page || pageFromRangeFinal + 1
              const peek = await discoverHomagProducts(page)
              const sameCode =
                peek[0]?.codigo &&
                lastFirstCode &&
                peek[0].codigo === lastFirstCode &&
                newRange &&
                rangeNow &&
                newRange !== rangeNow
              if (sameCode && newPage > 250) {
                const rec = await handleStaleGrid(newPage, peek[0].codigo, peek)
                pageNum = rec.at
                lastFirstCode = rec.domItems[0]?.codigo || lastFirstCode
                if (rec.range) lastRangeSeen = rec.range
                zeroNewPages = 0
                continue
              }
              pageNum = newPage
              if (newRange) lastRangeSeen = newRange
              if (peek[0]?.codigo) lastFirstCode = peek[0].codigo
              lastRangeForStuck = rangeNow
              await page.waitForTimeout(800)
              continue
            }
          }
          if (rangeNow && rangeNow === lastRangeForStuck) {
            stuckPages++
            console.warn(`[HOMAG] Mesma página repetida (${stuckPages}/6) — a tentar paginação…`)
            if (stuckPages >= 6) {
              console.warn('[HOMAG] Paginação presa — progresso guardado. Execute o BAT outra vez para RETOMAR.')
              break
            }
          } else {
            stuckPages = 0
            if (zeroNewPages <= 3 || zeroNewPages % 20 === 0) {
              const sample = domItems.slice(0, 2).map((d) => d.codigo).join(', ')
              console.log(`[HOMAG] 0 novas nesta página (códigos: ${sample}…) — a avançar… [${zeroNewPages} páginas seguidas]`)
            }
          }
          lastRangeForStuck = rangeNow
          const advancedOverlap = await goNext()
          if (!advancedOverlap) {
            console.log(`[HOMAG] Sem próxima página (página ${pageFromRangeFinal}) — progresso guardado.`)
            break
          }
          pageNum = pageFromRangeFinal + 1
          await page.waitForTimeout(1500)
          continue
        }
        zeroNewPages = 0
        stuckPages = 0
        lastRangeForStuck = rangeNow
        skipCodesSignature = ''
        skipSignaturePage = 0
        pagesAdvancedWithoutNew = 0

        if (
          process.env.HOMAG_AUTO_RAILWAY !== '0' &&
          items.length - lastRailwayAt >= railwayEvery
        ) {
          const { spawnSync } = await import('node:child_process')
          saveResume(stateFile, outFile, { items, startUrl, pageNum, range: rangeNow, interactive })
          const mergeScript = path.join(__dirname, 'merge-export-para-biblioteca.mjs')
          console.log(`[HOMAG] Checkpoint ${items.length} peças — merge + Railway…`)
          spawnSync(process.execPath, [mergeScript, outFile], { stdio: 'inherit' })
          const railwayScript = path.join(__dirname, '..', 'enviar-biblioteca-railway.mjs')
          const railwayUrl = process.env.RAILWAY_URL || 'https://gest-o-nonato-gestao.up.railway.app'
          spawnSync(process.execPath, [railwayScript, railwayUrl], { stdio: 'inherit' })
          lastRailwayAt = items.length
        }

        const advanced = await goNext()
        if (!advanced) {
          console.log(`[HOMAG] Fim da lista (página ${pageFromRangeFinal}).`)
          importCompletedFully = true
          break
        }
        pageNum = pageFromRangeFinal + 1
        await page.waitForTimeout(2000)
      }
      console.log(`[HOMAG] Exportados via DOM: ${items.length} peça(s) em ${Math.min(pageNum, maxPages)} página(s).`)
    }

    while (!useDomDiscovery && pageNum <= maxPages && !stopAll) {
      await new Promise((r) => setTimeout(r, 800))
      const loc = page.locator(itemSel)
      const count = await loc.count()
      if (count === 0) {
        console.warn(`[HOMAG] Página ${pageNum}: 0 linhas com "${itemSel}". Ajuste config.json (F12).`)
        break
      }

      const metas = []
      for (let i = 0; i < count; i++) {
        const row = loc.nth(i)
        const m = await readRowMeta(row, list, page)
        metas.push({ rowIndex: i, ...m })
      }

      let indicesToBuild = metas.map((_, i) => i)

      if (interactive) {
        console.log(`\n${'='.repeat(60)}\n  PÁGINA ${pageNum} — ${metas.length} linha(s) detetada(s)\n${'='.repeat(60)}`)
        metas.forEach((m, idx) => {
          const c = (m.codigo || '—').slice(0, 40)
          const d = (m.descricao || '—').replace(/\s+/g, ' ').slice(0, 72)
          console.log(`  [${idx + 1}] ${c}  |  ${d}${m.descricao && m.descricao.length > 72 ? '…' : ''}`)
        })
        console.log(`
  • Digite números separados por vírgula (ex: 1,3) — só esses vão para o export
  • t = todos desta página
  • p = avançar para a próxima página SEM exportar desta
  • q = gravar export.json agora e terminar
`)
        const ans = await askLine('  Escolha: ')
        const parsed = parseIndexLine(ans, metas.length)

        if (parsed === 'quit') {
          stopAll = true
          break
        }
        if (parsed === 'nextpage') {
          indicesToBuild = []
        } else if (parsed === 'all') {
          indicesToBuild = metas.map((_, i) => i)
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          indicesToBuild = parsed.map((n) => n - 1)
        } else if (Array.isArray(parsed) && parsed.length === 0 && ans.length > 0) {
          console.warn('  [HOMAG] Nenhum número válido; use 1..N ou t ou p ou q.')
          indicesToBuild = []
        } else {
          indicesToBuild = []
        }
      }

      for (const idx of indicesToBuild) {
        const meta = metas[idx]
        if (!meta) continue
        const codKey = String(meta.codigo || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '')
        if (codKey && codigosVistos.has(codKey)) continue
        const it = await buildItemFromMeta(
          context,
          page,
          list,
          loc,
          meta,
          pageNum,
          idx,
          globalSeq,
          embedOff,
          maxEmbed
        )
        if (codKey) codigosVistos.add(codKey)
        items.push(it)
        globalSeq++
      }

      console.log(
        `[HOMAG] Página ${pageNum}: ${indicesToBuild.length} exportada(s) nesta página, ${items.length} total acumulado.`
      )

      if (stopAll) break

      const advanced = await goToNextHomagPage(page, cfg, itemSel)
      if (!advanced) {
        console.log(`[HOMAG] Fim da lista (página ${pageNum}) — sem botão «Next» ou conteúdo novo.`)
        break
      }
      pageNum++
    }
    } // fim !useApiImport (modo DOM)

    if (items.length === 0) {
      await saveDebugSnapshot(page, OUT_DIR)
      console.error('[HOMAG] Nada exportado — biblioteca NÃO foi alterada. Ver out/debug-last-page.png')
      process.exit(1)
    }

    if (importCompletedFully) {
      finalizeExport(outFile, stateFile, {
        items,
        startUrl,
        interactive,
        pageNum: lastSavedPageNum,
        range: lastSavedRange,
      })
      console.log(`\n[HOMAG] Importação COMPLETA: ${items.length} itens -> ${outFile}`)
    } else {
      saveResume(stateFile, outFile, {
        items,
        startUrl,
        pageNum: lastSavedPageNum,
        range: lastSavedRange,
        interactive,
      })
      console.log(`\n[HOMAG] Progresso guardado: ${items.length} itens (página ~${lastSavedPageNum}).`)
      console.log('[HOMAG] Execute IMPORTAR-TUDO-HOMAG.bat outra vez para CONTINUAR (não recomeça do zero).')
      exitCode = 2
    }
    if (process.env.HOMAG_AUTO_MERGE !== '0') {
      const { spawnSync } = await import('node:child_process')
      const mergeScript = path.join(__dirname, 'merge-export-para-biblioteca.mjs')
      console.log('[HOMAG] A gravar na biblioteca do servidor…')
      const r = spawnSync(process.execPath, [mergeScript, outFile], { stdio: 'inherit' })
      if (r.status !== 0) {
        console.warn('[HOMAG] merge falhou — importe manualmente com: npm run homag:merge')
      } else if (process.env.HOMAG_AUTO_RAILWAY !== '0') {
        const railwayScript = path.join(__dirname, '..', 'enviar-biblioteca-railway.mjs')
        const railwayUrl =
          process.env.RAILWAY_URL || 'https://gest-o-nonato-gestao.up.railway.app'
        console.log(`[HOMAG] A enviar biblioteca para Railway (${railwayUrl})…`)
        const rr = spawnSync(process.execPath, [railwayScript, railwayUrl], { stdio: 'inherit' })
        if (rr.status !== 0) {
          console.warn('[HOMAG] Envio Railway falhou — execute ENVIAR-362-PECAS-RAILWAY.bat')
        }
      }
    } else {
      console.log('[HOMAG] Na app: Biblioteca → Importação → Carregar export.json\n')
    }
  } finally {
    await browser.close()
  }
  try {
    const notifyScript = path.join(__dirname, 'notify-homag-conclusao.mjs')
    spawnSync(process.execPath, [notifyScript, String(exitCode)], { stdio: 'inherit', windowsHide: true })
  } catch {
    /* ignore */
  }
  process.exit(exitCode)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

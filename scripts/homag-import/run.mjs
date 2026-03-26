#!/usr/bin/env node
/**
 * Importação HOMAG shop — Playwright.
 *
 * Modos:
 *   Página inteira (automático): exporta todos os itens encontrados (1 ou mais páginas — maxPages no config).
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
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, 'out')
const IMG_DIR = path.join(OUT_DIR, 'images')

function loadConfig() {
  const configPath = process.env.HOMAG_CONFIG || path.join(__dirname, 'config.json')
  if (!fs.existsSync(configPath)) {
    console.error(
      'Falta config.json. Copie scripts/homag-import/config.example.json para config.json e edite os seletores.'
    )
    process.exit(1)
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'))
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

async function downloadImage(context, page, url, filePath) {
  if (!url || !url.startsWith('http')) return false
  try {
    const r = await context.request.get(url, {
      headers: { Referer: page.url() }
    })
    if (!r.ok()) return false
    fs.writeFileSync(filePath, await r.body())
    return true
  } catch {
    try {
      const r2 = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HomagImport/1.0)' } })
      if (!r2.ok) return false
      const ab = await r2.arrayBuffer()
      fs.writeFileSync(filePath, Buffer.from(ab))
      return true
    } catch {
      return false
    }
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

async function main() {
  const cfg = loadConfig()
  const startUrl = cfg.startUrl
  if (!startUrl || typeof startUrl !== 'string') {
    console.error('config.json: defina startUrl')
    process.exit(1)
  }

  fs.mkdirSync(IMG_DIR, { recursive: true })

  const headless = process.env.HOMAG_HEADLESS !== '0'
  const interactive = process.env.HOMAG_INTERACTIVE === '1'
  const browser = await chromium.launch({ headless })
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: 'it-IT',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  })
  const page = await context.newPage()
  page.setDefaultTimeout(45000)

  const embedOff = process.env.HOMAG_EMBED_IMAGES === '0'
  const maxEmbed = Math.min(Math.max(Number(process.env.HOMAG_EMBED_MAX_BYTES) || 600000, 5000), 2000000)

  const items = []
  let globalSeq = 0

  try {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 90000 })

    const manual = process.env.HOMAG_MANUAL === '1'
    const user = process.env.HOMAG_USER || ''
    const pass = process.env.HOMAG_PASS || ''

    if (manual) {
      process.stdout.write(
        '\n[HOMAG] Modo manual: faça login e navegue até à lista desejada.\nQuando estiver pronto, volte a este terminal e prima Enter...\n'
      )
      await new Promise((resolve) => process.stdin.once('data', resolve))
    } else if (user && pass && cfg.login) {
      const L = cfg.login
      if (L.userSelector) await page.locator(L.userSelector).first().fill(user)
      if (L.passSelector) await page.locator(L.passSelector).first().fill(pass)
      if (L.submitSelector) await page.locator(L.submitSelector).first().click()
      await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {})
    } else if (!manual) {
      console.warn(
        '[HOMAG] Sem HOMAG_USER/HOMAG_PASS: use HOMAG_MANUAL=1 para login no browser, ou defina credenciais.'
      )
    }

    const list = cfg.list || {}
    const itemSel = list.itemSelector
    if (!itemSel) {
      console.error('config.json: defina list.itemSelector')
      process.exit(1)
    }

    const maxPages = Math.min(Math.max(1, Number(cfg.maxPages) || 20), 500)
    let pageNum = 1
    let stopAll = false

    while (pageNum <= maxPages && !stopAll) {
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
        items.push(it)
        globalSeq++
      }

      if (stopAll) break

      const pag = cfg.pagination || {}
      const nextSel = pag.nextSelector
      if (!nextSel) break
      const nextBtn = page.locator(nextSel).first()
      const vis = await nextBtn.isVisible().catch(() => false)
      if (!vis) break
      const disabled = await nextBtn.isDisabled().catch(() => false)
      if (disabled) break
      await nextBtn.click()
      await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {})
      pageNum++
    }

    const out = {
      gerado_em: new Date().toISOString(),
      origem_url: startUrl,
      modo: interactive ? 'interativo' : 'automatico',
      total: items.length,
      itens: items
    }
    const outFile = path.join(OUT_DIR, 'export.json')
    fs.writeFileSync(outFile, JSON.stringify(out, null, 2), 'utf8')
    console.log(`\n[HOMAG] Concluído: ${items.length} itens -> ${outFile}`)
    console.log(
      '[HOMAG] Na app: Biblioteca de Peças → Importação → Carregar export.json (ou cole o JSON).\n'
    )
  } finally {
    await browser.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

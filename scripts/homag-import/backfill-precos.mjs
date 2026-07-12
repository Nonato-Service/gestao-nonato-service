#!/usr/bin/env node
/**
 * Preenche preços HOMAG — requer login B2B (HOMAG_USER / HOMAG_PASS).
 */
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner } from './pagination.mjs'
import { installHomagPaginationGuard } from './pagination.mjs'
import { runHomagApiImport } from './api-import.mjs'
import { loadResume, saveResume, finalizeExport } from './resume.mjs'
import { normCodigo } from './resume.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..', '..')
const OUT_DIR = path.join(__dirname, 'out')
const DATA_DIR = path.join(root, 'data')
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

function loadConfig() {
  return cfg
}

function pecaToExportItem(p) {
  return {
    codigo: String(p.codigo ?? '').trim(),
    nome: String(p.nome ?? p.descricao ?? '').trim(),
    descricao: String(p.descricao ?? p.nome ?? '').trim(),
    preco: String(p.preco ?? '').trim(),
    imagem: '',
    imagem_url: String(p.imagem_url ?? '').trim(),
    imagem_local: String(p.imagem_local ?? '').trim(),
  }
}

const bibPath = path.join(DATA_DIR, 'nonato-pecas-biblioteca.json')
if (!fs.existsSync(bibPath)) {
  console.error('Biblioteca não encontrada:', bibPath)
  process.exit(1)
}

const biblioteca = JSON.parse(fs.readFileSync(bibPath, 'utf8'))
if (!Array.isArray(biblioteca) || biblioteca.length === 0) {
  console.error('Biblioteca vazia.')
  process.exit(1)
}

const items = biblioteca.map(pecaToExportItem)
const codigosVistos = new Set(items.map((p) => normCodigo(p.codigo)).filter(Boolean))
const outFile = path.join(OUT_DIR, 'export.json')
const stateFile = path.join(OUT_DIR, 'import-state.json')

const user = process.env.HOMAG_USER || ''
const pass = process.env.HOMAG_PASS || ''
if (!user || !pass) {
  console.error('Defina HOMAG_USER e HOMAG_PASS (ficheiro homag-login.env).')
  process.exit(1)
}

process.env.HOMAG_PRICES_ONLY = '1'
process.env.HOMAG_API_BACKFILL_PRICES = '1'

const headless = process.env.HOMAG_HEADLESS !== '0'
const browser = await chromium.launch({ headless })
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  locale: 'en-AU',
})
await installHomagPaginationGuard(context)
const page = await context.newPage()

try {
  await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await dismissCookieBanner(page)
  const L = cfg.login || {}
  if (L.userSelector) await page.locator(L.userSelector).first().fill(user)
  if (L.passSelector) await page.locator(L.passSelector).first().fill(pass)
  if (L.submitSelector) await page.locator(L.submitSelector).first().click()
  await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => {})
  console.log('[HOMAG] Login enviado — URL:', page.url())

  await runHomagApiImport({
    context,
    page,
    startUrl: cfg.startUrl,
    items,
    codigosVistos,
    stateFile,
    outFile,
    interactive: false,
    embedOff: true,
    maxEmbed: 0,
    buildItemFromDiscovered: async (_ctx, _page, meta) => ({
      codigo: meta.codigo,
      nome: meta.descricao,
      descricao: meta.descricao,
      preco: meta.preco || '',
      imagem: '',
      imagem_url: meta.imagemUrl || '',
      imagem_local: '',
    }),
    saveResumeFn: (p) => saveResume(stateFile, outFile, p),
    apiState: { doneBuckets: [] },
  })

  finalizeExport(outFile, stateFile, {
    items,
    startUrl: cfg.startUrl,
    interactive: false,
    pageNum: 0,
    range: 'backfill preços',
  })

  const comPreco = items.filter((p) => String(p.preco || '').trim()).length
  console.log(`\n[HOMAG] Peças com preço no export: ${comPreco} / ${items.length}`)

  const mergeScript = path.join(__dirname, 'merge-export-para-biblioteca.mjs')
  console.log('[HOMAG] A gravar preços na biblioteca local…')
  const r = spawnSync(process.execPath, [mergeScript, outFile], { stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status || 1)

  if (process.env.HOMAG_AUTO_RAILWAY !== '0') {
    const railwayScript = path.join(__dirname, '..', 'enviar-biblioteca-railway.mjs')
    const railwayUrl = process.env.RAILWAY_URL || 'https://gest-o-nonato-gestao.up.railway.app'
    console.log(`[HOMAG] A enviar biblioteca para Railway (${railwayUrl})…`)
    const rr = spawnSync(process.execPath, [railwayScript, railwayUrl], { stdio: 'inherit' })
    if (rr.status !== 0) process.exit(rr.status || 1)
  }
} finally {
  await browser.close()
}

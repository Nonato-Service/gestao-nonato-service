#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, jumpToHomagPage, waitForHomagRange, goToNextHomagPage, patchHomagPagination } from './pagination.mjs'

async function getItemRange(page) {
  return page.evaluate(() => {
    const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
    const all = document.body.innerText.match(re) || []
    return all.length ? all[all.length - 1] : ''
  })
}
import { discoverHomagProducts } from './discover-products.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

async function getCurrentHomagPage(page) {
  const range = await getItemRange(page)
  const m = String(range || '').match(/(\d+)\s*-\s*(\d+)/)
  if (!m) return 0
  const start = parseInt(m[1], 10)
  const end = parseInt(m[2], 10)
  return Math.ceil(start / Math.max(1, end - start + 1))
}

async function slowNext(page) {
  await patchHomagPagination(page)
  const br = await getItemRange(page)
  const before = (await discoverHomagProducts(page))[0]?.codigo || ''
  if (!(await goToNextHomagPage(page, cfg, cfg.list?.itemSelector || ''))) return false
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(600)
    const range = await getItemRange(page)
    const after = (await discoverHomagProducts(page))[0]?.codigo || ''
    if (range !== br && after && after !== before) return true
  }
  return false
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const apiHits = []
page.on('response', async (res) => {
  const url = res.url()
  if (!/search|product|commerce|category|experience/i.test(url)) return
  try {
    const ct = res.headers()['content-type'] || ''
    if (!/json|javascript/i.test(ct)) return
    const body = await res.text()
    if (body.length < 200 || !/\d{10}/.test(body)) return
    const codes = [...body.matchAll(/\b([1-9]\d{9})\b/g)].map((m) => m[1]).slice(0, 5)
    apiHits.push({ url: url.slice(0, 100), codes, len: body.length })
  } catch {
    /* ignore */
  }
})

await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
await jumpToHomagPage(page, 256)
await page.waitForTimeout(2000)

const rows = []
for (let i = 0; i < 3; i++) {
  const range = await getItemRange(page)
  const dom = await discoverHomagProducts(page)
  rows.push({ pg: await getCurrentHomagPage(page), range, first: dom[0]?.codigo, codes: dom.map((d) => d.codigo).slice(0, 4) })
  if (i < 2) await slowNext(page)
}

console.log(JSON.stringify({ rows, apiSample: apiHits.slice(-5) }, null, 2))
await browser.close()

#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { discoverHomagProducts } from './discover-products.mjs'
import { dismissCookieBanner } from './pagination.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))
const base = cfg.startUrl.split('?')[0]
const params = new URL(cfg.startUrl).searchParams

function buildUrl(stateObj) {
  const p = new URLSearchParams(params)
  p.set('c__results_layout_state', JSON.stringify(stateObj))
  return `${base}?${p.toString()}`
}

const tries = [
  {},
  { currentPage: 256 },
  { pageNumber: 256 },
  { page: 256 },
  { currentPageNumber: 256 },
  { offset: 5100 },
  { start: 5100 },
  { pageSize: 20, currentPage: 256 },
  { pageSize: 20, pageNumber: 256 },
]

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

const results = []
for (const state of tries) {
  const url = buildUrl(state)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await dismissCookieBanner(page)
  await page.waitForTimeout(10000)
  const range =
    (await page.evaluate(
      () => (document.body.innerText.match(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i) || [])[0] || ''
    )) || ''
  const dom = await discoverHomagProducts(page)
  results.push({
    state,
    range,
    count: dom.length,
    first: dom[0]?.codigo,
  })
  console.log(JSON.stringify(results[results.length - 1]))
}

await browser.close()

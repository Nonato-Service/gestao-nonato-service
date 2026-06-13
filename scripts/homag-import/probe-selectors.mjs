#!/usr/bin/env node
/**
 * Abre a página HOMAG e lista seletores candidatos (útil após login manual).
 * Uso: HOMAG_MANUAL=1 node scripts/homag-import/probe-selectors.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const configPath = process.env.HOMAG_CONFIG || path.join(__dirname, 'config.json')
if (!fs.existsSync(configPath)) {
  console.error('Copie config.example.json → config.json primeiro.')
  process.exit(1)
}
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const startUrl = cfg.startUrl

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()
await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 90000 })

if (process.env.HOMAG_MANUAL === '1') {
  process.stdout.write('\nFaça login e abra a lista de peças. Prima Enter no terminal...\n')
  await new Promise((r) => process.stdin.once('data', r))
}

await page.waitForTimeout(3000)

const report = await page.evaluate(() => {
  const candidates = [
    'commerce_product-tile',
    'commerce-product-tile',
    '[data-product-code]',
    '[data-productid]',
    'article',
    'li',
    'tr',
    'img',
  ]
  const out = []
  for (const sel of candidates) {
    try {
      const n = document.querySelectorAll(sel).length
      if (n > 0) out.push({ sel, count: n })
    } catch {
      /* ignore invalid */
    }
  }
  const imgs = [...document.querySelectorAll('img[src]')]
    .map((i) => i.getAttribute('src') || '')
    .filter((s) => /cms|product|thumb|image/i.test(s))
    .slice(0, 5)
  return { title: document.title, url: location.href, candidates: out, sampleImgSrc: imgs }
})

console.log(JSON.stringify(report, null, 2))
await browser.close()

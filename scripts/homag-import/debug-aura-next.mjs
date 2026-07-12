#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, jumpToHomagPage, waitForHomagRange, goToNextHomagPage } from './pagination.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))
const OUT = path.join(__dirname, 'out', 'aura-next-dump.json')

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

const captured = []
page.on('response', async (res) => {
  const url = res.url()
  if (!/\/aura\?/.test(url) && !/\/aura\b/.test(url)) return
  try {
    const body = await res.text()
    const codes = [...body.matchAll(/\b([1-9]\d{9})\b/g)].map((m) => m[1])
    const uniq = [...new Set(codes)]
    if (uniq.length >= 3) {
      captured.push({ url: url.slice(0, 150), len: body.length, codes: uniq.slice(0, 25), has2201663021: uniq.includes('2201663021') })
    }
  } catch {
    /* ignore */
  }
})

await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
await jumpToHomagPage(page, 251)
await page.waitForTimeout(2000)
captured.length = 0
await goToNextHomagPage(page, cfg, cfg.list?.itemSelector || '')
await page.waitForTimeout(5000)

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(captured, null, 2))
console.log('captured', captured.length)
console.log(JSON.stringify(captured.slice(0, 5), null, 2))
await browser.close()

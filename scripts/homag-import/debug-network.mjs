#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))
const hits = []

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
page.on('response', async (res) => {
  const url = res.url()
  const ct = res.headers()['content-type'] || ''
  if (!/json|graphql|javascript/i.test(ct) && !/search|product|commerce|category/i.test(url)) return
  try {
    const body = await res.text()
    if (body.length > 500 && /product|sku|2220050880|items/i.test(body)) {
      hits.push({ url: url.slice(0, 120), len: body.length, sample: body.slice(0, 200) })
    }
  } catch {
    /* ignore */
  }
})
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForTimeout(15000)
console.log(JSON.stringify(hits.slice(0, 8), null, 2))
await browser.close()

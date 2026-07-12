#!/usr/bin/env node
/** Grava pedidos POST /aura com produtos para replay. */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, waitForHomagRange } from './pagination.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))
const OUT = path.join(__dirname, 'out', 'aura-requests.json')

const posts = []
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

page.on('request', (req) => {
  if (req.method() !== 'POST' || !req.url().includes('/aura')) return
  const post = req.postData() || ''
  if (post.length < 100) return
  posts.push({ url: req.url(), headers: req.headers(), body: post })
})

await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
await page.waitForTimeout(15000)

fs.writeFileSync(OUT, JSON.stringify(posts.map((p) => ({ url: p.url, bodyLen: p.body.length, body: p.body.slice(0, 8000) })), null, 2))
console.log('posts', posts.length)
for (const p of posts) {
  if (/product|search|category|page/i.test(p.body)) {
    console.log('---', p.body.slice(0, 400))
  }
}
await browser.close()

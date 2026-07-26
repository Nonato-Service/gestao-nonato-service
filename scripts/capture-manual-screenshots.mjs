#!/usr/bin/env node
/**
 * Captura screenshots reais para o Manual do Programa.
 *
 * Uso:
 *   npm run manual:capture-screenshots
 *   MANUAL_LOCALES=pt-BR,es npm run manual:capture-screenshots
 *   MANUAL_CAPTURE_BASE_URL=https://... npm run manual:capture-screenshots
 *
 * Variáveis:
 *   MANUAL_CAPTURE_BASE_URL — URL da app (default: http://127.0.0.1:3000)
 *   MANUAL_CAPTURE_USERNAME — utilizador login (default: admin)
 *   MANUAL_CAPTURE_PASSWORD — senha (default: demo1234; bootstrap se sem users)
 *   MANUAL_LOCALES — lista separada por vírgula (default: pt-BR)
 *   MANUAL_SKIP_BUILD — se 1, não corre npm run build
 *   MANUAL_HEADLESS — 0 para ver o browser
 */
import { spawn } from 'child_process'
import fs from 'fs'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import {
  loadManualScreenshotPages,
  MANUAL_LOCALES,
  MODULE_GROUP_ICON,
} from './lib/manualScreenshotPages.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const ASSETS_ROOT = path.join(ROOT, 'public/manual/assets')

function loadLocalCaptureCredentials() {
  if (process.env.MANUAL_CAPTURE_USERNAME && process.env.MANUAL_CAPTURE_PASSWORD) {
    return {
      username: process.env.MANUAL_CAPTURE_USERNAME,
      password: process.env.MANUAL_CAPTURE_PASSWORD,
    }
  }
  try {
    const raw = fs.readFileSync(path.join(ROOT, 'data/nonato-users.json'), 'utf8')
    const users = JSON.parse(raw)
    const admin =
      users.find((u) => u?.isAdmin) ||
      users.find((u) => String(u?.role || '').toLowerCase().includes('admin')) ||
      users[0]
    if (admin?.password) {
      return {
        username: String(admin.email || admin.name || 'admin'),
        password: String(admin.password),
      }
    }
  } catch {
    /* bootstrap / sem ficheiro */
  }
  return { username: 'admin', password: 'demo1234' }
}

const CREDS = loadLocalCaptureCredentials()
const BASE_URL = (process.env.MANUAL_CAPTURE_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const USERNAME = CREDS.username
const PASSWORD = CREDS.password
const LOCALES = (process.env.MANUAL_LOCALES || 'pt-BR')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const HEADLESS = process.env.MANUAL_HEADLESS !== '0'
const SKIP_BUILD = process.env.MANUAL_SKIP_BUILD === '1'

const PAGES = loadManualScreenshotPages()

function log(...args) {
  process.stdout.write(`${args.join(' ')}\n`)
}

function waitForUrl(url, timeoutMs = 120000) {
  const target = new URL(url)
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.request(
        {
          hostname: target.hostname,
          port: target.port || (target.protocol === 'https:' ? 443 : 80),
          path: target.pathname || '/',
          method: 'GET',
          timeout: 4000,
        },
        (res) => {
          res.resume()
          if (res.statusCode && res.statusCode < 500) resolve()
          else if (Date.now() - started > timeoutMs) reject(new Error(`Timeout à espera de ${url}`))
          else setTimeout(tick, 1500)
        }
      )
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) reject(new Error(`Timeout à espera de ${url}`))
        else setTimeout(tick, 1500)
      })
      req.end()
    }
    tick()
  })
}

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32', ...opts })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} ${args.join(' ')} exit ${code}`))
    })
  })
}

async function ensureServer() {
  try {
    await waitForUrl(BASE_URL, 4000)
    log(`Servidor já activo em ${BASE_URL}`)
    return null
  } catch {
    /* continuar */
  }

  if (!SKIP_BUILD) {
    log('A compilar (npm run build)...')
    await runCmd('npm', ['run', 'build'])
  }

  log(`A iniciar servidor em ${BASE_URL}...`)
  const child = spawn('npm', ['run', 'start'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, PORT: new URL(BASE_URL).port || '3000' },
  })

  await waitForUrl(BASE_URL, 180000)
  return child
}

async function loginViaApi(request) {
  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { username: USERNAME, password: PASSWORD },
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`Login falhou (${res.status()}): ${body}`)
  }
  const data = await res.json()
  if (!data?.user) throw new Error('Login sem utilizador na resposta')
  return data.user
}

async function dismissUiNoise(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[class*="sw-update"], .pwa-update-banner').forEach((el) => el.remove())
  })
  const closeButtons = page.locator('button[aria-label="Fechar"], button[aria-label="Close"]')
  if (await closeButtons.count()) {
    await closeButtons.first().click({ timeout: 800 }).catch(() => {})
  }
}

async function jsClick(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return false
    ;(el).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    return true
  }, selector)
}

async function expandModuleGroup(page, moduleId) {
  if (moduleId === 'intro' || moduleId === 'outros') return

  if (moduleId === 'empresa-institucional') {
    await jsClick(page, '[aria-controls="sidebar-empresa-institucional-actions"]')
    await page.waitForTimeout(300)
    return
  }

  const icon = MODULE_GROUP_ICON[moduleId]
  if (!icon) return

  await page.evaluate((emoji) => {
    const headers = [...document.querySelectorAll('.sidebar-group-header')]
    const hit = headers.find((h) => h.textContent?.includes(emoji))
    if (hit) hit.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
  }, icon)
  await page.waitForTimeout(350)
}

async function navigateToPage(page, entry) {
  page.once('dialog', (d) => d.accept().catch(() => {}))

  if (!entry.action) {
    await jsClick(page, '.main-content-action-btn--home').catch(() => {})
    await page.waitForTimeout(entry.waitMs || 800)
    return
  }

  await expandModuleGroup(page, entry.moduleId)

  const clicked = await jsClick(page, `[data-sidebar-nav-action="${entry.action}"]`)
  if (!clicked) {
    const icon = MODULE_GROUP_ICON[entry.moduleId]
    if (icon) {
      await page.evaluate((emoji) => {
        const headers = [...document.querySelectorAll('.sidebar-group-header')]
        const hit = headers.find((h) => h.textContent?.includes(emoji))
        if (hit) hit.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
      }, icon)
    }
  }

  await page.waitForTimeout(entry.waitMs || 1200)
  await dismissUiNoise(page)
}

async function captureLocale(browser, locale) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: locale === 'en' ? 'en-GB' : locale,
  })

  const loginRes = await context.request.post(`${BASE_URL}/api/auth/login`, {
    data: { username: USERNAME, password: PASSWORD },
    timeout: 120000,
  })
  if (!loginRes.ok()) {
    const body = await loginRes.text()
    throw new Error(`Login falhou (${loginRes.status()}): ${body}`)
  }
  const loginData = await loginRes.json()
  const user = loginData.user
  if (!user) throw new Error('Login sem utilizador na resposta')

  await context.addInitScript(
    ({ lang, cachedUser }) => {
      try {
        localStorage.setItem('nonato-language', lang)
        if (cachedUser) {
          localStorage.setItem(
            'nonato-last-auth-user-v1',
            JSON.stringify({ ...cachedUser, savedAt: new Date().toISOString() })
          )
        }
      } catch {
        /* ignorar */
      }
    },
    { lang: locale, cachedUser: user }
  )

  const page = await context.newPage()
  page.on('dialog', (d) => d.accept().catch(() => {}))

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 })

  // Splash / boot: tentar «Acessar Sistema» se ainda na landing
  const accessBtn = page.getByRole('button', { name: /Acessar|Access|Acceder|Accéder|Accedi|Zugang/i }).first()
  if (await accessBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await accessBtn.click().catch(() => {})
    await page.waitForTimeout(800)
  }

  const loginBtn = page.getByRole('button', { name: /Fazer login|Entrar|Login|Sign in/i }).first()
  if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await loginBtn.click().catch(() => {})
    await page.waitForTimeout(500)
    await page.locator('.ns-login-field').first().fill(USERNAME).catch(() => {})
    await page.locator('.ns-login-field').nth(1).fill(PASSWORD).catch(() => {})
    await page.getByRole('button', { name: /Entrar|Login|Sign in/i }).click().catch(() => {})
    await page.waitForTimeout(2000)
  }

  await page.waitForSelector('.app-layout, .sidebar', { timeout: 120000 })
  await page.waitForTimeout(2500)
  await dismissUiNoise(page)

  let ok = 0
  let fail = 0

  for (const entry of PAGES) {
    const outDir = path.join(ASSETS_ROOT, locale, entry.id)
    const outFile = path.join(outDir, '01.png')
    fs.mkdirSync(outDir, { recursive: true })

    try {
      await navigateToPage(page, entry)
      const target = page.locator('.app-layout').first()
      await target.waitFor({ state: 'visible', timeout: 15000 })
      await page.screenshot({
        path: outFile,
        type: 'png',
        fullPage: false,
      })
      ok += 1
      log(`  ✓ ${locale}/${entry.id}`)
    } catch (err) {
      fail += 1
      log(`  ✗ ${locale}/${entry.id}: ${err?.message || err}`)
    }
  }

  await context.close()
  return { ok, fail }
}

async function main() {
  log(`Manual screenshots — ${PAGES.length} páginas × ${LOCALES.length} locale(s)`)
  log(`Destino: public/manual/assets/{locale}/{pageId}/01.png`)

  const invalidLocales = LOCALES.filter((l) => !MANUAL_LOCALES.includes(l))
  if (invalidLocales.length) {
    throw new Error(`Locales inválidos: ${invalidLocales.join(', ')}`)
  }

  const server = await ensureServer()

  const browser = await chromium.launch({ headless: HEADLESS })
  try {
    // Verificar credenciais
    const probe = await browser.newContext()
    const probeRes = await probe.request.post(`${BASE_URL}/api/auth/login`, {
      data: { username: USERNAME, password: PASSWORD },
    })
    if (!probeRes.ok()) {
      const body = await probeRes.text()
      throw new Error(`Login falhou (${probeRes.status()}): ${body}`)
    }
    const probeData = await probeRes.json()
    log(`Login OK: ${probeData.user?.name || probeData.user?.id} (${USERNAME})`)
    await probe.close()

    let totalOk = 0
    let totalFail = 0

    for (const locale of LOCALES) {
      log(`\nIdioma: ${locale}`)
      const { ok, fail } = await captureLocale(browser, locale)
      totalOk += ok
      totalFail += fail
    }

    log(`\nConcluído: ${totalOk} capturas OK, ${totalFail} falhas.`)
    if (totalFail > 0) process.exitCode = 1
  } finally {
    await browser.close()
    if (server) {
      server.kill('SIGTERM')
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

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
const PAGE_FILTER = (process.env.MANUAL_PAGE_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const HEADLESS = process.env.MANUAL_HEADLESS !== '0'
const SKIP_BUILD = process.env.MANUAL_SKIP_BUILD === '1'

const PAGES = loadManualScreenshotPages().filter((p) =>
  PAGE_FILTER.length === 0 ? true : PAGE_FILTER.includes(p.id)
)

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

/** Espera o overlay «A preparar o seu ambiente…» desaparecer antes de capturar. */
async function waitForAppReady(page) {
  await page
    .waitForFunction(() => !document.querySelector('.ns-boot-overlay'), { timeout: 300000 })
    .catch(async () => {
      const visible = await page.locator('.ns-boot-overlay').isVisible().catch(() => false)
      if (visible) throw new Error('Timeout: overlay de arranque ainda visível')
    })
  await page.waitForTimeout(400)
}

/** Abre o painel completo para mostrar sidebar e permitir navegar entre módulos. */
async function enterWorkspace(page) {
  const enterBtn = page
    .locator('.ns-dashboard-entry button, .ns-dashboard-entry-showcase__enter')
    .first()
  const byRole = page.getByRole('button', {
    name: /Entrar no sistema|Enter the system|Entrar en el sistema|Entrer dans le système|Entra nel sistema|Ins System gehen/i,
  }).first()

  if (await enterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await enterBtn.click().catch(() => {})
  } else if (await byRole.isVisible({ timeout: 2000 }).catch(() => false)) {
    await byRole.click().catch(() => {})
  }

  await page
    .waitForSelector('.sidebar:not(.sidebar--hidden-entry)', { state: 'visible', timeout: 60000 })
    .catch(() => {})
  await page.waitForSelector('.app-layout-workspace-open, .ns-dashboard-full, .main-content-area', {
    timeout: 30000,
  }).catch(() => {})
  await dismissUiNoise(page)
  await page.waitForTimeout(600)
}

async function assertReadyForCapture(page, entryId) {
  const overlayVisible = await page.locator('.ns-boot-overlay').isVisible().catch(() => false)
  if (overlayVisible) {
    throw new Error(`Overlay de arranque visível ao capturar ${entryId}`)
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

const MODULE_HEADER_SELECTOR = {
  'gestao-tecnica': '[data-sidebar-zone="operacao"] .sidebar-group-header',
  'parceiros-comercial':
    '[data-sidebar-zone="comercial"] .sidebar-nav-cluster:nth-child(1) .sidebar-group-header',
  'gestao-custos':
    '[data-sidebar-zone="comercial"] .sidebar-nav-cluster:nth-child(2) .sidebar-group-header',
  'gestao-financeira':
    '[data-sidebar-zone="comercial"] .sidebar-nav-cluster:nth-child(3) .sidebar-group-header',
  'documentacao-relatorios':
    '[data-sidebar-zone="documentacao"] .sidebar-nav-cluster:first-child .sidebar-group-header',
  'pecas-biblioteca':
    '[data-sidebar-zone="pecas-armazem"] > button.sidebar-group-header',
  'gestao-industrial': '[data-sidebar-zone="industrial"] > button.sidebar-group-header',
  'checklist-group': '[data-sidebar-zone="checklist"] .sidebar-group-header',
  'comunicacao-interna': '[data-sidebar-zone="comunicacao"] .sidebar-group-header',
  'manuais-informacoes-tecnicas':
    '[data-sidebar-zone="pecas-armazem"] .sidebar-nav-subcluster .sidebar-group-header',
  'biblia-nonato-service':
    '[data-sidebar-zone="pecas-armazem"] .sidebar-nav-subcluster .sidebar-group-header',
  'almoxarifado-armazem':
    '[data-sidebar-zone="pecas-armazem"] .sidebar-nav-subcluster .sidebar-group-header',
  'empresa-institucional': '.sidebar-nav-cluster--empresa-institucional .sidebar-group-header',
}

async function clickSidebarEntry(page, entry) {
  for (const sel of [
    `[data-sidebar-nav-action="${entry.action}"]`,
    `[data-button-action="${entry.action}"]`,
  ]) {
    const loc = page.locator(sel).first()
    if (await loc.isVisible({ timeout: 900 }).catch(() => false)) {
      await loc.scrollIntoViewIfNeeded().catch(() => {})
      await loc.click({ timeout: 15000, force: true })
      return
    }
  }

  if (entry.action === 'open-biblioteca-pecas' || entry.action === 'open-importacao-pecas') {
    const pecasHeader = page.locator('[data-sidebar-zone="pecas-armazem"] > button.sidebar-group-header').first()
    await pecasHeader.click({ timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(500)
    const hubBtn = page.locator('[data-sidebar-zone="pecas-armazem"] .sidebar-action-buttons button').first()
    await hubBtn.click({ timeout: 8000 })
    await page.waitForTimeout(1400)
    if (entry.action === 'open-importacao-pecas') {
      await page
        .locator('button, [role="tab"]')
        .filter({ hasText: /import/i })
        .first()
        .click({ timeout: 6000 })
        .catch(() => {})
      await page.waitForTimeout(800)
    }
    return
  }

  if (entry.action === 'open-checklist-hub') {
    const chkHeader = page.locator('[data-sidebar-zone="checklist"] .sidebar-group-header').first()
    await chkHeader.click({ timeout: 8000 })
    await page.waitForTimeout(1200)
    return
  }

  if (entry.moduleId === 'comunicacao-interna') {
    await page
      .locator('[data-sidebar-zone="comunicacao"] .sidebar-group-header')
      .first()
      .click({ timeout: 8000 })
      .catch(() => {})
    await page.waitForTimeout(500)
    const label = entry.fallbackLabel || ''
    const byText = page
      .locator('[data-sidebar-zone="comunicacao"] .sidebar-action-buttons button')
      .filter({ hasText: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .first()
    if (await byText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await byText.click({ timeout: 15000, force: true })
      return
    }
  }

  if (entry.moduleId === 'gestao-industrial') {
    await page
      .locator('[data-sidebar-zone="industrial"] .sidebar-group-header')
      .first()
      .click({ timeout: 8000, force: true })
      .catch(() => {})
    await page.waitForTimeout(500)
    const label = entry.fallbackLabel || ''
    const byText = page
      .locator('[data-sidebar-zone="industrial"] .sidebar-action-buttons button')
      .filter({ hasText: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .first()
    if (await byText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await byText.click({ timeout: 15000, force: true })
      return
    }
  }

  if (entry.action === 'open-translator') {
    await dismissUiNoise(page)
    await page
      .locator('[data-sidebar-zone="sistema"] .sidebar-group-header')
      .filter({ hasText: /extras|extra/i })
      .first()
      .click({ timeout: 8000, force: true })
      .catch(() => {})
    await page.waitForTimeout(500)
    const byText = page
      .locator('[data-sidebar-zone="sistema"] .sidebar-action-buttons button')
      .filter({ hasText: /tradutor|translator|traductor|traducteur|traduttore|übersetzer/i })
      .first()
    if (await byText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await byText.click({ timeout: 15000, force: true })
      return
    }
  }

  if (entry.action === 'open-extra') {
    await page
      .locator('[data-sidebar-zone="sistema"] .sidebar-group-header')
      .filter({ hasText: /extras/i })
      .first()
      .click({ timeout: 8000 })
    await page.waitForTimeout(600)
    return
  }

  if (entry.action === 'open-manual-gestor') {
    await clickSidebarEntry(page, { ...entry, action: 'open-extra', moduleId: 'outros' })
    await page
      .getByRole('button', { name: /manual.*gestor|gestor.*manual|manager manual/i })
      .first()
      .click({ timeout: 8000 })
      .catch(() => {})
    await page.waitForTimeout(800)
    return
  }

  if (entry.fallbackLabel) {
    const clicked = await page.evaluate((label) => {
      const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase()
      const want = norm(label)
      const buttons = [...document.querySelectorAll('.sidebar-action-btn, .sidebar-group-header')]
      for (const b of buttons) {
        if (b.offsetParent === null) continue
        const title = b.querySelector('.sidebar-empresa-entry-title, .sidebar-nav-label-text')
        const text = norm(title?.textContent || b.textContent || '')
        if (!text) continue
        if (text.includes(want) || want.includes(text) || text.slice(0, 12) === want.slice(0, 12)) {
          b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
          return true
        }
      }
      return false
    }, entry.fallbackLabel)
    if (clicked) return
  }

  throw new Error(`Botão sidebar não encontrado: ${entry.action}`)
}

async function expandModuleGroup(page, moduleId, targetAction) {
  if (moduleId === 'intro') return

  const target = page.locator(
    `[data-sidebar-nav-action="${targetAction}"], [data-button-action="${targetAction}"]`
  )
  if (await target.isVisible({ timeout: 700 }).catch(() => false)) return

  await page.locator('.sidebar-scroll-inner').evaluate((el) => {
    el.scrollTop = 0
  }).catch(() => {})

  if (moduleId === 'outros') {
    await page.locator('.sidebar-admin-footer').click({ timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(500)
    if (await target.isVisible({ timeout: 1000 }).catch(() => false)) return
  }

  if (moduleId === 'empresa-institucional') {
    await page.locator('[aria-controls="sidebar-empresa-institucional-actions"]').click({ timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(500)
    if (await target.isVisible({ timeout: 1000 }).catch(() => false)) return
  }

  const headerSel = MODULE_HEADER_SELECTOR[moduleId]
  if (headerSel) {
    const header = page.locator(headerSel).first()
    if (await header.isVisible({ timeout: 2000 }).catch(() => false)) {
      await header.click({ timeout: 5000 }).catch(() => {})
      await page.waitForTimeout(500)
      if (await target.isVisible({ timeout: 1200 }).catch(() => false)) return
    }
  }

  // Fallback: expandir grupos colapsados até o botão aparecer
  for (let attempt = 0; attempt < 20; attempt++) {
    if (await target.isVisible({ timeout: 500 }).catch(() => false)) return
    const clicked = await page.evaluate(() => {
      const headers = [...document.querySelectorAll('.sidebar-group-header, .sidebar-admin-footer')]
      for (const h of headers) {
        const cluster = h.closest('.sidebar-nav-cluster, .sidebar-nav-subcluster')
        const sub = cluster?.querySelector('.sidebar-action-buttons')
        if (!sub || sub.offsetParent === null) {
          h.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
          return true
        }
      }
      return false
    })
    if (!clicked) break
    await page.waitForTimeout(450)
  }
}

async function navigateToPage(page, entry) {
  page.once('dialog', (d) => d.accept().catch(() => {}))

  // Fechar abas anteriores — evita acumular estado e timeouts
  await page.locator('.main-content-action-btn--home').click({ timeout: 4000 }).catch(() => {})
  await page.waitForTimeout(400)

  if (!entry.action) {
    await enterWorkspace(page).catch(() => {})
    await page.waitForTimeout(entry.waitMs || 800)
    return
  }

  await expandModuleGroup(page, entry.moduleId, entry.action)
  await clickSidebarEntry(page, entry)

  // Checklist pede credencial — fechar modal para capturar ecrã anterior se bloquear
  const checklistModal = page.locator('.checklist-access-modal, [class*="checklist-access"]')
  if (await checklistModal.isVisible({ timeout: 800 }).catch(() => false)) {
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(300)
  }

  await page
    .waitForSelector(`[data-sidebar-nav-action="${entry.action}"].sidebar-action-btn-active`, { timeout: 10000 })
    .catch(() => {})

  await page.waitForSelector('.main-content-area-tab-open, .tab-content-wrapper', { timeout: 12000 }).catch(() => {})
  await page.waitForTimeout(entry.waitMs || 1400)
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
        // Evita overlay de bootstrap nas capturas (mesma sessão quente que reload normal)
        sessionStorage.setItem('nonato-warm-session-v1', '1')
        localStorage.setItem('nonato-warm-bootstrap-at-v1', new Date().toISOString())
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
  await waitForAppReady(page)
  await enterWorkspace(page)
  log('  App pronta — a capturar ecrãs…')

  let ok = 0
  let fail = 0

  for (const entry of PAGES) {
    const outDir = path.join(ASSETS_ROOT, locale, entry.id)
    const outFile = path.join(outDir, '01.png')
    fs.mkdirSync(outDir, { recursive: true })

    try {
      await navigateToPage(page, entry)
      await assertReadyForCapture(page, entry.id)
      const target = page.locator('.main-content-area').first()
      await target.waitFor({ state: 'visible', timeout: 15000 })
      await page.waitForTimeout(400)
      await target.screenshot({
        path: outFile,
        type: 'png',
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

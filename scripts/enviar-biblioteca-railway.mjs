#!/usr/bin/env node
/**
 * Envia a biblioteca de peças deste PC para o servidor Railway (nuvem).
 * Uso: node scripts/enviar-biblioteca-railway.mjs [url]
 * Variáveis: NONATO_USER, NONATO_PASS, NONATO_API_SECRET (opcional)
 */
import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DATA = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || path.join(ROOT, 'data')
const BASE = (process.argv[2] || process.env.RAILWAY_URL || 'https://gest-o-nonato-gestao.up.railway.app').replace(/\/$/, '')

function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(q, (a) => {
      rl.close()
      resolve(a.trim())
    })
  })
}

function parseCookies(setCookie) {
  if (!setCookie) return ''
  const list = Array.isArray(setCookie) ? setCookie : [setCookie]
  return list.map((c) => c.split(';')[0]).join('; ')
}

async function login(username, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: BASE,
      Referer: `${BASE}/`,
    },
    body: JSON.stringify({ username, password }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.ok) {
    throw new Error(json.message || `Login falhou (${res.status})`)
  }
  const cookie = parseCookies(res.headers.getSetCookie?.() || res.headers.get('set-cookie'))
  if (!cookie) throw new Error('Login OK mas sem cookie de sessão.')
  return cookie
}

async function saveKey(cookie, key, value, apiSecret) {
  const headers = {
    'Content-Type': 'application/json',
    Origin: BASE,
    Referer: `${BASE}/`,
    Cookie: cookie,
  }
  if (apiSecret) headers['x-nonato-api-key'] = apiSecret

  const res = await fetch(`${BASE}/api/data/save`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ key, value }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.error) {
    throw new Error(json.message || json.error || `Gravar ${key} falhou (${res.status})`)
  }
  return json
}

async function countOnServer(cookie, apiSecret) {
  const headers = { Origin: BASE, Referer: `${BASE}/`, Cookie: cookie }
  if (apiSecret) headers['x-nonato-api-key'] = apiSecret
  const res = await fetch(`${BASE}/api/data/repair-pecas-biblioteca?meta=1`, { headers, cache: 'no-store' })
  if (!res.ok) return null
  const json = await res.json()
  return typeof json.totalPecas === 'number' ? json.totalPecas : null
}

async function main() {
  console.log('=== Enviar biblioteca para Railway ===')
  console.log('Destino:', BASE)
  console.log('Origem (este PC):', DATA)

  const litePath = path.join(DATA, 'nonato-pecas-biblioteca-lite.json')
  const fullPath = path.join(DATA, 'nonato-pecas-biblioteca.json')
  if (!fs.existsSync(litePath) && !fs.existsSync(fullPath)) {
    console.error('ERRO: Não há biblioteca em data/. Execute RESTAURAR-362-PECAS.bat primeiro.')
    process.exit(1)
  }

  let lite = null
  let full = null
  if (fs.existsSync(litePath)) {
    lite = JSON.parse(fs.readFileSync(litePath, 'utf-8'))
    if (!Array.isArray(lite) || lite.length === 0) lite = null
  }
  if (fs.existsSync(fullPath)) {
    full = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
    if (!Array.isArray(full) || full.length === 0) full = null
  }
  const count = (full || lite)?.length || 0
  console.log(`Peças neste PC: ${count}`)
  if (count < 50) {
    console.error('ERRO: Catálogo local incompleto.')
    process.exit(1)
  }

  let username = process.env.NONATO_USER || ''
  let password = process.env.NONATO_PASS || ''
  if (!username || !password) {
    try {
      const usersPath = path.join(DATA, 'nonato-users.json')
      if (fs.existsSync(usersPath)) {
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'))
        const admin = Array.isArray(users)
          ? users.find((u) => u?.isAdmin) || users[0]
          : null
        if (admin) {
          if (!username) username = String(admin.email || admin.name || '').trim()
          if (!password) password = String(admin.password || '').trim()
        }
      }
    } catch {
      /* ignorar */
    }
  }
  if (!username) username = await ask('Utilizador Railway: ')
  if (!password) password = await ask('Senha Railway: ')

  const apiSecret = process.env.NONATO_API_SECRET?.trim() || ''

  console.log('A iniciar sessão no Railway…')
  const cookie = await login(username, password)

  const before = await countOnServer(cookie, apiSecret)
  if (before !== null) console.log(`Peças no Railway (antes): ${before}`)

  if (lite && lite.length >= 50) {
    console.log(`A enviar catálogo lite (${lite.length} peças)…`)
    await saveKey(cookie, 'nonato-pecas-biblioteca-lite', lite, apiSecret)
    console.log('✓ Lite gravado no Railway.')
  }

  if (full && full.length >= 50) {
    const mb = (Buffer.byteLength(JSON.stringify(full)) / (1024 * 1024)).toFixed(1)
    console.log(`A enviar catálogo completo (${full.length} peças, ~${mb} MB) — pode demorar 1-2 min…`)
    await saveKey(cookie, 'nonato-pecas-biblioteca', full, apiSecret)
    console.log('✓ Catálogo completo gravado no Railway (com fotos).')
  }

  const after = await countOnServer(cookie, apiSecret)
  if (after !== null) console.log(`Peças no Railway (depois): ${after}`)

  console.log('')
  console.log('CONCLUÍDO.')
  console.log(`1. Abra no Edge: ${BASE}`)
  console.log('2. Entre com o mesmo utilizador/senha')
  console.log('3. Biblioteca de Peças → Repor biblioteca do servidor (ou Ctrl+Shift+R)')
}

main().catch((e) => {
  console.error('Falhou:', e.message || e)
  process.exit(1)
})

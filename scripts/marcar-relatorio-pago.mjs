#!/usr/bin/env node
/**
 * Marca relatório como PAGO no Railway (e local se existir).
 * Uso: node scripts/marcar-relatorio-pago.mjs 20260623-001
 */
import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DATA = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || path.join(ROOT, 'data')
const BASE = (process.argv[3] || process.env.RAILWAY_URL || 'https://gest-o-nonato-gestao.up.railway.app').replace(/\/$/, '')
const REF = String(process.argv[2] || '20260623-001').trim()

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
    headers: { 'Content-Type': 'application/json', Origin: BASE, Referer: `${BASE}/` },
    body: JSON.stringify({ username, password }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.ok) throw new Error(json.message || `Login falhou (${res.status})`)
  const cookie = parseCookies(res.headers.getSetCookie?.() || res.headers.get('set-cookie'))
  if (!cookie) throw new Error('Sem cookie de sessão.')
  return cookie
}

async function apiGet(cookie, key, apiSecret) {
  const headers = { Origin: BASE, Referer: `${BASE}/`, Cookie: cookie }
  if (apiSecret) headers['x-nonato-api-key'] = apiSecret
  const res = await fetch(`${BASE}/api/data/load?key=${encodeURIComponent(key)}`, { headers, cache: 'no-store' })
  if (!res.ok) throw new Error(`Load ${key}: ${res.status}`)
  const json = await res.json()
  return json.data
}

async function apiSave(cookie, key, value, apiSecret) {
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
  if (!res.ok || json.error) throw new Error(json.message || json.error || `Save ${key}: ${res.status}`)
}

function findRelatorioId(relatorios, ref) {
  if (!Array.isArray(relatorios)) return null
  const byNum = relatorios.find((r) => String(r?.numero || '').trim() === ref)
  if (byNum?.id) return String(byNum.id)
  const byId = relatorios.find((r) => String(r?.id || '') === ref)
  return byId?.id ? String(byId.id) : null
}

function updateLocalFile(fileKey, updater) {
  const p = path.join(DATA, `${fileKey}.json`)
  if (!fs.existsSync(p)) return false
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'))
  const next = updater(data)
  if (next === null) return false
  fs.writeFileSync(p, JSON.stringify(next, null, 2), 'utf-8')
  return true
}

async function main() {
  console.log('=== Marcar relatório como PAGO ===')
  console.log('Referência:', REF)
  console.log('Destino:', BASE)

  let username = process.env.NONATO_USER || ''
  let password = process.env.NONATO_PASS || ''
  if (!username || !password) {
    try {
      const users = JSON.parse(fs.readFileSync(path.join(DATA, 'nonato-users.json'), 'utf-8'))
      const admin = users.find((u) => u?.isAdmin) || users[0]
      if (admin) {
        if (!username) username = String(admin.email || admin.name || '').trim()
        if (!password) password = String(admin.password || '').trim()
      }
    } catch {
      /* ignorar */
    }
  }
  if (!username) username = await ask('Utilizador: ')
  if (!password) password = await ask('Senha: ')
  const apiSecret = process.env.NONATO_API_SECRET?.trim() || ''

  const cookie = await login(username, password)

  const relatorios = await apiGet(cookie, 'nonato-relatorios-servico', apiSecret)
  const relId = findRelatorioId(relatorios, REF)
  if (!relId) throw new Error(`Relatório ${REF} não encontrado no servidor.`)

  console.log('ID relatório:', relId)

  const fluxo = (await apiGet(cookie, 'nonato-fechamentos-fluxo-financeiro', apiSecret)) || {}
  const prev = fluxo[relId] && typeof fluxo[relId] === 'object' ? fluxo[relId] : {}
  fluxo[relId] = {
    ...prev,
    etapa: 'controlo_pagamento',
    modo: prev.modo || 'com_fatura',
    pagamento: 'pago',
    situacaoFatura: 'paga',
    updatedAt: new Date().toISOString(),
  }

  if (Array.isArray(relatorios)) {
    const idx = relatorios.findIndex((r) => String(r?.id) === relId)
    if (idx >= 0 && !relatorios[idx].servicoConcluido) {
      relatorios[idx] = { ...relatorios[idx], servicoConcluido: true }
    }
  }

  await apiSave(cookie, 'nonato-fechamentos-fluxo-financeiro', fluxo, apiSecret)
  await apiSave(cookie, 'nonato-relatorios-servico', relatorios, apiSecret)
  console.log('✓ Railway: pagamento = PAGO, serviço = concluído')

  updateLocalFile('nonato-fechamentos-fluxo-financeiro', (d) => {
    if (!d || typeof d !== 'object') d = {}
    d[relId] = fluxo[relId]
    return d
  })
  updateLocalFile('nonato-relatorios-servico', (arr) => {
    if (!Array.isArray(arr)) return null
    return arr.map((r) =>
      String(r?.id) === relId ? { ...r, servicoConcluido: true } : r
    )
  })
  console.log('✓ Cópia local actualizada (se existia).')
  console.log('\nPrima Ctrl+Shift+R no Edge e reabra a ficha do cliente.')
}

main().catch((e) => {
  console.error('Falhou:', e.message || e)
  process.exit(1)
})

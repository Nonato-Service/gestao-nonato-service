#!/usr/bin/env node
/**
 * Restaura TODOS os cadastros a partir de backups/json/backup-dados-*.json
 * para a pasta data/ (servidor local).
 *
 * Uso:
 *   node scripts/restaurar-dados-backup.mjs
 *   node scripts/restaurar-dados-backup.mjs "backups/json/backup-dados-2026-06-27.json"
 *   npm run restaurar:dados
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dataDir = path.join(root, 'data')
const backupsDir = path.join(root, 'backups', 'json')
const port = process.env.PORT || 3000
const baseUrl = process.env.NONATO_RESTORE_URL || `http://127.0.0.1:${port}`

const SKIP_KEYS = new Set([
  'nonato-auto-backups',
  'nonato-code-backups',
  'nonato-sync-queue',
  'nonato-pending-full-server-replace',
])

function parseValue(raw) {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'string') {
    const s = raw.trim()
    if (!s) return null
    try {
      return JSON.parse(s)
    } catch {
      return s
    }
  }
  return raw
}

function findLatestBackup() {
  if (!fs.existsSync(backupsDir)) return null
  const files = fs
    .readdirSync(backupsDir)
    .filter((f) => f.startsWith('backup-dados-') && f.endsWith('.json'))
    .map((f) => ({ f, m: fs.statSync(path.join(backupsDir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m)
  return files[0]?.f ? path.join(backupsDir, files[0].f) : null
}

function bumpSyncMeta() {
  const metaPath = path.join(dataDir, '_sync-meta.json')
  let revision = 0
  if (fs.existsSync(metaPath)) {
    try {
      const m = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      revision = typeof m.revision === 'number' ? m.revision : 0
    } catch {
      /* ignorar */
    }
  }
  const next = { revision: revision + 1, updatedAt: new Date().toISOString() }
  fs.writeFileSync(metaPath, JSON.stringify(next, null, 2) + '\n', 'utf-8')
  return next
}

function serializeJson(value) {
  return JSON.stringify(value, null, 2) + '\n'
}

async function postSave(key, value) {
  const res = await fetch(`${baseUrl}/api/data/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
    signal: AbortSignal.timeout(120000),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${t.slice(0, 200)}`)
  }
  return res.json()
}

async function main() {
  const argPath = process.argv[2]
  const backupPath = argPath
    ? path.isAbsolute(argPath)
      ? argPath
      : path.join(root, argPath)
    : findLatestBackup()

  if (!backupPath || !fs.existsSync(backupPath)) {
    console.error('❌ Nenhum ficheiro backup-dados-*.json encontrado em backups/json/')
    process.exit(1)
  }

  console.log('')
  console.log('📂 Backup:', backupPath)
  const envelope = JSON.parse(fs.readFileSync(backupPath, 'utf-8'))
  const keyMap = envelope.data || envelope
  if (!keyMap || typeof keyMap !== 'object') {
    console.error('❌ Formato de backup inválido (falta campo data).')
    process.exit(1)
  }

  const keys = Object.keys(keyMap).filter((k) => k.startsWith('nonato-') && !SKIP_KEYS.has(k))
  if (keys.length === 0) {
    console.error('❌ Nenhuma chave nonato-* no backup.')
    process.exit(1)
  }

  fs.mkdirSync(dataDir, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const preDir = path.join(dataDir, `_pre-restore-${stamp}`)
  fs.mkdirSync(preDir, { recursive: true })

  let written = 0
  for (const key of keys) {
    const value = parseValue(keyMap[key])
    if (value === null || value === undefined) continue
    const target = path.join(dataDir, `${key}.json`)
    if (fs.existsSync(target)) {
      try {
        fs.copyFileSync(target, path.join(preDir, `${key}.json`))
      } catch {
        /* ignorar */
      }
    }
    fs.writeFileSync(target, serializeJson(value), 'utf-8')
    written++
  }

  const meta = bumpSyncMeta()
  const clientes = parseValue(keyMap['nonato-clientes'])
  const rels = parseValue(keyMap['nonato-relatorios-servico'])
  const ferwoodClientes = Array.isArray(clientes)
    ? clientes.filter((c) => String(c?.nomeEmpresa ?? '').toLowerCase().includes('ferwood'))
    : []
  const ferwoodRels = Array.isArray(rels)
    ? rels.filter((r) => String(r?.cliente ?? '').toLowerCase().includes('ferwood'))
    : []
  const thomasRels = Array.isArray(rels)
    ? rels.filter((r) => String(r?.cliente ?? '').toLowerCase().includes('thomas'))
    : []

  console.log('')
  console.log(`✅ Restauradas ${written} chaves em data/`)
  console.log(`   Cópia anterior em: ${preDir}`)
  console.log(`   Revisão sync: ${meta.revision}`)
  console.log(`   Clientes Ferwood: ${ferwoodClientes.length}`)
  ferwoodClientes.forEach((c) => console.log(`      • ${c.nomeEmpresa}`))
  console.log(`   Relatórios Ferwood: ${ferwoodRels.length}`)
  ferwoodRels.forEach((r) => console.log(`      • ${r.numero} — ${r.cliente}`))
  console.log(`   Relatórios Thomas: ${thomasRels.length}`)
  thomasRels.forEach((r) => console.log(`      • ${r.numero} — ${r.cliente}`))

  let apiOk = false
  try {
    for (const key of ['nonato-clientes', 'nonato-relatorios-servico', 'nonato-fechamentos-relatorios', 'nonato-fechamentos-guardados-biblioteca']) {
      if (!keyMap[key]) continue
      await postSave(key, parseValue(keyMap[key]))
    }
    apiOk = true
    console.log('')
    console.log(`✅ Chaves principais enviadas ao servidor (${baseUrl})`)
  } catch (e) {
    console.log('')
    console.log(`⚠️  Servidor offline (${e.message}). Os ficheiros em data/ já estão restaurados.`)
    console.log('   Inicie npm run dev e volte a correr: npm run restaurar:dados')
  }

  console.log('')
  console.log('📱 No browser (IMPORTANTE):')
  console.log('   1. Abra o programa e prima F5.')
  console.log('   2. Menu Administrador → «Atualizar deste aparelho com o servidor» (puxar dados).')
  console.log('   3. Biblioteca de Relatórios → pesquise «Ferwood» ou «Thomas».')
  console.log('')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

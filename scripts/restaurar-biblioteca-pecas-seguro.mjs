#!/usr/bin/env node
/**
 * Restaura APENAS nonato-pecas-biblioteca.json a partir do backup com MAIS peças.
 * — Cria cópia de segurança do ficheiro actual ANTES de gravar.
 * — Nunca substitui por um backup com MENOS peças que o servidor.
 * Uso: node scripts/restaurar-biblioteca-pecas-seguro.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, 'data')
const backupsDir = path.join(root, 'backups', 'json')
const KEY = 'nonato-pecas-biblioteca'

function loadPecasFromBackup(filePath) {
  const j = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const arr = j.data?.[KEY] ?? j[KEY]
  if (!Array.isArray(arr)) throw new Error(`Sem ${KEY} em ${filePath}`)
  return arr
}

function loadCurrent() {
  const p = path.join(dataDir, `${KEY}.json`)
  if (!fs.existsSync(p)) return { count: 0, path: p, arr: [] }
  const arr = JSON.parse(fs.readFileSync(p, 'utf-8'))
  return { count: Array.isArray(arr) ? arr.length : 0, path: p, arr }
}

function findBestBackup() {
  let best = null
  for (const f of fs.readdirSync(backupsDir).filter((x) => x.endsWith('.json'))) {
    try {
      const arr = loadPecasFromBackup(path.join(backupsDir, f))
      if (!best || arr.length > best.count) best = { file: f, count: arr.length, arr }
    } catch {
      /* ignorar */
    }
  }
  return best
}

const current = loadCurrent()
const best = findBestBackup()

console.log(`Servidor actual: ${current.count} peça(s)`)
console.log(`Melhor backup: ${best ? `${best.count} (${best.file})` : 'nenhum'}`)

if (!best) {
  console.error('Nenhum backup válido encontrado.')
  process.exit(1)
}

if (best.count <= current.count) {
  console.log('\nNada a fazer — o servidor já tem tantas ou mais peças que o backup.')
  console.log('Os seus dados no disco NÃO foram alterados.')
  process.exit(0)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const safetyDir = path.join(dataDir, `_pre-biblioteca-restore-${stamp}`)
fs.mkdirSync(safetyDir, { recursive: true })
if (fs.existsSync(current.path)) {
  fs.copyFileSync(current.path, path.join(safetyDir, `${KEY}.json`))
}

const out = JSON.stringify(best.arr, null, 2) + '\n'
fs.writeFileSync(current.path, out, 'utf-8')
console.log(`\n✓ Restauradas ${best.count} peça(s) a partir de ${best.file}`)
console.log(`  Cópia anterior guardada em: ${safetyDir}`)

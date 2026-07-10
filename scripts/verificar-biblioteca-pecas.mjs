#!/usr/bin/env node
/**
 * Relatório honesto da biblioteca de peças — não altera nada.
 * Uso: node scripts/verificar-biblioteca-pecas.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, 'data')
const backupsDir = path.join(root, 'backups', 'json')
const KEY = 'nonato-pecas-biblioteca'

function countArrayFile(filePath) {
  if (!fs.existsSync(filePath)) return null
  try {
    const j = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return Array.isArray(j) ? j.length : null
  } catch {
    return null
  }
}

function countInBackup(filePath) {
  try {
    const j = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const arr = j.data?.[KEY] ?? j[KEY]
    return Array.isArray(arr) ? arr.length : null
  } catch {
    return null
  }
}

console.log('=== Biblioteca de peças — verificação (só leitura) ===\n')

const mainPath = path.join(dataDir, `${KEY}.json`)
const mainCount = countArrayFile(mainPath)
if (mainCount !== null) {
  const st = fs.statSync(mainPath)
  console.log(`Servidor (data/${KEY}.json): ${mainCount} peça(s)`)
  console.log(`  Última alteração: ${st.mtime.toISOString()}`)
} else {
  console.log(`Servidor: ficheiro ${KEY}.json ausente ou inválido`)
}

const preDirs = fs
  .readdirSync(dataDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith('_pre-restore-'))
  .map((d) => d.name)
for (const dir of preDirs) {
  const n = countArrayFile(path.join(dataDir, dir, `${KEY}.json`))
  if (n !== null) console.log(`Cópia ${dir}: ${n} peça(s)`)
}

console.log('\nBackups automáticos (backups/json/):')
let max = 0
let maxFile = ''
if (fs.existsSync(backupsDir)) {
  for (const f of fs.readdirSync(backupsDir).filter((x) => x.endsWith('.json'))) {
    const n = countInBackup(path.join(backupsDir, f))
    if (n === null) continue
    console.log(`  ${f}: ${n}`)
    if (n > max) {
      max = n
      maxFile = f
    }
  }
}

console.log(`\nMáximo encontrado em backup: ${max}${maxFile ? ` (${maxFile})` : ''}`)
if (mainCount !== null && max > 0) {
  if (mainCount >= max) {
    console.log('✓ O ficheiro do servidor tem tantas ou mais peças que qualquer backup guardado.')
  } else {
    console.log(`⚠ O servidor (${mainCount}) tem MENOS que o melhor backup (${max}).`)
    console.log(`  Para repor só no disco: node scripts/restaurar-biblioteca-pecas-seguro.mjs`)
  }
}

console.log('\nNota: se alguma vez viu 400+ no ecrã, pode ter sido noutro aparelho')
console.log('ou peças ainda não gravadas no servidor. Procure também JSON exportado manualmente.')

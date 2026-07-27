#!/usr/bin/env node
/**
 * Incrementa pwa-version.json e sincroniza ficheiros dependentes.
 * Uso: npm run pwa:bump
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const versionFile = path.join(root, 'pwa-version.json')

const raw = JSON.parse(fs.readFileSync(versionFile, 'utf8'))
const prev = Number(raw?.version) || 0
const next = prev + 1
raw.version = next
fs.writeFileSync(versionFile, `${JSON.stringify(raw, null, 2)}\n`, 'utf8')

console.log(`[pwa:bump] ${prev} → ${next}`)

const sync = spawnSync(process.execPath, [path.join(__dirname, 'sync-pwa-version.mjs')], {
  stdio: 'inherit',
  cwd: root,
})
process.exit(sync.status ?? 1)

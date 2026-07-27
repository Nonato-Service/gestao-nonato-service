#!/usr/bin/env node
/**
 * Sincroniza pwa-version.json → app/lib/pwaVersion.ts e public/sw.js
 * Executado automaticamente em prebuild/predev.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const versionFile = path.join(root, 'pwa-version.json')
const tsOut = path.join(root, 'app', 'lib', 'pwaVersion.ts')
const swPath = path.join(root, 'public', 'sw.js')

if (!fs.existsSync(versionFile)) {
  console.error('[pwa:sync] Falta pwa-version.json na raiz do projecto.')
  process.exit(1)
}

const raw = JSON.parse(fs.readFileSync(versionFile, 'utf8'))
const version = Number(raw?.version)
if (!Number.isInteger(version) || version < 1) {
  console.error('[pwa:sync] pwa-version.json deve conter "version" inteiro >= 1.')
  process.exit(1)
}

const cacheName = `nonato-pwa-v${version}`

const tsContent = `/**
 * Versão PWA — gerado por scripts/sync-pwa-version.mjs
 * Não editar à mão. Altere pwa-version.json na raiz (ou \`npm run pwa:bump\`).
 */
export const PWA_VERSION = ${version} as const
export const PWA_CACHE_NAME = '${cacheName}' as const
`

fs.writeFileSync(tsOut, tsContent, 'utf8')

if (!fs.existsSync(swPath)) {
  console.error('[pwa:sync] Falta public/sw.js')
  process.exit(1)
}

let sw = fs.readFileSync(swPath, 'utf8')
const cacheRe = /const CACHE_NAME = 'nonato-pwa-v\d+'/
if (!cacheRe.test(sw)) {
  console.error('[pwa:sync] public/sw.js não contém CACHE_NAME nonato-pwa-vNNN.')
  process.exit(1)
}
sw = sw.replace(cacheRe, `const CACHE_NAME = '${cacheName}'`)
fs.writeFileSync(swPath, sw, 'utf8')

console.log(`[pwa:sync] PWA v${version} → app/lib/pwaVersion.ts + public/sw.js`)

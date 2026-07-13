#!/usr/bin/env node
/**
 * Importa TODAS as peças HOMAG em falta (API completa) + referências com/sem hífen.
 * Uso: node scripts/homag-import/importar-faltantes-homag.mjs
 *
 * Requer login HOMAG se HOMAG_HEADLESS=0 (recomendado na 1.ª vez).
 */
import { spawnSync } from 'node:child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')

function run(nodeArgs, extraEnv = {}) {
  const env = {
    ...process.env,
    HOMAG_USE_API: '1',
    HOMAG_AUTO_MERGE: '1',
    HOMAG_RESUME: '1',
    HOMAG_FORCE_ALL_BUCKETS: '1',
    HOMAG_EMBED_IMAGES: process.env.HOMAG_EMBED_IMAGES ?? '0',
    HOMAG_HEADLESS: process.env.HOMAG_HEADLESS ?? '0',
    ...extraEnv,
  }
  const r = spawnSync(process.execPath, nodeArgs, { cwd: ROOT, stdio: 'inherit', env })
  return r.status ?? 1
}

console.log('=== Importar TODAS as peças HOMAG em falta ===')
console.log('• Percorre todos os buckets da API (~62)')
console.log('• Só adiciona peças novas (não duplica)')
console.log('• Códigos ficam com SKU sem hífen + referência com hífen')
console.log('• Demora 2–4 horas — não feche a janela')
console.log('')

const importRc = run([path.join(__dirname, 'run.mjs')])
if (importRc !== 0) {
  console.warn(`\nImportação terminou com código ${importRc} — pode executar outra vez para continuar.`)
}

console.log('\n=== Enriquecer referências (com/sem hífen) ===')
run([path.join(__dirname, 'enriquecer-referencias-biblioteca.mjs')])

console.log('\n=== Ligar códigos máq. antiga/nova (sem remover peças) ===')
run(['--experimental-strip-types', path.join(__dirname, 'aplicar-substituicoes-homag.mjs')])

console.log('\n=== Concluído ===')
console.log('Execute ENVIAR-PECAS-RAILWAY.bat para actualizar o site.')
console.log('No browser: Ctrl+Shift+R → Repor biblioteca do servidor.')

process.exit(importRc)

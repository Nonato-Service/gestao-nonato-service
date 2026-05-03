#!/usr/bin/env node
/**
 * Build com modo DEMO embutido (`NEXT_PUBLIC_NONATO_DEMO=1`).
 * Compatível com Windows/macOS/Linux (sem depender de `cross-env`).
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const env = { ...process.env, NEXT_PUBLIC_NONATO_DEMO: '1' }
const r = spawnSync(
  process.execPath,
  ['--max-old-space-size=4096', join(root, 'node_modules/next/dist/bin/next'), 'build'],
  { stdio: 'inherit', env, cwd: root }
)
process.exit(r.status ?? 1)

// Endpoint para health check do Railway + diagnóstico de persistência de dados
import fs from 'fs'
import path from 'path'
import { PWA_VERSION } from '../../lib/pwaVersion'
import { DATA_DIR, ensureDataDir } from '../data/shared'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function countJsonFiles(): number {
  try {
    ensureDataDir()
    return fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json') || f.endsWith('.txt')).length
  } catch {
    return 0
  }
}

function hasClientesFile(): boolean {
  try {
    const p = path.join(DATA_DIR, 'nonato-clientes.json')
    if (!fs.existsSync(p)) return false
    const stat = fs.statSync(p)
    return stat.size > 4
  } catch {
    return false
  }
}

function hasBibliotecaFile(): boolean {
  try {
    const p = path.join(DATA_DIR, 'nonato-pecas-biblioteca.json')
    if (!fs.existsSync(p)) return false
    const stat = fs.statSync(p)
    return stat.size > 50_000
  } catch {
    return false
  }
}

export async function GET() {
  const dataDir = DATA_DIR
  const fileCount = countJsonFiles()
  const clientesPersistidos = hasClientesFile()
  const bibliotecaPersistida = hasBibliotecaFile()
  const volumeMount = process.env.RAILWAY_VOLUME_MOUNT_PATH || null
  const dataDirEnv = process.env.DATA_DIR || null

  const persistenceOk =
    (clientesPersistidos && bibliotecaPersistida) ||
    (clientesPersistidos && fileCount > 8) ||
    (fileCount > 5 && Boolean(volumeMount)) ||
    Boolean(volumeMount && dataDirEnv && volumeMount === dataDirEnv)

  // Liveness SEMPRE 200: o healthcheck do Railway (railway.json) falha/trava o
  // deploy em «Configuring network» se receber 503. Persistência fica no JSON.
  let hint = 'Dados no disco parecem presentes.'
  if (!persistenceOk) {
    hint =
      'AVISO: poucos ou nenhum ficheiro de dados — configure volume Railway em /app/data com DATA_DIR=/app/data.'
  } else if (clientesPersistidos && !bibliotecaPersistida) {
    hint =
      'Clientes OK mas biblioteca de peças ausente ou muito pequena — envie nonato-pecas-biblioteca.json ao volume.'
  }

  const gitSha =
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT ||
    process.env.COMMIT_SHA ||
    null

  return new Response(
    JSON.stringify({
      ok: true,
      alive: true,
      appVersion: PWA_VERSION,
      gitCommit: gitSha ? String(gitSha).slice(0, 7) : null,
      persistence: {
        dataDir,
        fileCount,
        clientesPersistidos,
        bibliotecaPersistida,
        volumeMount,
        dataDirEnv,
        persistenceOk,
        hint,
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    }
  )
}

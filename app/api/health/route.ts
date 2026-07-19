// Endpoint para health check do Railway + diagnóstico de persistência de dados
import fs from 'fs'
import path from 'path'
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

  const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)
  const httpStatus = isRailway && !persistenceOk ? 503 : 200

  let hint = 'Dados no disco parecem presentes.'
  if (!persistenceOk) {
    hint =
      'AVISO: poucos ou nenhum ficheiro de dados — configure volume Railway em /app/data com DATA_DIR=/app/data.'
  } else if (clientesPersistidos && !bibliotecaPersistida) {
    hint =
      'Clientes OK mas biblioteca de peças ausente ou muito pequena — envie nonato-pecas-biblioteca.json ao volume.'
  }

  return new Response(
    JSON.stringify({
      ok: httpStatus === 200,
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
      status: httpStatus,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

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
    const raw = fs.readFileSync(p, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) && parsed.length > 0
  } catch {
    return false
  }
}

export async function GET() {
  const dataDir = DATA_DIR
  const fileCount = countJsonFiles()
  const clientesPersistidos = hasClientesFile()
  const volumeMount = process.env.RAILWAY_VOLUME_MOUNT_PATH || null
  const dataDirEnv = process.env.DATA_DIR || null

  const persistenceOk =
    fileCount > 2 ||
    clientesPersistidos ||
    Boolean(volumeMount && dataDirEnv && volumeMount === dataDirEnv)

  return new Response(
    JSON.stringify({
      ok: true,
      persistence: {
        dataDir,
        fileCount,
        clientesPersistidos,
        volumeMount,
        dataDirEnv,
        persistenceOk,
        hint: persistenceOk
          ? 'Dados no disco parecem presentes.'
          : 'AVISO: poucos ou nenhum ficheiro de dados — configure volume Railway em /app/data com DATA_DIR=/app/data.',
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

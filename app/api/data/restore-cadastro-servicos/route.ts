import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { DATA_DIR, ensureDataDir, resolveDataDirForKey } from '../shared'
import { getDemoContext, ensureDemoDataDir } from '../demo-context'
import { bumpSyncMeta } from '../syncMeta'
import { serializeJsonForDisk } from '../writeIfChanged'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_GRUPO_ID = 'servico-grupo-geral'

function readJsonFile(filePath: string): unknown {
  if (!fs.existsSync(filePath)) return null
  const content = fs.readFileSync(filePath, 'utf-8')
  if (!content.trim()) return null
  return JSON.parse(content)
}

function writeJsonFile(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, serializeJsonForDisk(value), 'utf-8')
}

export async function POST(request: NextRequest) {
  try {
    const { dataDir } = getDemoContext(request)
    ensureDataDir()
    ensureDemoDataDir(dataDir)

    const servicosDir = resolveDataDirForKey('nonato-servicos', dataDir)
    const gruposDir = resolveDataDirForKey('nonato-servicos-grupos', dataDir)
    const servicosPath = path.join(servicosDir, 'nonato-servicos.json')
    const gruposPath = path.join(gruposDir, 'nonato-servicos-grupos.json')

    let servicos = readJsonFile(servicosPath)
    let grupos = readJsonFile(gruposPath)

    if (!Array.isArray(servicos) || servicos.length === 0) {
      const fallbackPath = path.join(DATA_DIR, 'nonato-servicos.json')
      const fallback = readJsonFile(fallbackPath)
      if (Array.isArray(fallback) && fallback.length > 0) {
        servicos = fallback
        writeJsonFile(servicosPath, servicos)
      }
    }

    if (!Array.isArray(servicos) || servicos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Não há serviços em data/nonato-servicos.json no servidor. Execute no PC: npm run restaurar:cadastro',
        },
        { status: 404 }
      )
    }

    if (!Array.isArray(grupos) || grupos.length === 0) {
      grupos = [{ id: DEFAULT_GRUPO_ID, nome: 'Geral', ordem: 0 }]
    }

    const grupoId = String((grupos as { id?: string }[])[0]?.id || DEFAULT_GRUPO_ID)
    servicos = (servicos as Record<string, unknown>[]).map((s) => ({
      ...s,
      grupoId:
        typeof s.grupoId === 'string' && String(s.grupoId).trim()
          ? s.grupoId
          : grupoId,
      valor:
        typeof s.valor === 'number' && Number.isFinite(s.valor)
          ? s.valor
          : parseFloat(String(s.valor ?? '0').replace(',', '.')) || 0,
    }))

    writeJsonFile(servicosPath, servicos)
    writeJsonFile(gruposPath, grupos)
    const meta = bumpSyncMeta(dataDir)

    return NextResponse.json({
      success: true,
      servicos,
      grupos,
      count: servicos.length,
      revision: meta.revision,
      message: `Cadastro reposto: ${servicos.length} serviço(s).`,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[restore-cadastro-servicos]', error)
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}

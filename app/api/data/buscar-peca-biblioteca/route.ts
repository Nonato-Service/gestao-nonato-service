import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

import { filtrarPecasBibliotecaPorBusca } from '../../../lib/pecaCodigoBusca'
import { setIndiceSubstituicoesHomag } from '../../../lib/pecaCodigoBusca'
import { ensureDataDir, resolveDataDirForKey, DATA_DIR } from '../shared'
import { getDemoContext, ensureDemoDataDir } from '../demo-context'
import { rejectUnauthenticatedProductionAccess } from '../../auth/appAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KEY_FULL = 'nonato-pecas-biblioteca'
const KEY_LITE = 'nonato-pecas-biblioteca-lite'

const NO_STORE_HEADERS: HeadersInit = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
}

type PecaRecord = { id?: string; codigo?: string; nome?: string; descricao?: string; imagem?: string }

function readPecasJson(dataDir: string, key: string): PecaRecord[] | null {
  const targetDir = resolveDataDirForKey(key, dataDir)
  const filePath = path.join(targetDir, `${key}.json`)
  if (!fs.existsSync(filePath)) return null
  const content = fs.readFileSync(filePath, 'utf-8')
  if (!content.trim()) return null
  const parsed = JSON.parse(content)
  return Array.isArray(parsed) ? (parsed as PecaRecord[]) : null
}

function toLiteResponse(p: PecaRecord): PecaRecord {
  const out = { ...p }
  const img = out.imagem
  if (typeof img === 'string' && img.startsWith('data:') && img.length > 0) {
    ;(out as PecaRecord & { temImagemServidor?: boolean }).temImagemServidor = true
    delete out.imagem
  }
  return out
}

export async function GET(request: NextRequest) {
  try {
    const host = (request.headers.get('host') || '').split(':')[0].toLowerCase()
    const isLocalDevHost =
      process.env.NODE_ENV === 'development' ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '[::1]' ||
      host === '::1'
    if (!isLocalDevHost) {
      const authDenied = rejectUnauthenticatedProductionAccess(request)
      if (authDenied) return authDenied
    }

    const { isDemo, expired, dataDir } = getDemoContext(request)
    if (isDemo && expired) {
      return NextResponse.json(
        { success: false, error: 'demo_expired', message: 'Demonstração expirada.' },
        { status: 403, headers: NO_STORE_HEADERS }
      )
    }

    const q = (new URL(request.url).searchParams.get('q') || '').trim()
    if (q.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Indique pelo menos 2 caracteres para buscar.' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const limitRaw = Number.parseInt(new URL(request.url).searchParams.get('limit') || '50', 10)
    const limit = Math.min(80, Math.max(1, Number.isNaN(limitRaw) ? 50 : limitRaw))

    ensureDataDir()
    ensureDemoDataDir(dataDir)

    const indicePath = path.join(DATA_DIR, 'homag-substituicoes-indice.json')
    if (fs.existsSync(indicePath)) {
      try {
        const indice = JSON.parse(fs.readFileSync(indicePath, 'utf-8'))
        if (indice && typeof indice === 'object') setIndiceSubstituicoesHomag(indice)
      } catch {
        /* ignorar */
      }
    }

    const lite = readPecasJson(dataDir, KEY_LITE)
    const full = lite && lite.length >= 50 ? null : readPecasJson(dataDir, KEY_FULL)
    const catalog = lite && lite.length >= 50 ? lite : full
    if (!catalog || catalog.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Catálogo de peças indisponível no servidor.' },
        { status: 404, headers: NO_STORE_HEADERS }
      )
    }

    const matches = filtrarPecasBibliotecaPorBusca(catalog, q, limit).map(toLiteResponse)

    return NextResponse.json(
      {
        success: true,
        totalCatalog: catalog.length,
        count: matches.length,
        pecas: matches,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (e) {
    console.error('[buscar-peca-biblioteca]', e)
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Erro ao buscar peça.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}

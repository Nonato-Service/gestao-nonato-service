import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { ensureDataDir, resolveDataDirForKey } from '../shared'
import { getDemoContext, ensureDemoDataDir } from '../demo-context'
import { rejectUnauthenticatedProductionAccess } from '../../auth/appAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KEY = 'nonato-pecas-biblioteca'
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 40

const NO_STORE_HEADERS: HeadersInit = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
}

function readPecasFromDisk(dataDir: string): unknown[] | null {
  const targetDir = resolveDataDirForKey(KEY, dataDir)
  const filePath = path.join(targetDir, `${KEY}.json`)
  if (!fs.existsSync(filePath)) return null
  const content = fs.readFileSync(filePath, 'utf-8')
  if (!content.trim()) return null
  const parsed = JSON.parse(content)
  return Array.isArray(parsed) ? parsed : null
}

function parsePageParams(searchParams: URLSearchParams): { offset: number; limit: number; metaOnly: boolean } {
  const metaOnly = searchParams.get('meta') === '1'
  const offset = Math.max(0, Number.parseInt(searchParams.get('offset') || '0', 10) || 0)
  const limitRaw = Number.parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, limitRaw))
  return { offset, limit, metaOnly }
}

async function handleRepairRequest(request: NextRequest) {
  const authDenied = rejectUnauthenticatedProductionAccess(request)
  if (authDenied) return authDenied

  const { isDemo, expired, dataDir } = getDemoContext(request)
  if (isDemo && expired) {
    return NextResponse.json(
      { success: false, error: 'demo_expired', message: 'Demonstração expirada.' },
      { status: 403, headers: NO_STORE_HEADERS }
    )
  }

  ensureDataDir()
  ensureDemoDataDir(dataDir)

  const pecas = readPecasFromDisk(dataDir)
  if (!pecas || pecas.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: `Ficheiro ${KEY}.json vazio ou ausente no servidor.`,
      },
      { status: 404, headers: NO_STORE_HEADERS }
    )
  }

  const { searchParams } = new URL(request.url)
  const { offset, limit, metaOnly } = parsePageParams(searchParams)

  if (metaOnly) {
    return NextResponse.json(
      {
        success: true,
        total: pecas.length,
        pageSize: limit,
        message: `Catálogo no servidor: ${pecas.length} peça(s).`,
      },
      { headers: NO_STORE_HEADERS }
    )
  }

  const slice = pecas.slice(offset, offset + limit)
  const hasMore = offset + slice.length < pecas.length

  return NextResponse.json(
    {
      success: true,
      total: pecas.length,
      offset,
      limit,
      count: slice.length,
      hasMore,
      pecas: slice,
      message: `Página ${Math.floor(offset / limit) + 1}: ${slice.length} peça(s) (${offset + slice.length}/${pecas.length}).`,
    },
    { headers: NO_STORE_HEADERS }
  )
}

/** Repõe biblioteca em páginas pequenas (~25 peças) — evita resposta JSON gigante no browser. */
export async function GET(request: NextRequest) {
  try {
    return await handleRepairRequest(request)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[repair-pecas-biblioteca GET]', error)
    return NextResponse.json({ success: false, message: msg }, { status: 500, headers: NO_STORE_HEADERS })
  }
}

/** Compatibilidade: devolve só metadados — use GET paginado para transferir o catálogo. */
export async function POST(request: NextRequest) {
  try {
    const authDenied = rejectUnauthenticatedProductionAccess(request)
    if (authDenied) return authDenied

    const { isDemo, expired, dataDir } = getDemoContext(request)
    if (isDemo && expired) {
      return NextResponse.json(
        { success: false, error: 'demo_expired', message: 'Demonstração expirada.' },
        { status: 403, headers: NO_STORE_HEADERS }
      )
    }

    ensureDataDir()
    ensureDemoDataDir(dataDir)

    const pecas = readPecasFromDisk(dataDir)
    if (!pecas || pecas.length === 0) {
      return NextResponse.json(
        { success: false, message: `Ficheiro ${KEY}.json vazio ou ausente no servidor.` },
        { status: 404, headers: NO_STORE_HEADERS }
      )
    }

    return NextResponse.json(
      {
        success: true,
        total: pecas.length,
        usePagination: true,
        pageSize: DEFAULT_PAGE_SIZE,
        message: `Use GET ?offset=0&limit=${DEFAULT_PAGE_SIZE} para transferir ${pecas.length} peça(s) em páginas.`,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[repair-pecas-biblioteca POST]', error)
    return NextResponse.json({ success: false, message: msg }, { status: 500, headers: NO_STORE_HEADERS })
  }
}

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
const MAX_PAGE_SIZE_FULL = 10
const MAX_PAGE_SIZE_LITE = 500

const NO_STORE_HEADERS: HeadersInit = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
}

type PecaRecord = Record<string, unknown>

function readPecasFromDisk(dataDir: string): PecaRecord[] | null {
  const targetDir = resolveDataDirForKey(KEY, dataDir)
  const filePath = path.join(targetDir, `${KEY}.json`)
  if (!fs.existsSync(filePath)) return null
  const content = fs.readFileSync(filePath, 'utf-8')
  if (!content.trim()) return null
  const parsed = JSON.parse(content)
  return Array.isArray(parsed) ? (parsed as PecaRecord[]) : null
}

function pecaTemImagemGrande(p: PecaRecord): boolean {
  const img = p.imagem
  return typeof img === 'string' && img.startsWith('data:') && img.length > 0
}

function toLitePeca(p: PecaRecord): PecaRecord {
  const out = { ...p }
  if (pecaTemImagemGrande(out)) {
    out.temImagemServidor = true
    delete out.imagem
  }
  return out
}

function parsePageParams(searchParams: URLSearchParams): {
  offset: number
  limit: number
  metaOnly: boolean
  lite: boolean
  imagesOnly: boolean
} {
  const metaOnly = searchParams.get('meta') === '1'
  const lite = searchParams.get('lite') !== '0'
  const imagesOnly = searchParams.get('images') === '1'
  const offset = Math.max(0, Number.parseInt(searchParams.get('offset') || '0', 10) || 0)
  const limitRaw = Number.parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
  const maxLimit = imagesOnly ? 1 : lite ? MAX_PAGE_SIZE_LITE : MAX_PAGE_SIZE_FULL
  const limit = Math.min(maxLimit, Math.max(1, limitRaw))
  return { offset, limit, metaOnly, lite, imagesOnly }
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
  const { offset, limit, metaOnly, lite, imagesOnly } = parsePageParams(searchParams)
  const pecasComImagem = pecas.filter(pecaTemImagemGrande)

  if (metaOnly) {
    return NextResponse.json(
      {
        success: true,
        total: pecas.length,
        totalImages: pecasComImagem.length,
        pageSize: limit,
        lite,
        message: `Catálogo no servidor: ${pecas.length} peça(s), ${pecasComImagem.length} com foto.`,
      },
      { headers: NO_STORE_HEADERS }
    )
  }

  if (imagesOnly) {
    const slice = pecasComImagem.slice(offset, offset + limit)
    const payload = slice.map((p) => ({
      id: String(p.id ?? ''),
      imagem: typeof p.imagem === 'string' ? p.imagem : '',
    }))
    const hasMore = offset + slice.length < pecasComImagem.length
    return NextResponse.json(
      {
        success: true,
        mode: 'images',
        total: pecasComImagem.length,
        offset,
        limit,
        count: payload.length,
        hasMore,
        imagens: payload,
        message: `Foto ${offset + 1}–${offset + payload.length} de ${pecasComImagem.length}.`,
      },
      { headers: NO_STORE_HEADERS }
    )
  }

  const sliceRaw = pecas.slice(offset, offset + limit)
  const slice = lite ? sliceRaw.map(toLitePeca) : sliceRaw
  const hasMore = offset + slice.length < pecas.length

  return NextResponse.json(
    {
      success: true,
      mode: lite ? 'lite' : 'full',
      total: pecas.length,
      totalImages: pecasComImagem.length,
      offset,
      limit,
      count: slice.length,
      hasMore,
      pecas: slice,
      message: lite
        ? `Catálogo (sem fotos): ${offset + slice.length}/${pecas.length} peça(s).`
        : `Página ${Math.floor(offset / limit) + 1}: ${slice.length} peça(s) (${offset + slice.length}/${pecas.length}).`,
    },
    { headers: NO_STORE_HEADERS }
  )
}

/** Repõe biblioteca — modo lite (default) omite fotos base64; use ?images=1 para fotos uma a uma. */
export async function GET(request: NextRequest) {
  try {
    return await handleRepairRequest(request)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[repair-pecas-biblioteca GET]', error)
    return NextResponse.json({ success: false, message: msg }, { status: 500, headers: NO_STORE_HEADERS })
  }
}

/** Compatibilidade: devolve metadados — use GET ?lite=1 para transferir o catálogo completo. */
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

    const comImagem = pecas.filter(pecaTemImagemGrande).length

    return NextResponse.json(
      {
        success: true,
        total: pecas.length,
        totalImages: comImagem,
        usePagination: true,
        useLite: true,
        pageSize: MAX_PAGE_SIZE_LITE,
        message: `Use GET ?lite=1&limit=${MAX_PAGE_SIZE_LITE} para transferir ${pecas.length} peça(s) (~160 KB). Fotos: ?images=1&limit=1.`,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[repair-pecas-biblioteca POST]', error)
    return NextResponse.json({ success: false, message: msg }, { status: 500, headers: NO_STORE_HEADERS })
  }
}

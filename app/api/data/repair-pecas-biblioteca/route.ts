import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { ensureDataDir, resolveDataDirForKey } from '../shared'
import { getDemoContext, ensureDemoDataDir } from '../demo-context'
import { rejectUnauthenticatedProductionAccess } from '../../auth/appAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KEY = 'nonato-pecas-biblioteca'

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

/** Lê o catálogo completo de peças directamente do disco (ignora cache do browser). */
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

    let pecas = readPecasFromDisk(dataDir)
    if (!pecas || pecas.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Ficheiro ${KEY}.json vazio ou ausente no servidor.`,
        },
        { status: 404, headers: NO_STORE_HEADERS }
      )
    }

    return NextResponse.json(
      {
        success: true,
        count: pecas.length,
        pecas,
        message: `Catálogo lido do servidor: ${pecas.length} peça(s).`,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[repair-pecas-biblioteca]', error)
    return NextResponse.json({ success: false, message: msg }, { status: 500, headers: NO_STORE_HEADERS })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}

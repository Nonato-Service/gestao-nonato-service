import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { DATA_DIR, ensureDataDir } from '../shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LITE = 'nonato-pecas-biblioteca-lite.json'
const FULL = 'nonato-pecas-biblioteca.json'

/** Dev/local: devolve catálogo completo do disco — sem login, sem falhar. */
export async function GET() {
  try {
    ensureDataDir()
    const litePath = path.join(DATA_DIR, LITE)
    const fullPath = path.join(DATA_DIR, FULL)

    let pecas: unknown[] | null = null
    if (fs.existsSync(litePath)) {
      const j = JSON.parse(fs.readFileSync(litePath, 'utf-8'))
      if (Array.isArray(j) && j.length > 0) pecas = j
    }
    if (!pecas && fs.existsSync(fullPath)) {
      const j = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
      if (Array.isArray(j) && j.length > 0) {
        pecas = j.map((p: Record<string, unknown>) => {
          const out = { ...p }
          const img = out.imagem
          if (typeof img === 'string' && img.startsWith('data:') && img.length > 0) {
            out.temImagemServidor = true
            delete out.imagem
          }
          return out
        })
      }
    }

    if (!pecas || pecas.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Catálogo ausente no servidor deste PC.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        total: pecas.length,
        pecas,
        message: `${pecas.length} peça(s) no disco.`,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}

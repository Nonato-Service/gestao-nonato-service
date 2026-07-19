import { NextRequest, NextResponse } from 'next/server'

import fs from 'fs'

import path from 'path'

import { ensureDataDir, resolveDataDirForKey } from '../shared'

import { getDemoContext, ensureDemoDataDir } from '../demo-context'

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'

const KEY = 'nonato-pecas-biblioteca'

const NO_STORE_HEADERS: HeadersInit = {
  'Cache-Control': 'private, max-age=86400, stale-while-revalidate=604800',
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

function decodeDataUrlImagem(imagem: string): { mime: string; bytes: Buffer } | null {
  const s = imagem.trim()
  if (!s.startsWith('data:')) return null
  const comma = s.indexOf(',')
  if (comma < 0) return null
  const header = s.slice(0, comma)
  const b64 = s.slice(comma + 1)
  const mime = /^data:([^;,]+)/i.exec(header)?.[1]?.trim() || 'image/jpeg'
  try {
    const bytes = Buffer.from(b64, 'base64')
    if (bytes.length === 0) return null
    return { mime, bytes }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const { isDemo, expired, dataDir } = getDemoContext(request)
  if (isDemo && expired) {
    return new NextResponse(null, { status: 403, headers: NO_STORE_HEADERS })
  }

  const id = (new URL(request.url).searchParams.get('id') || '').trim()
  if (!id) {
    return NextResponse.json({ error: 'missing_id' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  ensureDataDir()
  ensureDemoDataDir(dataDir)

  const pecas = readPecasFromDisk(dataDir)
  if (!pecas) {
    return new NextResponse(null, { status: 404, headers: NO_STORE_HEADERS })
  }

  const peca = pecas.find((p) => String(p.id ?? '') === id)
  if (!peca) {
    return new NextResponse(null, { status: 404, headers: NO_STORE_HEADERS })
  }

  const imagem = typeof peca.imagem === 'string' ? peca.imagem : ''
  const decoded = decodeDataUrlImagem(imagem)
  if (!decoded) {
    return new NextResponse(null, { status: 404, headers: NO_STORE_HEADERS })
  }

  return new NextResponse(decoded.bytes, {
    status: 200,
    headers: {
      ...NO_STORE_HEADERS,
      'Content-Type': decoded.mime,
      'Content-Length': String(decoded.bytes.length),
    },
  })
}

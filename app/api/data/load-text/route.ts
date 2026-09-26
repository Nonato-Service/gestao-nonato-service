import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { ensureDataDir } from '../shared'
import { getDemoContext, ensureDemoDataDir } from '../demo-context'
import { rejectUnauthenticatedProductionAccess } from '../../auth/appAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function tryParseFile(filePath: string): unknown | null {
  if (!fs.existsSync(filePath)) return null
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    if (!content || !content.trim()) return null
    try {
      return JSON.parse(content)
    } catch {
      return content
    }
  } catch (e) {
    console.error(`Erro ao ler arquivo ${filePath}:`, e)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const authDenied = rejectUnauthenticatedProductionAccess(request)
    if (authDenied) return authDenied

    const { isDemo, expired, dataDir } = getDemoContext(request)
    if (isDemo && expired) {
      return NextResponse.json(
        { error: 'demo_expired', message: 'Período de demonstração expirado (15 dias).' },
        { status: 403 }
      )
    }
    ensureDataDir()
    ensureDemoDataDir(dataDir)

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'Chave (key) é obrigatória' },
        { status: 400 }
      )
    }

    const txtPath = path.join(dataDir, `${key}.txt`)
    const jsonPath = path.join(dataDir, `${key}.json`)

    // Logos / vídeos: .txt é a fonte (não comparar com .json antigo).
    if (key === 'nonato-logo' || key === 'nonato-logo-dashboard') {
      if (fs.existsSync(txtPath)) {
        try {
          const stats = fs.statSync(txtPath)
          if (stats.size > 0) {
            const content = fs.readFileSync(txtPath, 'utf-8')
            if (content && content.trim() !== '') {
              if (key === 'nonato-logo' && content.startsWith('data:video/')) {
                const base64Part = content.split(',')[1]
                if (base64Part && base64Part.length > 1000) {
                  return NextResponse.json({ success: true, data: content })
                }
                console.warn(
                  `Vídeo ${key} parece estar incompleto (${base64Part?.length || 0} caracteres)`
                )
              } else {
                return NextResponse.json({ success: true, data: content })
              }
            }
          }
        } catch (e) {
          console.error(`Erro ao ler arquivo ${key}.txt:`, e)
        }
      }
      return NextResponse.json({
        success: true,
        data: null,
        message: `Arquivo ${key} não encontrado`,
      })
    }

    /**
     * Cadastros (ex.: peças do stock): pode existir `.txt` antigo menor e `.json` mais completo.
     * Antes o load-text devolvia sempre o .txt e o telemóvel via 5 enquanto o PC lia 19 do local/json.
     * Alinhar com `/load`: ficar com a lista maior.
     */
    const fromTxt = tryParseFile(txtPath)
    const fromJson = tryParseFile(jsonPath)
    let data: unknown = fromJson
    if (Array.isArray(fromJson) && Array.isArray(fromTxt) && fromTxt.length > fromJson.length) {
      data = fromTxt
    } else if (fromJson == null && fromTxt != null) {
      data = fromTxt
    } else if (
      fromJson != null &&
      fromTxt != null &&
      !Array.isArray(fromJson) &&
      typeof fromTxt === 'string' &&
      fromTxt.length > (typeof fromJson === 'string' ? fromJson.length : 0)
    ) {
      // Manuais / blobs: preferir .txt mais rico quando ambos existem.
      data = fromTxt
    }

    if (data == null) {
      return NextResponse.json({
        success: true,
        data: null,
        message: `Arquivo ${key} não encontrado`,
      })
    }
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Erro ao carregar dados:', error)
    const msg = process.env.NODE_ENV === 'development' ? error.message : 'Erro ao carregar dados'
    return NextResponse.json(
      { error: 'Erro ao carregar dados', details: msg },
      { status: 500 }
    )
  }
}

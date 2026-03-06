import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { ensureDataDir } from '../shared'
import { getDemoContext, ensureDemoDataDir } from '../demo-context'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { isDemo, expired, dataDir } = getDemoContext(request)
    if (isDemo && expired) {
      return NextResponse.json(
        { error: 'demo_expired', message: 'Período de demonstração expirado (15 dias).' },
        { status: 403 }
      )
    }
    ensureDataDir()
    ensureDemoDataDir(dataDir)
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Chave (key) é obrigatória' },
        { status: 400 }
      )
    }

    const filePath = path.join(dataDir, `${key}.json`)
    
    // Salvar o arquivo
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')

    return NextResponse.json({ 
      success: true, 
      message: `Dados salvos com sucesso: ${key}` 
    })
  } catch (error: any) {
    console.error('Erro ao salvar dados:', error)
    const msg = process.env.NODE_ENV === 'development' ? error.message : 'Erro ao salvar dados'
    return NextResponse.json(
      { error: 'Erro ao salvar dados', details: msg },
      { status: 500 }
    )
  }
}



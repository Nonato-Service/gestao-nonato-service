import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { DATA_DIR, ensureDataDir } from '../shared'

export async function POST(request: NextRequest) {
  try {
    ensureDataDir()
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Chave (key) é obrigatória' },
        { status: 400 }
      )
    }

    const filePath = path.join(DATA_DIR, `${key}.json`)
    
    // Salvar o arquivo
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')

    return NextResponse.json({ 
      success: true, 
      message: `Dados salvos com sucesso: ${key}` 
    })
  } catch (error: any) {
    console.error('Erro ao salvar dados:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar dados: ' + error.message },
      { status: 500 }
    )
  }
}



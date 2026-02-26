import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { DATA_DIR, ensureDataDir } from '../shared'

export async function POST(request: NextRequest) {
  try {
    ensureDataDir()
    const allData = await request.json()

    if (!allData || typeof allData !== 'object') {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    const saved: string[] = []
    const errors: string[] = []

    // Salvar cada item
    for (const [key, value] of Object.entries(allData)) {
      try {
        const filePath = path.join(DATA_DIR, `${key}.json`)
        fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')
        saved.push(key)
      } catch (error: any) {
        console.error(`Erro ao salvar ${key}:`, error)
        errors.push(`${key}: ${error.message}`)
      }
    }

    return NextResponse.json({ 
      success: true, 
      saved,
      errors: errors.length > 0 ? errors : undefined,
      message: `Salvos ${saved.length} arquivo(s)` 
    })
  } catch (error: any) {
    console.error('Erro ao salvar todos os dados:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar dados: ' + error.message },
      { status: 500 }
    )
  }
}



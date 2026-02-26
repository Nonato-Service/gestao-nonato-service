import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { DATA_DIR, ensureDataDir } from '../shared'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    ensureDataDir()

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      // Retornar todos os dados disponíveis
      const jsonFiles = fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')) : []
      const txtFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.txt'))
      const allData: Record<string, any> = {}
      
      // Carregar arquivos JSON
      for (const file of jsonFiles) {
        const fileKey = file.replace('.json', '')
        const filePath = path.join(DATA_DIR, file)
        try {
          const content = fs.readFileSync(filePath, 'utf-8')
          // Verificar se o conteúdo não está vazio
          if (content && content.trim() !== '') {
            allData[fileKey] = JSON.parse(content)
          }
        } catch (e) {
          console.error(`Erro ao ler arquivo ${file}:`, e)
          // Continuar mesmo se houver erro em um arquivo
        }
      }
      
      // Carregar arquivos TXT (para vídeos/imagens grandes)
      for (const file of txtFiles) {
        const fileKey = file.replace('.txt', '')
        // Só adicionar se não existir já no JSON (prioridade para JSON)
        if (!allData[fileKey]) {
          const filePath = path.join(DATA_DIR, file)
          try {
            const content = fs.readFileSync(filePath, 'utf-8')
            if (content && content.trim() !== '') {
              allData[fileKey] = content
            }
          } catch (e) {
            console.error(`Erro ao ler arquivo ${file}:`, e)
          }
        }
      }
      
      return NextResponse.json({ success: true, data: allData })
    }

    // Carregar um arquivo específico
    const filePath = path.join(DATA_DIR, `${key}.json`)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: `Arquivo ${key} não encontrado` 
      })
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    // Verificar se o conteúdo não está vazio
    if (!content || content.trim() === '') {
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: `Arquivo ${key} está vazio` 
      })
    }
    
    try {
      const data = JSON.parse(content)
      return NextResponse.json({ success: true, data })
    } catch (parseError: any) {
      console.error(`Erro ao fazer parse do arquivo ${key}:`, parseError)
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: `Arquivo ${key} contém JSON inválido` 
      })
    }
  } catch (error: any) {
    console.error('Erro ao carregar dados:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar dados: ' + error.message },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { DATA_DIR, ensureDataDir } from '../../data/shared'

const LOGO_VIDEO_PATH = path.join(DATA_DIR, 'nonato-logo.mp4')

export async function GET(request: NextRequest) {
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(LOGO_VIDEO_PATH)) {
      return NextResponse.json(
        { error: 'Vídeo não encontrado' },
        { status: 404 }
      )
    }

    // Ler o arquivo
    const videoBuffer = fs.readFileSync(LOGO_VIDEO_PATH)
    
    // Retornar o vídeo com os headers corretos
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error: any) {
    console.error('Erro ao servir vídeo:', error)
    return NextResponse.json(
      { error: 'Erro ao servir vídeo: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar se o arquivo existe
    if (fs.existsSync(LOGO_VIDEO_PATH)) {
      fs.unlinkSync(LOGO_VIDEO_PATH)
      return NextResponse.json({ 
        success: true, 
        message: 'Vídeo removido com sucesso' 
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Vídeo não encontrado' 
    })
  } catch (error: any) {
    console.error('Erro ao remover vídeo:', error)
    return NextResponse.json(
      { error: 'Erro ao remover vídeo: ' + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('video') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      )
    }

    ensureDataDir()

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Salvar o arquivo binário
    fs.writeFileSync(LOGO_VIDEO_PATH, buffer)

    return NextResponse.json({ 
      success: true, 
      message: 'Vídeo salvo com sucesso',
      size: buffer.length
    })
  } catch (error: any) {
    console.error('Erro ao salvar vídeo:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar vídeo: ' + error.message },
      { status: 500 }
    )
  }
}


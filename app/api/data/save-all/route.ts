import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { ensureDataDir, resolveDataDirForKey } from '../shared'
import { getDemoContext, ensureDemoDataDir } from '../demo-context'
import { bumpSyncMeta } from '../syncMeta'

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
    const allData = await request.json()

    if (!allData || typeof allData !== 'object') {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    const saved: string[] = []
    const errors: string[] = []

    const bumpedDirs = new Set<string>()

    // Salvar cada item
    for (const [key, value] of Object.entries(allData)) {
      try {
        const targetDir = resolveDataDirForKey(key, dataDir)
        ensureDemoDataDir(targetDir)
        const filePath = path.join(targetDir, `${key}.json`)
        fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')
        saved.push(key)
        bumpedDirs.add(targetDir)
      } catch (error: any) {
        console.error(`Erro ao salvar ${key}:`, error)
        errors.push(`${key}: ${error.message}`)
      }
    }

    let revision: number | undefined
    let updatedAt: string | undefined
    try {
      for (const dir of bumpedDirs) {
        const meta = bumpSyncMeta(dir)
        revision = meta.revision
        updatedAt = meta.updatedAt
      }
    } catch (e) {
      console.error('bumpSyncMeta (save-all):', e)
    }

    return NextResponse.json({ 
      success: true, 
      saved,
      errors: errors.length > 0 ? errors : undefined,
      message: `Salvos ${saved.length} arquivo(s)`,
      ...(revision !== undefined ? { revision, updatedAt } : {})
    })
  } catch (error: any) {
    console.error('Erro ao salvar todos os dados:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar dados: ' + error.message },
      { status: 500 }
    )
  }
}



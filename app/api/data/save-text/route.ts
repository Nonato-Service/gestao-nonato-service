import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { ensureDataDir, resolveDataDirForKey } from '../shared'
import { getDemoContext, ensureDemoDataDir } from '../demo-context'
import { rejectUnauthenticatedProductionAccess } from '../../auth/appAuth'
import { bumpSyncMeta, readSyncMeta } from '../syncMeta'
import { textFileContentUnchanged, writeTextFileAtomic } from '../writeIfChanged'
import { assessServerCadastroTextWrite } from '../../../lib/serverCadastroGuard'

export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Chave (key) é obrigatória' },
        { status: 400 }
      )
    }

    const filePath = path.join(dataDir, `${key}.txt`)
    const jsonGuardPath = path.join(resolveDataDirForKey(key, dataDir), `${key}.json`)
    const textPayload = typeof value === 'string' ? value : String(value)

    let revision: number | undefined
    let updatedAt: string | undefined
    try {
      if (textFileContentUnchanged(filePath, textPayload)) {
        const meta = readSyncMeta(dataDir)
        revision = meta.revision
        updatedAt = meta.updatedAt
      } else {
        const guard = assessServerCadastroTextWrite(key, textPayload, jsonGuardPath)
        if (!guard.allowed) {
          console.warn(
            `[Nonato API save-text] Bloqueado (${guard.reason}): ${key} — servidor ${guard.existingCount}, pedido ${guard.newCount}`
          )
          return NextResponse.json(
            {
              error: 'cadastro_protected',
              reason: guard.reason,
              key,
              existingCount: guard.existingCount,
              newCount: guard.newCount,
            },
            { status: 409 }
          )
        }
        writeTextFileAtomic(filePath, textPayload)
        const meta = bumpSyncMeta(dataDir)
        revision = meta.revision
        updatedAt = meta.updatedAt
        // Evitar que um .json antigo prevaleça sobre o .txt no bundle /load (JSON era lido primeiro).
        if (
          key === 'nonato-logos-relatorios' ||
          key === 'nonato-logo' ||
          key === 'nonato-logo-dashboard' ||
          key === 'nonato-manuais-familias-grupos' ||
          key === 'nonato-biblia-nonato-service' ||
          key === 'nonato-conhecimento-tecnico-unificado'
        ) {
          try {
            const jsonPath = path.join(resolveDataDirForKey(key, dataDir), `${key}.json`)
            if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath)
          } catch {
            /* ignorar */
          }
        }
      }
    } catch (e) {
      console.error('bumpSyncMeta (save-text):', e)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Dados salvos com sucesso: ${key}`,
      ...(revision !== undefined ? { revision, updatedAt } : {})
    })
  } catch (error: any) {
    console.error('Erro ao salvar dados:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar dados: ' + error.message },
      { status: 500 }
    )
  }
}



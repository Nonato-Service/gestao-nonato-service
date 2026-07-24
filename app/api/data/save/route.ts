import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { assertApiAuthorized } from '../../apiSecurity'
import { ensureDataDir, resolveDataDirForKey } from '../shared'
import { getDemoContext, ensureDemoDataDir } from '../demo-context'
import { rejectUnauthenticatedProductionAccess } from '../../auth/appAuth'
import { bumpSyncMeta, readSyncMeta } from '../syncMeta'
import { jsonFileContentUnchanged, writeJsonFileAtomic } from '../writeIfChanged'
import { assessServerCadastroWrite } from '../../../lib/serverCadastroGuard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const API_CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
}

function jsonHeaders(): HeadersInit {
  return { ...API_CORS_HEADERS }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: jsonHeaders() })
}

export async function POST(request: NextRequest) {
  try {
    const denied = assertApiAuthorized(request)
    if (denied) return denied
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
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Chave (key) é obrigatória' },
        { status: 400 }
      )
    }

    const targetDir = resolveDataDirForKey(key, dataDir)
    ensureDemoDataDir(targetDir)
    const filePath = path.join(targetDir, `${key}.json`)

    let revision: number | undefined
    let updatedAt: string | undefined
    try {
      // Revisão multi-dispositivo: sempre na pasta da sessão (`dataDir`), igual a `/api/data/sync-status`.
      // Antes usava-se `targetDir` (ex.: `data/` para chaves globais em modo demo) e os outros aparelhos
      // liam `data/demo/.../_sync-meta.json` — a revisão não subia e o aviso não batia com os dados.
      if (jsonFileContentUnchanged(filePath, value)) {
        const meta = readSyncMeta(dataDir)
        revision = meta.revision
        updatedAt = meta.updatedAt
      } else {
        const guard = assessServerCadastroWrite(key, value, filePath)
        if (!guard.allowed) {
          console.warn(
            `[Nonato API] Gravação bloqueada (${guard.reason}): ${key} — servidor ${guard.existingCount}, pedido ${guard.newCount}`
          )
          return NextResponse.json(
            {
              error: 'cadastro_protected',
              reason: guard.reason,
              key,
              existingCount: guard.existingCount,
              newCount: guard.newCount,
              message:
                guard.reason === 'empty_overwrite'
                  ? `Não é permitido apagar «${key}» com lista vazia enquanto existirem ${guard.existingCount} registo(s) no servidor.`
                  : `Não é permitido reduzir «${key}» de ${guard.existingCount} para ${guard.newCount} registo(s).`,
            },
            { status: 409, headers: jsonHeaders() }
          )
        }
        writeJsonFileAtomic(filePath, value)
        const meta = bumpSyncMeta(dataDir)
        revision = meta.revision
        updatedAt = meta.updatedAt
        // Logo em .json (pequeno ou vazio): remover .txt antigo para o bundle /load não preferir dados obsoletos.
        if (key === 'nonato-logo' || key === 'nonato-logo-dashboard') {
          try {
            const txtPath = path.join(targetDir, `${key}.txt`)
            if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath)
          } catch {
            /* ignorar */
          }
        }
      }
    } catch (e) {
      console.error('bumpSyncMeta (save):', e)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Dados salvos com sucesso: ${key}`,
      ...(revision !== undefined ? { revision, updatedAt } : {})
    }, { headers: jsonHeaders() })
  } catch (error: any) {
    console.error('Erro ao salvar dados:', error)
    const msg = process.env.NODE_ENV === 'development' ? error.message : 'Erro ao salvar dados'
    return NextResponse.json(
      { error: 'Erro ao salvar dados', details: msg },
      { status: 500 }
    )
  }
}



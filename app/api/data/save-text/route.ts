import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { ensureDataDir, resolveDataDirForKey } from '../shared'
import { getDemoContext, ensureDemoDataDir } from '../demo-context'
import { rejectUnauthenticatedProductionAccess } from '../../auth/appAuth'
import { bumpSyncMeta, readSyncMeta } from '../syncMeta'
import { textFileContentUnchanged, writeTextFileAtomic, writeJsonFileAtomic } from '../writeIfChanged'
import { assessServerCadastroTextWrite, assessServerCadastroWrite, resolveCadastroWriteValue } from '../../../lib/serverCadastroGuard'
import { buildPecasBibliotecaLite } from '../../../lib/pecasBibliotecaLite'

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

    const targetDir = resolveDataDirForKey(key, dataDir)
    const filePath = path.join(dataDir, `${key}.txt`)
    const jsonGuardPath = path.join(targetDir, `${key}.json`)

    /**
     * Biblioteca de peças: gravar sempre `.json` + lite.
     * Clientes antigos enviavam array (não string) e `String(array)` virava "[object Object]…" —
     * o `.txt` ficava corrompido e o telemóvel continuava a ler o `.json` antigo.
     */
    if (key === 'nonato-pecas-biblioteca') {
      let pecas: unknown = value
      if (typeof value === 'string') {
        try {
          pecas = JSON.parse(value)
        } catch {
          return NextResponse.json({ error: 'JSON de peças inválido' }, { status: 400 })
        }
      }
      if (!Array.isArray(pecas)) {
        return NextResponse.json({ error: 'Biblioteca de peças deve ser um array' }, { status: 400 })
      }
      const guard = assessServerCadastroWrite(key, pecas, jsonGuardPath)
      if (!guard.allowed) {
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
      writeJsonFileAtomic(jsonGuardPath, pecas)
      try {
        writeJsonFileAtomic(path.join(targetDir, 'nonato-pecas-biblioteca-lite.json'), buildPecasBibliotecaLite(pecas))
      } catch (liteErr) {
        console.warn('[Nonato API save-text] Falha ao gerar lite de peças:', liteErr)
      }
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      } catch {
        /* ignorar */
      }
      const meta = bumpSyncMeta(dataDir)
      return NextResponse.json({
        success: true,
        message: `Dados salvos com sucesso: ${key}`,
        revision: meta.revision,
        updatedAt: meta.updatedAt,
        total: pecas.length,
      })
    }

    /**
     * Stock de peças (e categorias): sempre `.json` (como a biblioteca).
     * Antes um `.txt` grande coexistia com `.json` pequeno — o bootstrap do /load lia só o JSON
     * e o viajante ficava com 5 peças enquanto o escritório tinha 19 no browser.
     */
    if (
      key === 'nonato-pecas-stock' ||
      key === 'nonato-categorias-pecas-stock' ||
      key === 'nonato-subcategorias-pecas-stock'
    ) {
      let stock: unknown = value
      if (typeof value === 'string') {
        try {
          stock = JSON.parse(value)
        } catch {
          return NextResponse.json({ error: 'JSON de stock inválido' }, { status: 400 })
        }
      }
      if (!Array.isArray(stock)) {
        return NextResponse.json({ error: 'Stock de peças deve ser um array' }, { status: 400 })
      }
      const resolved = resolveCadastroWriteValue(key, stock, jsonGuardPath)
      if (!resolved.ok) {
        const guard = resolved.guard
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
      writeJsonFileAtomic(jsonGuardPath, resolved.value)
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      } catch {
        /* ignorar */
      }
      const meta = bumpSyncMeta(dataDir)
      const total = Array.isArray(resolved.value) ? resolved.value.length : stock.length
      return NextResponse.json({
        success: true,
        message: `Dados salvos com sucesso: ${key}`,
        revision: meta.revision,
        updatedAt: meta.updatedAt,
        total,
      })
    }

    const textPayload = typeof value === 'string' ? value : JSON.stringify(value)

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



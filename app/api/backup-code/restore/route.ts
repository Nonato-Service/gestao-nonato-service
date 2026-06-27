import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDemoContext } from '../../data/demo-context'
import { getProjectRoot } from '../project-root'
import { isBackupPathSafe, restoreCodeFromSource } from '../shared'

export async function POST(request: NextRequest) {
  try {
    const { isDemo } = getDemoContext(request)
    if (isDemo) {
      return NextResponse.json({ error: 'Restauração desativada no modo demonstração.' }, { status: 403 })
    }

    const projectRoot = path.resolve(getProjectRoot())
    const backupsDir = path.join(projectRoot, 'backups')
    const body = await request.json()
    const { backupPath: rawBackupPath } = body || {}

    if (!rawBackupPath || typeof rawBackupPath !== 'string') {
      return NextResponse.json({ error: 'backupPath é obrigatório' }, { status: 400 })
    }

    const backupPath = path.resolve(rawBackupPath)
    if (!isBackupPathSafe(backupPath, backupsDir)) {
      return NextResponse.json(
        { error: 'Caminho do backup inválido ou não encontrado. Deve estar dentro da pasta backups/.' },
        { status: 400 }
      )
    }

    const { restoredFiles, restoredItems } = restoreCodeFromSource(backupPath, projectRoot)

    if (restoredFiles.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum ficheiro restaurado — o backup parece vazio ou incompleto.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      backupPath,
      filesCount: restoredFiles.length,
      itemsRestored: restoredItems,
      message: `Restaurados ${restoredFiles.length} ficheiro(s) (${restoredItems.join(', ')}). Recarregue a aplicação.`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Erro ao restaurar backup:', error)
    return NextResponse.json({ error: 'Erro ao restaurar backup: ' + message }, { status: 500 })
  }
}

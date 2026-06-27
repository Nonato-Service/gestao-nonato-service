import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'
import AdmZip from 'adm-zip'
import { getDemoContext } from '../../data/demo-context'
import { getProjectRoot } from '../project-root'
import { resolveBackupContentRoot, restoreCodeFromSource } from '../shared'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let tempDir: string | null = null
  try {
    const { isDemo } = getDemoContext(request)
    if (isDemo) {
      return NextResponse.json(
        { error: 'Restaurar a partir de ZIP desativado no modo demonstração.' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Envie um ficheiro ZIP (campo "file").' }, { status: 400 })
    }

    const fileName = (file as File).name?.toLowerCase() || ''
    if (!fileName.endsWith('.zip')) {
      return NextResponse.json({ error: 'O ficheiro deve ser um .zip (backup do código).' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length < 100) {
      return NextResponse.json({ error: 'O ficheiro ZIP está vazio ou é demasiado pequeno.' }, { status: 400 })
    }

    const zip = new AdmZip(buffer)
    tempDir = path.join(os.tmpdir(), `restore-zip-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    zip.extractAllTo(tempDir, true)

    const contentRoot = resolveBackupContentRoot(tempDir)
    const projectRoot = path.resolve(getProjectRoot())

    const { restoredFiles, restoredItems } = restoreCodeFromSource(contentRoot, projectRoot)

    if (restoredFiles.length === 0) {
      return NextResponse.json(
        {
          error:
            'Nenhum ficheiro foi restaurado. O ZIP deve conter a pasta app/ e package.json na raiz (ou numa subpasta do projeto).',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      filesCount: restoredFiles.length,
      itemsRestored: restoredItems,
      contentRoot: path.relative(tempDir, contentRoot) || '.',
      projectRoot,
      message: `Restaurados ${restoredFiles.length} ficheiro(s) a partir do ZIP (${restoredItems.join(', ')}). Recarregue a aplicação. Se alterou package.json, execute npm install.`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[restore-from-zip]', error)
    return NextResponse.json({ error: 'Erro ao restaurar a partir do ZIP: ' + message }, { status: 500 })
  } finally {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch {
        /* ignorar */
      }
    }
  }
}

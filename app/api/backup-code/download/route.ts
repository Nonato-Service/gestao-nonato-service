import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { createReadStream } from 'fs'
import { getDemoContext } from '../../data/demo-context'
import { getProjectRoot } from '../project-root'
import {
  ensureBackupLayout,
  formatBackupStamp,
  getCodigoBackupsDir,
  MAX_CODIGO_ZIP_ON_DISK,
  pruneFilesInDir,
} from '../backup-paths'
import { writeCodeZipToFile } from '../zip-code'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { isDemo } = getDemoContext(request)
    if (isDemo) {
      return NextResponse.json(
        { error: 'Descarregar backup desativado no modo demonstração.' },
        { status: 403 }
      )
    }

    const projectRoot = path.resolve(getProjectRoot())
    ensureBackupLayout(projectRoot)
    const codigoDir = getCodigoBackupsDir(projectRoot)
    const stamp = formatBackupStamp()
    const fileName = `backup-codigo-${stamp}.zip`
    const savedPath = path.join(codigoDir, fileName)

    await writeCodeZipToFile(projectRoot, savedPath)

    pruneFilesInDir(
      codigoDir,
      (name) => name.startsWith('backup-codigo-') && name.endsWith('.zip'),
      MAX_CODIGO_ZIP_ON_DISK
    )

    const stat = fs.statSync(savedPath)
    const stream = createReadStream(savedPath)

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(stat.size),
        'X-Backup-Saved-Path': savedPath,
        'X-Backup-Saved-Folder': path.resolve(codigoDir),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[backup-code/download]', error)
    return NextResponse.json({ error: 'Erro ao criar ZIP: ' + message }, { status: 500 })
  }
}

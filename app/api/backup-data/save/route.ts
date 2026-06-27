import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDemoContext } from '../../data/demo-context'
import { getProjectRoot } from '../../backup-code/project-root'
import {
  ensureBackupLayout,
  formatBackupStamp,
  getJsonBackupsDir,
  MAX_JSON_BACKUPS_ON_DISK,
  pruneFilesInDir,
} from '../../backup-code/backup-paths'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { isDemo } = getDemoContext(request)
    if (isDemo) {
      return NextResponse.json({ error: 'Backup de dados desativado no modo demonstração.' }, { status: 403 })
    }

    const body = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Corpo JSON inválido.' }, { status: 400 })
    }

    const projectRoot = path.resolve(getProjectRoot())
    const { jsonDir } = ensureBackupLayout(projectRoot)
    const stamp = formatBackupStamp()
    const fileName = `backup-dados-${stamp}.json`
    const filePath = path.join(jsonDir, fileName)
    const jsonStr = JSON.stringify(body, null, 2)

    fs.writeFileSync(filePath, jsonStr, 'utf-8')

    pruneFilesInDir(
      jsonDir,
      (name) => name.startsWith('backup-dados-') && name.endsWith('.json'),
      MAX_JSON_BACKUPS_ON_DISK
    )

    return NextResponse.json({
      success: true,
      fileName,
      filePath,
      jsonFolder: path.resolve(jsonDir),
      jsonFolderAbsolute: path.resolve(jsonDir),
      sizeBytes: Buffer.byteLength(jsonStr, 'utf-8'),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[backup-data/save]', error)
    return NextResponse.json({ error: 'Erro ao guardar backup JSON: ' + message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const projectRoot = path.resolve(getProjectRoot())
    const jsonDir = getJsonBackupsDir(projectRoot)
    if (!fs.existsSync(jsonDir)) {
      return NextResponse.json({ files: [], jsonFolder: path.resolve(jsonDir) })
    }
    const files = fs
      .readdirSync(jsonDir)
      .filter((n) => n.startsWith('backup-dados-') && n.endsWith('.json'))
      .map((name) => {
        const full = path.join(jsonDir, name)
        const stat = fs.statSync(full)
        return { name, path: full, sizeBytes: stat.size, modified: stat.mtime.toISOString() }
      })
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
    return NextResponse.json({ files, jsonFolder: path.resolve(jsonDir) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

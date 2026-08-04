import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { createReadStream } from 'fs'
import { getDemoContext } from '../../data/demo-context'
import { getProjectRoot } from '../../backup-code/project-root'
import {
  ensureBackupLayout,
  formatBackupStamp,
  getPersistentJsonBackupsDir,
  MAX_JSON_BACKUPS_ON_DISK,
  pruneFilesInDir,
} from '../../backup-code/backup-paths'
import { writeDataZipToFile } from '../zip-data'

export const runtime = 'nodejs'

function isSaveOnlyMode(request: NextRequest): boolean {
  return request.nextUrl.searchParams.get('mode') === 'save'
}

/**
 * GET — descarrega ZIP com pasta data/ (servidor) + último backup JSON em disco.
 * POST — recebe envelope JSON no body e inclui no ZIP junto com data/.
 * ?mode=save — guarda só em backups/json/ e devolve JSON (sem download no browser).
 */
export async function GET(request: NextRequest) {
  try {
    const projectRoot = path.resolve(getProjectRoot())
    ensureBackupLayout(projectRoot)
    const jsonDir = getPersistentJsonBackupsDir(projectRoot)
    const stamp = formatBackupStamp()
    const fileName = `backup-dados-completo-${stamp}.zip`
    const savedPath = path.join(jsonDir, fileName)

    let envelope: unknown | undefined
    if (fs.existsSync(jsonDir)) {
      const latest = fs
        .readdirSync(jsonDir)
        .filter((n) => n.startsWith('backup-dados-') && n.endsWith('.json') && !n.includes('completo'))
        .map((name) => ({ name, mtime: fs.statSync(path.join(jsonDir, name)).mtime.getTime() }))
        .sort((a, b) => b.mtime - a.mtime)[0]
      if (latest) {
        try {
          envelope = JSON.parse(fs.readFileSync(path.join(jsonDir, latest.name), 'utf-8'))
        } catch {
          /* ignorar */
        }
      }
    }

    await writeDataZipToFile({
      destZipPath: savedPath,
      envelopeJson: envelope,
      envelopeFileName: envelope ? `backup-dados-${stamp}.json` : undefined,
    })

    pruneFilesInDir(
      jsonDir,
      (name) => name.startsWith('backup-dados-completo-') && name.endsWith('.zip'),
      10
    )

    const stat = fs.statSync(savedPath)
    const resolvedPath = path.resolve(savedPath)
    const resolvedFolder = path.resolve(jsonDir)

    if (isSaveOnlyMode(request)) {
      return NextResponse.json({
        success: true,
        fileName,
        savedPath: resolvedPath,
        jsonFolder: resolvedFolder,
        backupsFolder: path.resolve(path.dirname(resolvedFolder)),
        sizeBytes: stat.size,
      })
    }

    const stream = createReadStream(savedPath)

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(stat.size),
        'X-Backup-Saved-Path': resolvedPath,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[backup-data/download-zip GET]', error)
    return NextResponse.json({ error: 'Erro ao criar ZIP de dados: ' + message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { isDemo } = getDemoContext(request)
    if (isDemo) {
      return NextResponse.json({ error: 'Backup ZIP desativado no modo demonstração.' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Envie o envelope JSON do backup no corpo do pedido.' }, { status: 400 })
    }

    const projectRoot = path.resolve(getProjectRoot())
    ensureBackupLayout(projectRoot)
    const jsonDir = getPersistentJsonBackupsDir(projectRoot)
    const stamp = formatBackupStamp()
    const fileName = `backup-dados-completo-${stamp}.zip`
    const savedPath = path.join(jsonDir, fileName)

    await writeDataZipToFile({
      destZipPath: savedPath,
      envelopeJson: body,
      envelopeFileName: `backup-dados-${stamp}.json`,
    })

    pruneFilesInDir(
      jsonDir,
      (name) => name.startsWith('backup-dados-completo-') && name.endsWith('.zip'),
      10
    )

    const stat = fs.statSync(savedPath)
    const resolvedPath = path.resolve(savedPath)
    const resolvedFolder = path.resolve(jsonDir)

    if (isSaveOnlyMode(request)) {
      return NextResponse.json({
        success: true,
        fileName,
        savedPath: resolvedPath,
        jsonFolder: resolvedFolder,
        backupsFolder: path.resolve(path.dirname(resolvedFolder)),
        sizeBytes: stat.size,
      })
    }

    const stream = createReadStream(savedPath)

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(stat.size),
        'X-Backup-Saved-Path': resolvedPath,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[backup-data/download-zip POST]', error)
    return NextResponse.json({ error: 'Erro ao criar ZIP de dados: ' + message }, { status: 500 })
  }
}

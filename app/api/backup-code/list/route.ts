import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDemoContext } from '../../data/demo-context'
import { getProjectRoot } from '../project-root'
import { ensureBackupLayout, getCodigoBackupsDir, listCodeBackupFolderNames } from '../backup-paths'

export async function GET(request: NextRequest) {
  try {
    const { isDemo } = getDemoContext(request)
    if (isDemo) {
      return NextResponse.json({ backups: [] }, { status: 200 })
    }
    const projectRoot = getProjectRoot()
    const { root: backupsFolder, jsonDir, codigoDir } = ensureBackupLayout(projectRoot)
    const backupsFolderResolved = path.resolve(backupsFolder)
    const codigoFolder = path.resolve(codigoDir)
    const jsonFolder = path.resolve(jsonDir)

    const folderPaths = listCodeBackupFolderNames(projectRoot)
    const backups = folderPaths.map((backupPath) => {
      const stat = fs.statSync(backupPath)
      const metadataPath = path.join(backupPath, 'metadata.json')
      let metadata: { timestamp?: string; filesCount?: number } | null = null
      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
        } catch {
          /* ignorar */
        }
      }
      return {
        name: path.basename(backupPath),
        path: backupPath,
        created: stat.birthtime.toISOString(),
        modified: stat.mtime.toISOString(),
        timestamp: metadata?.timestamp || stat.birthtime.toISOString(),
        filesCount: metadata?.filesCount ?? 0,
        metadata,
      }
    })

    let zipFiles: Array<{ name: string; path: string; sizeBytes: number; modified: string }> = []
    if (fs.existsSync(codigoDir)) {
      zipFiles = fs
        .readdirSync(codigoDir)
        .filter((n) => n.startsWith('backup-codigo-') && n.endsWith('.zip'))
        .map((name) => {
          const full = path.join(codigoDir, name)
          const stat = fs.statSync(full)
          return { name, path: full, sizeBytes: stat.size, modified: stat.mtime.toISOString() }
        })
        .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
    }

    return NextResponse.json({
      backups,
      backupsFolder: backupsFolderResolved,
      codigoFolder,
      jsonFolder,
      zipFiles,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Erro ao listar backups: ' + message }, { status: 500 })
  }
}

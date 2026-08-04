import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDemoContext } from '../../data/demo-context'
import { getProjectRoot } from '../project-root'
import { hasCodeBackupMarkers } from '../shared'
import { ensureBackupLayout, getCodigoBackupsDir, listCodeBackupFolderNames } from '../backup-paths'
import { DATA_DIR } from '../../data/shared'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { isDemo } = getDemoContext(request)
    const projectRoot = path.resolve(getProjectRoot())
    const { root: backupsDir, jsonDir, codigoDir } = ensureBackupLayout(projectRoot)
    const onRailway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)

    const backupsCount = listCodeBackupFolderNames(projectRoot).length

    let jsonCount = 0
    let zipCount = 0
    if (fs.existsSync(jsonDir)) {
      jsonCount = fs.readdirSync(jsonDir).filter((n) => n.startsWith('backup-dados-') && n.endsWith('.json')).length
    }
    if (fs.existsSync(codigoDir)) {
      zipCount = fs.readdirSync(codigoDir).filter((n) => n.startsWith('backup-codigo-') && n.endsWith('.zip')).length
    }

    let writable = false
    try {
      const probe = path.join(backupsDir, '.write-probe')
      fs.writeFileSync(probe, String(Date.now()), 'utf-8')
      fs.unlinkSync(probe)
      writable = true
    } catch {
      writable = false
    }

    let dataFileCount = 0
    if (fs.existsSync(DATA_DIR)) {
      dataFileCount = fs.readdirSync(DATA_DIR).filter((n) => n.startsWith('nonato-') && n.endsWith('.json')).length
    }

    return NextResponse.json({
      projectRoot,
      backupsFolder: path.resolve(backupsDir),
      jsonFolder: path.resolve(jsonDir),
      codigoFolder: path.resolve(getCodigoBackupsDir(projectRoot)),
      dataFolder: path.resolve(DATA_DIR),
      backupsCount,
      jsonCount,
      zipCount,
      dataFileCount,
      projectRootValid: hasCodeBackupMarkers(projectRoot),
      writable,
      isDemo,
      onRailway,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

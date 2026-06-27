import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDemoContext } from '../../data/demo-context'
import { getProjectRoot } from '../project-root'
import { hasCodeBackupMarkers } from '../shared'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { isDemo } = getDemoContext(request)
    const projectRoot = path.resolve(getProjectRoot())
    const backupsDir = path.join(projectRoot, 'backups')
    const onRailway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)

    let backupsCount = 0
    if (fs.existsSync(backupsDir)) {
      backupsCount = fs.readdirSync(backupsDir).filter((n) => n.startsWith('code-backup-')).length
    }

    let writable = false
    try {
      if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true })
      const probe = path.join(backupsDir, '.write-probe')
      fs.writeFileSync(probe, String(Date.now()), 'utf-8')
      fs.unlinkSync(probe)
      writable = true
    } catch {
      writable = false
    }

    return NextResponse.json({
      projectRoot,
      backupsFolder: path.resolve(backupsDir),
      backupsCount,
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

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDemoContext } from '../../data/demo-context'

export async function GET(request: NextRequest) {
  try {
    const { isDemo } = getDemoContext(request)
    if (isDemo) {
      return NextResponse.json({ backups: [] }, { status: 200 })
    }
    const projectRoot = process.cwd()
    const backupsDir = path.join(projectRoot, 'backups')

    if (!fs.existsSync(backupsDir)) {
      return NextResponse.json({ backups: [] })
    }

    const backups = fs.readdirSync(backupsDir)
      .filter(item => item.startsWith('code-backup-'))
      .map(item => {
        const backupPath = path.join(backupsDir, item)
        const stat = fs.statSync(backupPath)
        const metadataPath = path.join(backupPath, 'metadata.json')
        let metadata = null
        if (fs.existsSync(metadataPath)) {
          try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
          } catch (e) {
            // Ignorar erro
          }
        }
        return {
          name: item,
          path: backupPath,
          created: stat.birthtime.toISOString(),
          modified: stat.mtime.toISOString(),
          metadata
        }
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

    return NextResponse.json({ backups })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao listar backups: ' + error.message },
      { status: 500 }
    )
  }
}

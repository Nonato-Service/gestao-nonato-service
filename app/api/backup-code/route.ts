import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDemoContext } from '../data/demo-context'
import { getProjectRoot } from './project-root'
import { copyCodeBackupItems, hasCodeBackupMarkers, pruneOldCodeBackups } from './shared'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { isDemo } = getDemoContext(request)
    if (isDemo) {
      return NextResponse.json(
        { error: 'Backup do código desativado no modo demonstração.' },
        { status: 403 }
      )
    }
    const projectRoot = path.resolve(getProjectRoot())
    const backupsBase = path.join(projectRoot, 'backups')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(backupsBase, `code-backup-${timestamp}`)

    try {
      const diagnosticPath = path.join(projectRoot, 'backups', 'ONDE-GUARDAMOS-BACKUPS.txt')
      if (!fs.existsSync(path.dirname(diagnosticPath))) {
        fs.mkdirSync(path.dirname(diagnosticPath), { recursive: true })
      }
      fs.writeFileSync(
        diagnosticPath,
        'Pasta onde os backups do código são guardados:\n' +
          path.resolve(backupsBase) +
          '\n\nRaiz do projeto detectada: ' +
          projectRoot +
          '\nRaiz válida (app + package.json): ' +
          (hasCodeBackupMarkers(projectRoot) ? 'sim' : 'NÃO') +
          '\nData: ' +
          new Date().toISOString(),
        'utf-8'
      )
    } catch {
      /* ignorar */
    }

    if (!fs.existsSync(backupsBase)) {
      fs.mkdirSync(backupsBase, { recursive: true })
    }
    fs.mkdirSync(backupDir, { recursive: true })

    const { backedUpFiles, backedUpItems } = copyCodeBackupItems(projectRoot, backupDir)

    if (backedUpFiles.length === 0) {
      try {
        fs.rmSync(backupDir, { recursive: true, force: true })
      } catch {
        /* ignorar */
      }
      return NextResponse.json(
        {
          error:
            'Nenhum ficheiro foi copiado. Verifique se a pasta app/ existe na raiz: ' +
            projectRoot +
            ' — Execute npm run dev na pasta do projeto.',
        },
        { status: 500 }
      )
    }

    const infoContent = `BACKUP DO CÓDIGO FONTE
=======================
Data/Hora: ${new Date().toLocaleString('pt-BR')}
Itens incluídos: ${backedUpItems.join(', ')}
Total de ficheiros: ${backedUpFiles.length}

Para restaurar:
1. No Administrador → Backup → «Restaurar» nesta pasta, OU
2. Descarregue ZIP / use «Restaurar de ZIP»
3. Execute npm install se package.json mudou
4. Execute npm run dev
`
    fs.writeFileSync(path.join(backupDir, 'INFO-BACKUP.txt'), infoContent, 'utf-8')

    const metadata = {
      timestamp: new Date().toISOString(),
      backupPath: backupDir,
      filesCount: backedUpFiles.length,
      items: backedUpItems,
      files: backedUpFiles.map((f) => path.relative(projectRoot, f)),
    }
    fs.writeFileSync(path.join(backupDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8')

    pruneOldCodeBackups(backupsBase, 5)

    return NextResponse.json({
      success: true,
      message: 'Backup criado com sucesso!',
      backupPath: backupDir,
      backupsFolder: backupsBase,
      backupsFolderAbsolute: path.resolve(backupsBase),
      filesCount: backedUpFiles.length,
      items: backedUpItems,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Erro ao criar backup:', error)
    return NextResponse.json({ error: 'Erro ao criar backup: ' + message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const projectRoot = path.resolve(getProjectRoot())
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


import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDemoContext } from '../data/demo-context'
import { getProjectRoot } from './project-root'
import { copyCodeBackupItems, hasCodeBackupMarkers, pruneOldCodeBackups } from './shared'
import {
  ensureBackupLayout,
  formatBackupStamp,
  getCodigoBackupsDir,
  listCodeBackupFolderNames,
  MAX_CODE_FOLDER_BACKUPS,
  MAX_CODIGO_ZIP_ON_DISK,
  pruneFilesInDir,
} from './backup-paths'
import { writeCodeZipToFile } from './zip-code'

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
    const { root: backupsBase, codigoDir } = ensureBackupLayout(projectRoot)
    const stamp = formatBackupStamp()
    const backupDir = path.join(codigoDir, `code-backup-${stamp}`)

    try {
      const diagnosticPath = path.join(backupsBase, 'ONDE-GUARDAMOS-BACKUPS.txt')
      if (!fs.existsSync(path.dirname(diagnosticPath))) {
        fs.mkdirSync(path.dirname(diagnosticPath), { recursive: true })
      }
      fs.writeFileSync(
        diagnosticPath,
        'PASTAS DE BACKUP DO PROJETO\n' +
          '==========================\n\n' +
          'JSON (dados):  ' +
          path.resolve(path.join(backupsBase, 'json')) +
          '\n' +
          'Código (ZIP):  ' +
          path.resolve(codigoDir) +
          '\n\n' +
          'Raiz do projeto: ' +
          projectRoot +
          '\n' +
          'Raiz válida: ' +
          (hasCodeBackupMarkers(projectRoot) ? 'sim' : 'NÃO') +
          '\n' +
          'Data: ' +
          new Date().toISOString(),
        'utf-8'
      )
    } catch {
      /* ignorar */
    }

    if (!fs.existsSync(codigoDir)) {
      fs.mkdirSync(codigoDir, { recursive: true })
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

    let zipFileName = ''
    let zipPath = ''
    try {
      zipFileName = `backup-codigo-${stamp}.zip`
      zipPath = path.join(codigoDir, zipFileName)
      await writeCodeZipToFile(projectRoot, zipPath)
      pruneFilesInDir(
        codigoDir,
        (name) => name.startsWith('backup-codigo-') && name.endsWith('.zip'),
        MAX_CODIGO_ZIP_ON_DISK
      )
    } catch (zipErr) {
      console.error('[backup-code] ZIP automático falhou:', zipErr)
    }

    pruneOldCodeBackups(codigoDir, MAX_CODE_FOLDER_BACKUPS)

    return NextResponse.json({
      success: true,
      message: 'Backup criado com sucesso!',
      backupPath: backupDir,
      backupsFolder: backupsBase,
      backupsFolderAbsolute: path.resolve(backupsBase),
      codigoFolder: path.resolve(codigoDir),
      jsonFolder: path.resolve(path.join(backupsBase, 'json')),
      zipPath: zipPath || undefined,
      zipFileName: zipFileName || undefined,
      filesCount: backedUpFiles.length,
      items: backedUpItems,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Erro ao criar backup:', error)
    return NextResponse.json({ error: 'Erro ao criar backup: ' + message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const projectRoot = path.resolve(getProjectRoot())
    const folders = listCodeBackupFolderNames(projectRoot)
    const backups = folders.map((backupPath) => {
      const stat = fs.statSync(backupPath)
      const metadataPath = path.join(backupPath, 'metadata.json')
      let metadata = null
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
        metadata,
      }
    })
    return NextResponse.json({ backups })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Erro ao listar backups: ' + message }, { status: 500 })
  }
}


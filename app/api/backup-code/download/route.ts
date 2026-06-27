import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { PassThrough } from 'stream'
import archiver from 'archiver'
import { getDemoContext } from '../../data/demo-context'
import { getProjectRoot } from '../project-root'
import { CODE_BACKUP_ITEMS } from '../shared'

export const runtime = 'nodejs'

function nodeStreamToWebReadableStream(pass: PassThrough): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      pass.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)))
      pass.on('end', () => controller.close())
      pass.on('error', (err) => controller.error(err))
    },
  })
}

const IGNORE_IN_ZIP = ['**/node_modules/**', '**/.next/**', '**/backups/**', '**/.git/**']

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
    const pass = new PassThrough()
    const archive = archiver('zip', { zlib: { level: 6 } })
    let filesAdded = 0

    archive.on('error', (err: Error) => {
      console.error('[backup-code/download] Erro no ZIP:', err)
      pass.destroy(err)
    })

    archive.pipe(pass)

    for (const item of CODE_BACKUP_ITEMS) {
      const fullPath = path.join(projectRoot, item)
      if (!fs.existsSync(fullPath)) continue
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        archive.glob('**/*', { cwd: fullPath, dot: true, ignore: IGNORE_IN_ZIP }, { prefix: item })
        filesAdded++
      } else {
        archive.file(fullPath, { name: item })
        filesAdded++
      }
    }

    if (filesAdded === 0) {
      return NextResponse.json(
        { error: 'Nenhum ficheiro encontrado para ZIP. Raiz do projeto: ' + projectRoot },
        { status: 500 }
      )
    }

    const info = `Backup do código - ${new Date().toISOString()}
Projeto: gestao-tecnica-nonato-service
Conteúdo: app/, public/, middleware.ts, configs, scripts/
Para restaurar: use «Restaurar de ZIP» no Administrador ou extraia na pasta do projeto e execute npm install.`
    archive.append(info, { name: 'LEIA-ME-BACKUP.txt' })

    void archive.finalize()

    const filename = `backup-codigo-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`
    return new NextResponse(nodeStreamToWebReadableStream(pass), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[backup-code/download]', error)
    return NextResponse.json({ error: 'Erro ao criar ZIP: ' + message }, { status: 500 })
  }
}

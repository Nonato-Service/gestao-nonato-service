import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { CODE_BACKUP_ITEMS } from './shared'

const IGNORE_IN_ZIP = ['**/node_modules/**', '**/.next/**', '**/backups/**', '**/.git/**']

export function writeCodeZipToFile(projectRoot: string, destZipPath: string): Promise<{ filesAdded: number }> {
  return new Promise((resolve, reject) => {
    const resolvedRoot = path.resolve(projectRoot)
    fs.mkdirSync(path.dirname(destZipPath), { recursive: true })
    const output = fs.createWriteStream(destZipPath)
    const archive = archiver('zip', { zlib: { level: 6 } })
    let filesAdded = 0

    output.on('close', () => resolve({ filesAdded }))
    output.on('error', reject)
    archive.on('error', reject)
    archive.pipe(output)

    archive.on('entry', () => {
      filesAdded++
    })

    let itemsQueued = 0
    for (const item of CODE_BACKUP_ITEMS) {
      const fullPath = path.join(resolvedRoot, item)
      if (!fs.existsSync(fullPath)) continue
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        archive.glob('**/*', { cwd: fullPath, dot: true, ignore: IGNORE_IN_ZIP }, { prefix: item })
      } else {
        archive.file(fullPath, { name: item })
      }
      itemsQueued++
    }

    if (itemsQueued === 0) {
      archive.destroy()
      output.destroy()
      reject(new Error('Nenhum ficheiro encontrado para ZIP'))
      return
    }

    const info = `Backup do código - ${new Date().toISOString()}
Projeto: gestao-tecnica-nonato-service
Para restaurar: Administrador → Restaurar de ZIP`
    archive.append(info, { name: 'LEIA-ME-BACKUP.txt' })
    void archive.finalize()
  })
}

import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { DATA_DIR } from '../data/shared'
import { formatBackupStamp } from '../backup-code/backup-paths'

const SKIP_DATA_DIRS = new Set(['_pre-restore', '_pre-merge', '_pre-placeholder'])

function shouldIncludeDataFile(name: string): boolean {
  if (!name.endsWith('.json')) return false
  if (!name.startsWith('nonato-')) return false
  return true
}

/** Cria ZIP com todos os ficheiros nonato-*.json da pasta data/ + envelope JSON opcional. */
export function writeDataZipToFile(opts: {
  destZipPath: string
  envelopeJson?: unknown
  envelopeFileName?: string
}): Promise<{ filesAdded: number; totalBytes: number }> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(opts.destZipPath), { recursive: true })
    const output = fs.createWriteStream(opts.destZipPath)
    const archive = archiver('zip', { zlib: { level: 6 } })
    let filesAdded = 0
    let totalBytes = 0

    output.on('close', () => resolve({ filesAdded, totalBytes }))
    output.on('error', reject)
    archive.on('error', reject)
    archive.pipe(output)

    if (fs.existsSync(DATA_DIR)) {
      for (const entry of fs.readdirSync(DATA_DIR, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          if (entry.name.startsWith('_') || SKIP_DATA_DIRS.has(entry.name)) continue
          continue
        }
        if (!shouldIncludeDataFile(entry.name)) continue
        const full = path.join(DATA_DIR, entry.name)
        try {
          const stat = fs.statSync(full)
          archive.file(full, { name: `data/${entry.name}` })
          filesAdded++
          totalBytes += stat.size
        } catch {
          /* ignorar ficheiro inacessível */
        }
      }
    }

    if (opts.envelopeJson) {
      const name = opts.envelopeFileName || `backup-dados-${formatBackupStamp()}.json`
      const jsonStr = JSON.stringify(opts.envelopeJson, null, 2)
      archive.append(jsonStr, { name })
      filesAdded++
      totalBytes += Buffer.byteLength(jsonStr, 'utf-8')
    }

    const info = `BACKUP COMPLETO DE DADOS — GESTÃO TÉCNICA NONATO
================================================
Data: ${new Date().toISOString()}

Conteúdo:
  data/     → ficheiros do servidor (nonato-*.json)
  backup-dados-*.json → cópia completa do browser + servidor

Para restaurar:
  1. Administrador → Backup → Importar ficheiro JSON
  2. Ou use scripts/restaurar-dados-backup.mjs

NÃO apague este ZIP — guarde em pen USB ou nuvem.
`
    archive.append(info, { name: 'LEIA-ME-BACKUP-DADOS.txt' })
    filesAdded++

    if (filesAdded <= 1) {
      archive.destroy()
      output.destroy()
      reject(new Error('Nenhum dado encontrado para ZIP — verifique a pasta data/ ou crie um backup JSON primeiro.'))
      return
    }

    void archive.finalize()
  })
}

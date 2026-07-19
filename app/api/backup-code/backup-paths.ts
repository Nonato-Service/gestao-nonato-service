import fs from 'fs'
import path from 'path'
import { DATA_DIR } from '../data/shared'

export const MAX_JSON_BACKUPS_ON_DISK = 30
export const MAX_CODIGO_ZIP_ON_DISK = 15
export const MAX_CODE_FOLDER_BACKUPS = 5

export function getBackupsRoot(projectRoot: string): string {
  return path.join(path.resolve(projectRoot), 'backups')
}

export function getJsonBackupsDir(projectRoot: string): string {
  return path.join(getBackupsRoot(projectRoot), 'json')
}

/** Backups JSON no volume persistente (Railway) — sobrevivem a redeploys. */
export function getPersistentJsonBackupsDir(projectRoot: string): string {
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR) {
    return path.join(DATA_DIR, 'backups', 'json')
  }
  return getJsonBackupsDir(projectRoot)
}

export function getCodigoBackupsDir(projectRoot: string): string {
  return path.join(getBackupsRoot(projectRoot), 'codigo')
}

/** Ex.: 2026-06-26_18-45-30 */
export function formatBackupStamp(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_')
}

export function ensureBackupLayout(projectRoot: string): {
  root: string
  jsonDir: string
  codigoDir: string
} {
  const root = getBackupsRoot(projectRoot)
  const jsonDir = getPersistentJsonBackupsDir(projectRoot)
  const codigoDir = getCodigoBackupsDir(projectRoot)
  for (const dir of [root, jsonDir, codigoDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }
  migrateLegacyCodeBackups(projectRoot)
  writeBackupsReadme(root, jsonDir, codigoDir)
  return { root, jsonDir, codigoDir }
}

/** Move pastas code-backup-* da raiz de backups/ para backups/codigo/ (uma vez). */
export function migrateLegacyCodeBackups(projectRoot: string): { moved: string[]; skipped: string[] } {
  const root = getBackupsRoot(projectRoot)
  const codigoDir = getCodigoBackupsDir(projectRoot)
  const moved: string[] = []
  const skipped: string[] = []
  if (!fs.existsSync(root) || !fs.existsSync(codigoDir)) return { moved, skipped }

  for (const item of fs.readdirSync(root)) {
    if (!item.startsWith('code-backup-')) continue
    const src = path.join(root, item)
    try {
      if (!fs.statSync(src).isDirectory()) continue
    } catch {
      continue
    }
    const dest = path.join(codigoDir, item)
    if (fs.existsSync(dest)) {
      skipped.push(item)
      continue
    }
    try {
      fs.renameSync(src, dest)
      moved.push(item)
    } catch {
      skipped.push(item)
    }
  }
  return { moved, skipped }
}

function writeBackupsReadme(root: string, jsonDir: string, codigoDir: string): void {
  const readme = path.join(root, 'LEIA-ME.txt')
  const content = `PASTAS DE BACKUP — GESTÃO TÉCNICA NONATO
========================================

Estas pastas ficam DENTRO do projeto (gestao-tecnica-nonato-service).

  ${path.basename(jsonDir)}/     → dados do sistema (clientes, relatórios, peças…)
       Ficheiros: backup-dados-AAAA-MM-DD_HH-mm-ss.json

  ${path.basename(codigoDir)}/   → código-fonte (app, configs)
       Ficheiros ZIP: backup-codigo-AAAA-MM-DD_HH-mm-ss.zip
       Pastas: code-backup-* (cópia completa para restauro rápido)

COMO CRIAR
----------
  Administrador → Backup e segurança
  • «Criar JSON agora»  → guarda em json/
  • «Criar backup no servidor» + «Descarregar ZIP» → guarda em codigo/

COPIE ESTA PASTA «backups» PARA PEN USB DE VEZ EM QUANDO.

Caminhos completos:
  JSON:   ${jsonDir}
  Código: ${codigoDir}
  Data:   ${new Date().toISOString()}
`
  try {
    fs.writeFileSync(readme, content, 'utf-8')
  } catch {
    /* ignorar */
  }
}

export function pruneFilesInDir(
  dir: string,
  filter: (name: string) => boolean,
  keep: number
): void {
  if (!fs.existsSync(dir)) return
  try {
    const entries = fs
      .readdirSync(dir)
      .filter(filter)
      .map((name) => ({
        name,
        fullPath: path.join(dir, name),
        mtime: fs.statSync(path.join(dir, name)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime)
    entries.slice(keep).forEach(({ fullPath }) => {
      try {
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) fs.rmSync(fullPath, { recursive: true, force: true })
        else fs.unlinkSync(fullPath)
      } catch {
        /* ignorar */
      }
    })
  } catch {
    /* ignorar */
  }
}

/** Lista pastas code-backup-* em codigo/ e em backups/ (legado). */
export function listCodeBackupFolderNames(projectRoot: string): string[] {
  const root = getBackupsRoot(projectRoot)
  const codigoDir = getCodigoBackupsDir(projectRoot)
  const names = new Set<string>()
  for (const dir of [codigoDir, root]) {
    if (!fs.existsSync(dir)) continue
    for (const item of fs.readdirSync(dir)) {
      if (item.startsWith('code-backup-')) {
        const full = path.join(dir, item)
        try {
          if (fs.statSync(full).isDirectory()) names.add(full)
        } catch {
          /* ignorar */
        }
      }
    }
  }
  return [...names].sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime())
}

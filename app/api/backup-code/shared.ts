import fs from 'fs'
import path from 'path'

/** Itens do projeto incluídos em backup/restauro de código. */
export const CODE_BACKUP_ITEMS = [
  'app',
  'public',
  'middleware.ts',
  'next.config.js',
  'next.config.mjs',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next-env.d.ts',
  '.gitignore',
  'README.md',
  'tailwind.config.js',
  'tailwind.config.ts',
  'postcss.config.js',
  'scripts',
] as const

const SKIP_DIR_NAMES = new Set(['node_modules', '.next', 'backups', '.git'])

export function hasCodeBackupMarkers(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'package.json')) && fs.existsSync(path.join(dir, 'app'))
}

/** ZIP extraído pode ter app/ na raiz ou dentro de uma subpasta (ex.: gestao-tecnica-nonato-service/). */
export function resolveBackupContentRoot(extractedDir: string): string {
  if (hasCodeBackupMarkers(extractedDir)) return extractedDir

  let queue = [extractedDir]
  const seen = new Set<string>()
  for (let depth = 0; depth < 4 && queue.length > 0; depth++) {
    const next: string[] = []
    for (const dir of queue) {
      const resolved = path.resolve(dir)
      if (seen.has(resolved)) continue
      seen.add(resolved)
      if (hasCodeBackupMarkers(resolved)) return resolved
      try {
        for (const ent of fs.readdirSync(resolved, { withFileTypes: true })) {
          if (ent.isDirectory() && !SKIP_DIR_NAMES.has(ent.name)) {
            next.push(path.join(resolved, ent.name))
          }
        }
      } catch {
        /* ignorar */
      }
    }
    queue = next
  }
  return extractedDir
}

export function isBackupPathSafe(backupPath: string, backupsDir: string): boolean {
  const resolvedBackup = path.resolve(backupPath)
  const resolvedBackups = path.resolve(backupsDir)
  const rel = path.relative(resolvedBackups, resolvedBackup)
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    return false
  }
  return fs.existsSync(resolvedBackup) && fs.statSync(resolvedBackup).isDirectory()
}

function copyRecursive(src: string, dest: string, restoredFiles: string[]): void {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }
    for (const file of fs.readdirSync(src)) {
      if (SKIP_DIR_NAMES.has(file)) continue
      copyRecursive(path.join(src, file), path.join(dest, file), restoredFiles)
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
    restoredFiles.push(dest)
  }
}

/** Restaura código substituindo pastas por completo (igual ao ZIP). */
export function restoreCodeFromSource(
  sourceRoot: string,
  projectRoot: string
): { restoredFiles: string[]; restoredItems: string[] } {
  const resolvedSource = path.resolve(sourceRoot)
  const resolvedProject = path.resolve(projectRoot)
  const restoredFiles: string[] = []
  const restoredItems: string[] = []

  for (const item of CODE_BACKUP_ITEMS) {
    const sourcePath = path.join(resolvedSource, item)
    const destPath = path.join(resolvedProject, item)
    if (!fs.existsSync(sourcePath)) continue

    try {
      const stat = fs.statSync(sourcePath)
      if (stat.isDirectory()) {
        if (fs.existsSync(destPath)) {
          fs.rmSync(destPath, { recursive: true, force: true })
        }
        copyRecursive(sourcePath, destPath, restoredFiles)
      } else {
        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        fs.copyFileSync(sourcePath, destPath)
        restoredFiles.push(destPath)
      }
      restoredItems.push(item)
    } catch (err) {
      console.error(`[backup-code] Erro ao restaurar ${item}:`, err)
      throw err
    }
  }

  return { restoredFiles, restoredItems }
}

export function copyCodeBackupItems(
  projectRoot: string,
  backupDir: string
): { backedUpFiles: string[]; backedUpItems: string[] } {
  const resolvedProject = path.resolve(projectRoot)
  const resolvedBackup = path.resolve(backupDir)
  const backedUpFiles: string[] = []
  const backedUpItems: string[] = []

  const copyRecursiveBackup = (src: string, dest: string) => {
    const stat = fs.statSync(src)
    if (stat.isDirectory()) {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
      for (const file of fs.readdirSync(src)) {
        if (SKIP_DIR_NAMES.has(file)) continue
        copyRecursiveBackup(path.join(src, file), path.join(dest, file))
      }
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(src, dest)
      backedUpFiles.push(src)
    }
  }

  for (const item of CODE_BACKUP_ITEMS) {
    const sourcePath = path.join(resolvedProject, item)
    const destPath = path.join(resolvedBackup, item)
    if (!fs.existsSync(sourcePath)) continue
    try {
      copyRecursiveBackup(sourcePath, destPath)
      backedUpItems.push(item)
    } catch (error) {
      console.error(`[backup-code] Erro ao copiar ${item}:`, error)
    }
  }

  return { backedUpFiles, backedUpItems }
}

export function pruneOldCodeBackups(backupsBase: string, keep = 5): void {
  try {
    const entries = fs
      .readdirSync(backupsBase)
      .filter((item) => item.startsWith('code-backup-'))
      .map((item) => ({
        fullPath: path.join(backupsBase, item),
        mtime: fs.statSync(path.join(backupsBase, item)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime)
    entries.slice(keep).forEach(({ fullPath }) => {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true })
      } catch {
        /* ignorar */
      }
    })
  } catch {
    /* ignorar */
  }
}

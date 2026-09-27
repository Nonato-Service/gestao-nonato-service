/**
 * Liberta espaço em DATA_DIR: órfãos *.tmp*, *.bak* e pares .txt+.json redundantes.
 * Usado no boot, nos saves e em /api/health + /api/data/disk-cleanup.
 */
import fs from 'fs'
import path from 'path'
import { DATA_DIR } from './shared'

/** SoT em `.json` — o `.txt` gémeo só ocupa espaço e pode confundir o load. */
export const JSON_SOT_DROP_TXT_KEYS = [
  'nonato-pecas-stock',
  'nonato-categorias-pecas-stock',
  'nonato-subcategorias-pecas-stock',
  'nonato-pecas-biblioteca',
  'nonato-pecas-biblioteca-lite',
] as const

export type DiskCleanupResult = {
  deleted: string[]
  freedApproxBytes: number
  dirs: string[]
}

export type LargestFileInfo = {
  name: string
  bytes: number
  mb: number
}

export function isEnospcError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; message?: string }
  if (e.code === 'ENOSPC') return true
  const msg = String(e.message || '')
  return /ENOSPC|no space left on device/i.test(msg)
}

/** Mensagem estável para a API / toast (cliente pode traduzir via code). */
export function diskFullApiPayload(err?: unknown): {
  error: string
  code: 'disk_full'
  details?: string
} {
  const details =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message?: string }).message || '')
      : undefined
  return {
    code: 'disk_full',
    error:
      'Disco do servidor cheio. Liberte espaço no volume Railway (/data) ou aumente o tamanho do volume. Depois sincronize o stock de novo.',
    ...(details ? { details } : {}),
  }
}

function safeUnlink(filePath: string): number {
  try {
    const size = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
    fs.unlinkSync(filePath)
    return size
  } catch {
    return 0
  }
}

function listDirsToClean(root: string): string[] {
  const out = [root]
  try {
    for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue
      // demo / subpastas de sessão
      out.push(path.join(root, ent.name))
    }
  } catch {
    /* ignorar */
  }
  return out
}

/** Apaga ficheiros temporários órfãos (crash a meio do write atómico). */
export function cleanupOrphanTmpFiles(dir: string): DiskCleanupResult {
  const deleted: string[] = []
  let freedApproxBytes = 0
  try {
    if (!fs.existsSync(dir)) return { deleted, freedApproxBytes, dirs: [dir] }
    for (const name of fs.readdirSync(dir)) {
      // nonato-x.json.tmp-8-123  |  nonato-x.txt.tmp-...
      if (!/\.tmp(-|$)/i.test(name) && !name.includes('.tmp-')) continue
      const full = path.join(dir, name)
      try {
        if (!fs.statSync(full).isFile()) continue
      } catch {
        continue
      }
      const n = safeUnlink(full)
      if (n >= 0) {
        deleted.push(name)
        freedApproxBytes += n
      }
    }
  } catch {
    /* ignorar */
  }
  return { deleted, freedApproxBytes, dirs: [dir] }
}

/** Apaga `.bak` de gravações anteriores (já não são necessários após rename OK). */
export function cleanupBakFiles(dir: string): DiskCleanupResult {
  const deleted: string[] = []
  let freedApproxBytes = 0
  try {
    if (!fs.existsSync(dir)) return { deleted, freedApproxBytes, dirs: [dir] }
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.bak')) continue
      const full = path.join(dir, name)
      try {
        if (!fs.statSync(full).isFile()) continue
      } catch {
        continue
      }
      const n = safeUnlink(full)
      deleted.push(name)
      freedApproxBytes += n
    }
  } catch {
    /* ignorar */
  }
  return { deleted, freedApproxBytes, dirs: [dir] }
}

/**
 * Se existir `.json` da chave, apaga o `.txt` gémeo (stock / biblioteca Homag).
 * Não toca em logos/manuais cujo SoT é `.txt`.
 */
export function dropRedundantTxtForJsonSot(dir: string): DiskCleanupResult {
  const deleted: string[] = []
  let freedApproxBytes = 0
  for (const key of JSON_SOT_DROP_TXT_KEYS) {
    const jsonPath = path.join(dir, `${key}.json`)
    const txtPath = path.join(dir, `${key}.txt`)
    try {
      if (!fs.existsSync(jsonPath) || !fs.existsSync(txtPath)) continue
      const jsonSize = fs.statSync(jsonPath).size
      if (jsonSize < 2) continue
      const n = safeUnlink(txtPath)
      deleted.push(`${key}.txt`)
      freedApproxBytes += n
    } catch {
      /* ignorar */
    }
  }
  return { deleted, freedApproxBytes, dirs: [dir] }
}

/** Cleanup completo numa pasta (tmp + bak + txt redundante). */
export function cleanupDirSpace(dir: string): DiskCleanupResult {
  const a = cleanupOrphanTmpFiles(dir)
  const b = cleanupBakFiles(dir)
  const c = dropRedundantTxtForJsonSot(dir)
  return {
    deleted: [...a.deleted, ...b.deleted, ...c.deleted],
    freedApproxBytes: a.freedApproxBytes + b.freedApproxBytes + c.freedApproxBytes,
    dirs: [dir],
  }
}

/** Cleanup em DATA_DIR + subpastas (ex.: demo). */
export function cleanupDataVolume(rootDir: string = DATA_DIR): DiskCleanupResult {
  const deleted: string[] = []
  let freedApproxBytes = 0
  const dirs = listDirsToClean(rootDir)
  for (const d of dirs) {
    const r = cleanupDirSpace(d)
    deleted.push(...r.deleted.map((n) => (d === rootDir ? n : `${path.basename(d)}/${n}`)))
    freedApproxBytes += r.freedApproxBytes
  }
  return { deleted, freedApproxBytes, dirs }
}

export function listLargestDataFiles(dir: string = DATA_DIR, limit = 15): LargestFileInfo[] {
  const rows: LargestFileInfo[] = []
  try {
    if (!fs.existsSync(dir)) return rows
    const walk = (base: string, prefix: string) => {
      for (const name of fs.readdirSync(base)) {
        const full = path.join(base, name)
        let st: fs.Stats
        try {
          st = fs.statSync(full)
        } catch {
          continue
        }
        if (st.isDirectory()) {
          if (prefix === '') walk(full, `${name}/`)
          continue
        }
        if (!st.isFile()) continue
        rows.push({
          name: `${prefix}${name}`,
          bytes: st.size,
          mb: Math.round((st.size / (1024 * 1024)) * 10) / 10,
        })
      }
    }
    walk(dir, '')
    rows.sort((a, b) => b.bytes - a.bytes)
    return rows.slice(0, Math.max(1, limit))
  } catch {
    return rows
  }
}

/** Bytes livres no filesystem do volume (Node 18.15+ / Linux Railway). */
export function getDiskFreeBytes(dir: string = DATA_DIR): number | null {
  try {
    const statfs = (fs as typeof fs & { statfsSync?: (p: string) => { bavail: number | bigint; bsize: number | bigint } })
      .statfsSync
    if (typeof statfs !== 'function') return null
    const s = statfs(dir)
    const bavail = Number(s.bavail)
    const bsize = Number(s.bsize)
    if (!Number.isFinite(bavail) || !Number.isFinite(bsize)) return null
    return bavail * bsize
  } catch {
    return null
  }
}

export function dropCompanionTxtAfterJsonSave(targetDir: string, key: string): void {
  if (!(JSON_SOT_DROP_TXT_KEYS as readonly string[]).includes(key)) {
    // Também logos gravados em JSON (legado)
    if (
      key !== 'nonato-logo' &&
      key !== 'nonato-logo-dashboard'
    ) {
      return
    }
  }
  try {
    const txtPath = path.join(targetDir, `${key}.txt`)
    if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath)
  } catch {
    /* ignorar */
  }
}

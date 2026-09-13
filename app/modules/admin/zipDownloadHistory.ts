/** Histórico de downloads ZIP no Administrador — tipo e helpers puros, sem I/O. */

export const MAX_BACKUP_HISTORY = 5

export const ZIP_DOWNLOAD_HISTORY_KEY = 'nonato-zip-download-history'

export type ZipDownloadHistoryEntry = {
  timestamp: number
  fileName: string
  sizeBytes?: number
}

export function formatBackupBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function normalizeZipDownloadHistory(parsed: unknown): ZipDownloadHistoryEntry[] {
  if (!Array.isArray(parsed)) return []
  return parsed
    .filter((e): e is ZipDownloadHistoryEntry => Boolean(e && typeof (e as ZipDownloadHistoryEntry).timestamp === 'number'))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_BACKUP_HISTORY)
}

export function prependZipDownloadHistory(
  list: ZipDownloadHistoryEntry[],
  item: ZipDownloadHistoryEntry
): ZipDownloadHistoryEntry[] {
  return [item, ...list.filter((e) => e.timestamp !== item.timestamp)].slice(0, MAX_BACKUP_HISTORY)
}

/** Monta o item do histórico. Relógio injectado (`nowMs`) se não vier timestamp. */
export function buildZipDownloadHistoryEntry(
  entry: Omit<ZipDownloadHistoryEntry, 'timestamp'> & { timestamp?: number },
  nowMs: number
): ZipDownloadHistoryEntry {
  return {
    timestamp: entry.timestamp ?? nowMs,
    fileName: entry.fileName,
    sizeBytes: entry.sizeBytes,
  }
}

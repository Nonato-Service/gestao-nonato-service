export const MAX_BACKUP_HISTORY = 5

export const ZIP_DOWNLOAD_HISTORY_KEY = 'nonato-zip-download-history'

export type ZipDownloadHistoryEntry = {
  timestamp: number
  fileName: string
  sizeBytes?: number
}

export function getZipDownloadHistory(): ZipDownloadHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ZIP_DOWNLOAD_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((e) => e && typeof e.timestamp === 'number')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_BACKUP_HISTORY)
  } catch {
    return []
  }
}

export function pushZipDownloadHistory(entry: Omit<ZipDownloadHistoryEntry, 'timestamp'> & { timestamp?: number }): void {
  if (typeof window === 'undefined') return
  const item: ZipDownloadHistoryEntry = {
    timestamp: entry.timestamp ?? Date.now(),
    fileName: entry.fileName,
    sizeBytes: entry.sizeBytes,
  }
  const next = [item, ...getZipDownloadHistory().filter((e) => e.timestamp !== item.timestamp)].slice(0, MAX_BACKUP_HISTORY)
  try {
    localStorage.setItem(ZIP_DOWNLOAD_HISTORY_KEY, JSON.stringify(next))
  } catch {
    /* ignorar quota */
  }
}

export function formatBackupBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

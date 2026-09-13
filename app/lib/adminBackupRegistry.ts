/** I/O do histórico ZIP — tipo e helpers puros em `app/modules/admin/zipDownloadHistory`. */

import {
  ZIP_DOWNLOAD_HISTORY_KEY,
  normalizeZipDownloadHistory,
  prependZipDownloadHistory,
  buildZipDownloadHistoryEntry,
  type ZipDownloadHistoryEntry,
} from '../modules/admin/zipDownloadHistory'

export {
  MAX_BACKUP_HISTORY,
  ZIP_DOWNLOAD_HISTORY_KEY,
  formatBackupBytes,
} from '../modules/admin/zipDownloadHistory'
export type { ZipDownloadHistoryEntry } from '../modules/admin/zipDownloadHistory'

export function getZipDownloadHistory(): ZipDownloadHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ZIP_DOWNLOAD_HISTORY_KEY)
    if (!raw) return []
    return normalizeZipDownloadHistory(JSON.parse(raw))
  } catch {
    return []
  }
}

export function pushZipDownloadHistory(
  entry: Omit<ZipDownloadHistoryEntry, 'timestamp'> & { timestamp?: number }
): void {
  if (typeof window === 'undefined') return
  const item = buildZipDownloadHistoryEntry(entry, Date.now())
  const next = prependZipDownloadHistory(getZipDownloadHistory(), item)
  try {
    localStorage.setItem(ZIP_DOWNLOAD_HISTORY_KEY, JSON.stringify(next))
  } catch {
    /* ignorar quota */
  }
}

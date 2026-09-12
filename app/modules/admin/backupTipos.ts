/** Tipos de backup no Administrador (código / automático) — sem I/O. */

export type CodeBackup = { path: string; timestamp: string; filesCount: number }
export type AutoBackup = { timestamp: number; data?: { date?: string } }

export function findBackupByTimestamp(
  list: AutoBackup[],
  id: number | string
): AutoBackup | undefined {
  return list.find((b) => b.timestamp === id)
}

export function formatCodeBackupFilesLabel(
  template: string,
  filesCount: number | string | undefined,
  emptyFallback = '—'
): string {
  return template.replace('{count}', String(filesCount || emptyFallback))
}

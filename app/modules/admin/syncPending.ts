/** Revisão remota pendente no Centro de Sincronização — tipo e display, sem I/O. */

export type SyncPendingRemote = {
  revision: number
  updatedAt?: string
  summaryLines: string[]
}

export function isSyncPendingRemote(
  pending: SyncPendingRemote | null | undefined
): pending is SyncPendingRemote {
  return Boolean(pending)
}

export function syncPendingRevisionValue(pending: SyncPendingRemote | null | undefined): number {
  return pending?.revision ?? 0
}

export function syncPendingRevisionDisplay(
  pending: SyncPendingRemote | null | undefined,
  emptyFallback = '—'
): string {
  const revision = syncPendingRevisionValue(pending)
  return revision > 0 ? String(revision) : emptyFallback
}

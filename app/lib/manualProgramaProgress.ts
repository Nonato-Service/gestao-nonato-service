const LS_KEY = 'nonato-manual-visited-v1'

export function loadManualVisitedPages(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id) => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

export function saveManualVisitedPage(pageId: string): Set<string> {
  const next = loadManualVisitedPages()
  next.add(pageId)
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...next]))
  } catch {
    /* quota */
  }
  return next
}

export function manualExploredPercent(visitedCount: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((visitedCount / total) * 100))
}

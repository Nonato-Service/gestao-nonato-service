/**
 * Sincronização multi-dispositivo: revisão do servidor vs. última aceite neste aparelho.
 * Evita substituir dados locais pelos do servidor sem confirmação quando ambos divergem.
 */

import { isNonatoDemoBuild } from './nonatoDemoMode'

const LS_LAST_ACCEPTED = 'nonato-sync-last-accepted-revision'

const SKIP_LOCAL_SCAN_KEYS = new Set([
  LS_LAST_ACCEPTED,
  'nonato-language',
  'nonato-last-code-backup-date',
  'nonato-protocolo-servico-draft',
  'nonato-sync-queue',
  'nonato-auto-backups',
  'nonato-code-backups'
])

export function getLastAcceptedRevision(): number {
  if (typeof window === 'undefined') return 0
  try {
    const v = localStorage.getItem(LS_LAST_ACCEPTED)
    const n = v ? parseInt(v, 10) : 0
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function setLastAcceptedRevision(rev: number): void {
  if (typeof window === 'undefined') return
  try {
    if (Number.isFinite(rev) && rev >= 0) {
      localStorage.setItem(LS_LAST_ACCEPTED, String(Math.floor(rev)))
    }
  } catch {
    /* ignorar */
  }
}

export async function fetchSyncStatus(): Promise<{ revision: number; updatedAt: string } | null> {
  if (typeof window === 'undefined') return null
  if (isNonatoDemoBuild()) return null
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 5000)
    const r = await fetch('/api/data/sync-status', { signal: ctrl.signal, cache: 'no-store' })
    clearTimeout(t)
    if (!r.ok) return null
    const j = (await r.json()) as { revision?: number; updatedAt?: string }
    if (typeof j.revision !== 'number' || j.revision < 0) return null
    return { revision: j.revision, updatedAt: typeof j.updatedAt === 'string' ? j.updatedAt : '' }
  } catch {
    return null
  }
}

/** True se este browser tem dados NONATO relevantes (evita bloquear primeiro arranque vazio). */
export function hasMeaningfulLocalData(): boolean {
  if (typeof window === 'undefined') return false
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith('nonato-') || SKIP_LOCAL_SCAN_KEYS.has(k)) continue
      const v = localStorage.getItem(k)
      if (!v || v.length < 3) continue
      try {
        const p = JSON.parse(v) as unknown
        if (Array.isArray(p) && p.length > 0) return true
        if (typeof p === 'object' && p !== null && Object.keys(p).length > 0) return true
        if (typeof p === 'string' && p.length > 20) return true
      } catch {
        if (v.length > 20) return true
      }
    }
  } catch {
    /* ignorar */
  }
  return false
}

export function applyRevisionFromSaveResponse(body: unknown): void {
  if (!body || typeof body !== 'object') return
  const r = (body as { revision?: number }).revision
  if (typeof r === 'number' && r >= 0) setLastAcceptedRevision(r)
}

/** sessionStorage — sobrevive a refresh na mesma aba, mas não quando o SO mata o processo (tablet → email). */
export const NONATO_WARM_SESSION_KEY = 'nonato-warm-session-v1'
/** localStorage — marca bootstrap concluído neste aparelho (retoma rápida após background kill). */
const NONATO_WARM_BOOTSTRAP_AT_LS = 'nonato-warm-bootstrap-at-v1'
export const NONATO_UI_SESSION_LS = 'nonato-ui-session-v1'
const WARM_BOOTSTRAP_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export type UiSessionTabSnapshot = {
  id: string
  type: string
  title: string
  icon?: string
  returnHubId?: string | null
}

export type UiSessionSnapshot = {
  openTabs: UiSessionTabSnapshot[]
  activeTabId: string | null
  dashboardWorkspaceExpanded: boolean
}

function parseUiSessionSnapshot(raw: string | null): UiSessionSnapshot | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<UiSessionSnapshot>
    if (!parsed || typeof parsed !== 'object') return null
    const openTabs = Array.isArray(parsed.openTabs)
      ? parsed.openTabs
          .filter(
            (t): t is UiSessionTabSnapshot =>
              !!t &&
              typeof t === 'object' &&
              typeof (t as UiSessionTabSnapshot).id === 'string' &&
              typeof (t as UiSessionTabSnapshot).type === 'string' &&
              typeof (t as UiSessionTabSnapshot).title === 'string'
          )
          .slice(0, 12)
      : []
    const activeTabId =
      typeof parsed.activeTabId === 'string' && openTabs.some((t) => t.id === parsed.activeTabId)
        ? parsed.activeTabId
        : openTabs.length > 0
          ? openTabs[openTabs.length - 1].id
          : null
    return {
      openTabs,
      activeTabId,
      dashboardWorkspaceExpanded: parsed.dashboardWorkspaceExpanded === true,
    }
  } catch {
    return null
  }
}

/** Retoma rápida: mesma aba (sessionStorage) ou reload após background no tablet (localStorage + dados locais). */
export function isWarmSessionResume(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (sessionStorage.getItem(NONATO_WARM_SESSION_KEY) === '1') return true
  } catch {
    /* ignorar */
  }
  try {
    const at = localStorage.getItem(NONATO_WARM_BOOTSTRAP_AT_LS)
    if (!at) return false
    const ts = Date.parse(at)
    if (!Number.isFinite(ts) || Date.now() - ts > WARM_BOOTSTRAP_MAX_AGE_MS) return false
    return hasMeaningfulLocalData()
  } catch {
    return false
  }
}

export function markWarmSessionComplete(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(NONATO_WARM_SESSION_KEY, '1')
  } catch {
    /* ignorar */
  }
  try {
    localStorage.setItem(NONATO_WARM_BOOTSTRAP_AT_LS, new Date().toISOString())
  } catch {
    /* ignorar */
  }
}

export function clearWarmSessionMarkers(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(NONATO_WARM_SESSION_KEY)
  } catch {
    /* ignorar */
  }
  try {
    localStorage.removeItem(NONATO_WARM_BOOTSTRAP_AT_LS)
    localStorage.removeItem(NONATO_UI_SESSION_LS)
  } catch {
    /* ignorar */
  }
}

export function loadUiSessionSnapshot(): UiSessionSnapshot | null {
  if (typeof window === 'undefined' || !isWarmSessionResume()) return null
  try {
    return parseUiSessionSnapshot(localStorage.getItem(NONATO_UI_SESSION_LS))
  } catch {
    return null
  }
}

export function saveUiSessionSnapshot(snapshot: UiSessionSnapshot): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      NONATO_UI_SESSION_LS,
      JSON.stringify({
        openTabs: snapshot.openTabs.slice(0, 12),
        activeTabId: snapshot.activeTabId,
        dashboardWorkspaceExpanded: snapshot.dashboardWorkspaceExpanded,
        savedAt: new Date().toISOString(),
      })
    )
  } catch {
    /* ignorar quota */
  }
}

'use client'

import { useState, useEffect, useRef } from 'react'
import {
  isOnline,
  forceSyncPendingChanges,
  clearPendingSyncQueue,
  getPendingSyncCount,
  setupAutoSyncOnReconnect,
  probeServerReachable,
} from '../utils/dataStorage'
import { getStoredUiString } from '../translations'

const PROBE_FOCUS_DEBOUNCE_MS = 4000
const PROBE_OFFLINE_INTERVAL_MS = 40_000
const PENDING_REFRESH_MS = 8_000

function scheduleIdle(fn: () => void): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    ;(window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
      fn,
      { timeout: 2000 }
    )
    return
  }
  window.setTimeout(fn, 0)
}

export function OfflineIndicator() {
  // Optimista no arranque — não confiar em navigator.onLine para banner vermelho.
  const [online, setOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<number | null>(null)
  const [lastFailed, setLastFailed] = useState<number | null>(null)
  const [lastConfirmed, setLastConfirmed] = useState<string | null>(null)
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null)
  const lastTapAtRef = useRef(0)
  const probeInFlightRef = useRef(false)
  const lastProbeAtRef = useRef(0)
  const lastFocusProbeAtRef = useRef(0)

  const refreshPending = () => setPendingCount(getPendingSyncCount())

  const runSync = () => {
    if (getPendingSyncCount() === 0) {
      refreshPending()
      return
    }
    setSyncing(true)
    forceSyncPendingChanges().then(({ synced, failed, discarded }) => {
      refreshPending()
      setSyncing(false)
      if (synced > 0 || discarded > 0) setLastSync(Date.now())
      if (failed > 0) setLastFailed(Date.now())
      if (getPendingSyncCount() === 0) setLastFailed(null)
    })
  }

  /**
   * Probe: force só em clique do utilizador; fundo usa cache.
   * Offline no banner só quando o probe confirma (falhas seguidas) — não por navigator sozinho.
   */
  const refreshOnlineFromProbe = async (opts?: { force?: boolean; syncIfOnline?: boolean }) => {
    if (probeInFlightRef.current) return
    const force = opts?.force === true
    const now = Date.now()
    if (!force && now - lastProbeAtRef.current < 5_000) return
    probeInFlightRef.current = true
    lastProbeAtRef.current = now
    try {
      const ok = await probeServerReachable({ force })
      if (ok) {
        setOnline(true)
        if (opts?.syncIfOnline !== false && getPendingSyncCount() > 0) runSync()
      } else {
        // Probe já exige várias falhas seguidas antes de devolver false.
        setOnline(false)
      }
    } finally {
      probeInFlightRef.current = false
    }
  }

  const tryDismissStuckQueue = () => {
    const now = Date.now()
    if (now - lastTapAtRef.current < 700) {
      const ok = window.confirm(
        getStoredUiString(
          'offlineSyncDismissConfirm',
          'Ignorar alteração pendente neste aparelho? (Não será enviada ao servidor.)'
        )
      )
      if (ok) {
        clearPendingSyncQueue()
        refreshPending()
        setLastFailed(null)
      }
      lastTapAtRef.current = 0
      return true
    }
    lastTapAtRef.current = now
    return false
  }

  useEffect(() => {
    // Não usar isOnline()/navigator no arranque para pintar vermelho.
    setOnline(true)
    refreshPending()
    void refreshOnlineFromProbe({ force: false })

    const teardownAutoSync = setupAutoSyncOnReconnect()

    const handleOnline = () => {
      // Evento do browser: optimista + soft probe (não é prova sozinha).
      setOnline(true)
      scheduleIdle(() => {
        void refreshOnlineFromProbe({ force: false, syncIfOnline: true })
      })
    }

    const handleOffline = () => {
      // NÃO setOnline(false) aqui — navigator.onLine mente com frequência.
      scheduleIdle(() => {
        void refreshOnlineFromProbe({ force: false })
      })
    }

    const handleConnectivity = (e: Event) => {
      const detail = (e as CustomEvent<{ online?: boolean }>).detail
      if (detail?.online) {
        setOnline(true)
        if (getPendingSyncCount() > 0) runSync()
      }
    }

    const handleSyncCompleted = () => {
      refreshPending()
      setLastSync(Date.now())
      setLastFailed(null)
      setSyncing(false)
      setOnline(true)
    }

    const handleSaveResult = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string; ok?: boolean }>).detail
      if (detail?.ok) {
        setOnline(true)
        setLastConfirmed(
          getStoredUiString('saveServerConfirmed', '✓ Confirmado no servidor')
        )
        setLastFailed(null)
      } else if (detail?.ok === false) {
        setLastFailed(Date.now())
        setLastConfirmed(null)
      }
    }

    const handleBlocked = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string; reason?: string }>).detail
      setBlockedMsg(
        getStoredUiString(
          'saveServerBlocked',
          'Alteração só neste aparelho — o servidor tem dados mais completos ({key}).'
        ).replace('{key}', String(detail?.key ?? ''))
      )
    }

    const handleQueueHydrated = () => refreshPending()

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastFocusProbeAtRef.current < PROBE_FOCUS_DEBOUNCE_MS) return
      lastFocusProbeAtRef.current = now
      // Online: não probe agressivo no focus.
      if (isOnline()) {
        refreshPending()
        return
      }
      scheduleIdle(() => {
        void refreshOnlineFromProbe({ force: false })
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('nonato-connectivity', handleConnectivity)
    window.addEventListener('nonato-sync-completed', handleSyncCompleted)
    window.addEventListener('nonato-save-server-result', handleSaveResult)
    window.addEventListener('nonato-sync-blocked', handleBlocked)
    window.addEventListener('nonato-sync-queue-hydrated', handleQueueHydrated)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleVisibility)

    // Só enquanto offline (e separador visível); intervalo longo + idle.
    const probeWhileOffline = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return
      if (isOnline()) {
        setOnline(true)
        return
      }
      scheduleIdle(() => {
        void refreshOnlineFromProbe({ force: false })
      })
    }, PROBE_OFFLINE_INTERVAL_MS)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('nonato-connectivity', handleConnectivity)
      window.removeEventListener('nonato-sync-completed', handleSyncCompleted)
      window.removeEventListener('nonato-save-server-result', handleSaveResult)
      window.removeEventListener('nonato-sync-blocked', handleBlocked)
      window.removeEventListener('nonato-sync-queue-hydrated', handleQueueHydrated)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
      window.clearInterval(probeWhileOffline)
      teardownAutoSync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runSync estável o suficiente para este efeito
  }, [])

  useEffect(() => {
    const interval = setInterval(refreshPending, PENDING_REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (pendingCount === 0) setLastFailed(null)
  }, [pendingCount])

  useEffect(() => {
    if (lastSync && online && pendingCount === 0 && !syncing && !lastFailed) {
      const t = setTimeout(() => setLastSync(null), 4000)
      return () => clearTimeout(t)
    }
  }, [lastSync, online, pendingCount, syncing, lastFailed])

  useEffect(() => {
    if (lastConfirmed) {
      const t = setTimeout(() => setLastConfirmed(null), 5000)
      return () => clearTimeout(t)
    }
  }, [lastConfirmed])

  useEffect(() => {
    if (blockedMsg) {
      const t = setTimeout(() => setBlockedMsg(null), 8000)
      return () => clearTimeout(t)
    }
  }, [blockedMsg])

  const showFailed = lastFailed && pendingCount > 0

  const hidden =
    online &&
    !syncing &&
    !lastSync &&
    !lastConfirmed &&
    !blockedMsg &&
    pendingCount === 0 &&
    !showFailed

  if (hidden) return null

  const bg = !online
    ? 'rgba(200, 80, 80, 0.95)'
    : showFailed
      ? 'rgba(220, 60, 60, 0.95)'
      : syncing
        ? 'rgba(0, 150, 255, 0.9)'
        : lastConfirmed
          ? 'rgba(0, 180, 90, 0.95)'
          : blockedMsg
            ? 'rgba(180, 100, 0, 0.95)'
            : pendingCount > 0
              ? 'rgba(0, 130, 220, 0.92)'
              : 'rgba(0, 200, 100, 0.9)'

  return (
    <>
      {!online ? (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            textAlign: 'center',
            backgroundColor: '#b71c1c',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
        >
          {getStoredUiString(
            'offlineModeBanner',
            'Modo offline — alterações serão enviadas quando voltar a ligar.'
          )}
        </div>
      ) : null}
      <div
        role="status"
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          padding: '10px 16px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          maxWidth: 'min(92vw, 360px)',
          backgroundColor: bg,
          color: '#fff',
          cursor: pendingCount > 0 || showFailed || !online ? 'pointer' : undefined,
        }}
        onClick={() => {
          if (!online) {
            void refreshOnlineFromProbe({ force: true, syncIfOnline: true })
            return
          }
          if (!(pendingCount > 0 || showFailed)) return
          if (showFailed && tryDismissStuckQueue()) return
          runSync()
        }}
        title={
          !online
            ? getStoredUiString('offlineTapToSync', 'Toque para tentar sincronizar agora')
            : pendingCount > 0 || showFailed
              ? showFailed
                ? getStoredUiString(
                    'offlineTapToSyncOrDismiss',
                    'Toque para tentar de novo; toque 2× para ignorar'
                  )
                : getStoredUiString('offlineTapToSync', 'Toque para tentar sincronizar agora')
              : undefined
        }
      >
        {!online ? (
          <>
            {getStoredUiString(
              'offlineModeBanner',
              'Modo offline — alterações serão enviadas quando voltar a ligar.'
            )}
          </>
        ) : blockedMsg ? (
          <>{blockedMsg}</>
        ) : lastConfirmed ? (
          <>{lastConfirmed}</>
        ) : syncing ? (
          <>{getStoredUiString('offlineSyncing', 'A sincronizar com o servidor…')}</>
        ) : showFailed ? (
          <>
            {getStoredUiString(
              'offlineSyncFailed',
              '⚠ {n} alteração(ões) NÃO confirmada(s) no servidor — toque para tentar de novo'
            ).replace('{n}', String(pendingCount))}
          </>
        ) : pendingCount > 0 ? (
          <>
            {getStoredUiString(
              'offlineSyncPending',
              '{n} alteração(ões) pendente(s) — a enviar ao servidor…'
            ).replace('{n}', String(pendingCount))}
          </>
        ) : lastSync ? (
          <>{getStoredUiString('offlineSyncDone', 'Sincronizado com o servidor')}</>
        ) : null}
      </div>
    </>
  )
}

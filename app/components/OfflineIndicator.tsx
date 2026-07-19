'use client'

import { useState, useEffect } from 'react'
import {
  isOnline,
  autoSyncPendingChanges,
  getPendingSyncCount,
  setupAutoSyncOnReconnect,
} from '../utils/dataStorage'
import { getStoredUiString } from '../translations'

export function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<number | null>(null)
  const [lastFailed, setLastFailed] = useState<number | null>(null)
  const [lastConfirmed, setLastConfirmed] = useState<string | null>(null)
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null)

  const refreshPending = () => setPendingCount(getPendingSyncCount())

  const runSync = () => {
    setSyncing(true)
    autoSyncPendingChanges().then(({ synced, failed }) => {
      refreshPending()
      setSyncing(false)
      if (synced > 0) setLastSync(Date.now())
      if (failed > 0) setLastFailed(Date.now())
    })
  }

  useEffect(() => {
    setOnline(isOnline())
    refreshPending()

    const teardownAutoSync = setupAutoSyncOnReconnect()

    const handleOnline = () => {
      setOnline(true)
      runSync()
    }

    const handleOffline = () => {
      setOnline(false)
    }

    const handleSyncCompleted = () => {
      refreshPending()
      setLastSync(Date.now())
      setSyncing(false)
    }

    const handleSaveResult = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string; ok?: boolean }>).detail
      if (detail?.ok) {
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

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('nonato-sync-completed', handleSyncCompleted)
    window.addEventListener('nonato-save-server-result', handleSaveResult)
    window.addEventListener('nonato-sync-blocked', handleBlocked)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('nonato-sync-completed', handleSyncCompleted)
      window.removeEventListener('nonato-save-server-result', handleSaveResult)
      window.removeEventListener('nonato-sync-blocked', handleBlocked)
      teardownAutoSync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runSync estável o suficiente para este efeito
  }, [])

  useEffect(() => {
    const interval = setInterval(refreshPending, 5000)
    return () => clearInterval(interval)
  }, [])

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
    online && pendingCount === 0 && !syncing && !lastSync && !showFailed && !lastConfirmed && !blockedMsg

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
            : 'rgba(0, 200, 100, 0.9)'

  return (
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
        cursor: pendingCount > 0 || showFailed ? 'pointer' : undefined,
      }}
      onClick={() => {
        if (online && (pendingCount > 0 || showFailed)) runSync()
      }}
      title={
        pendingCount > 0 || showFailed
          ? getStoredUiString('offlineTapToSync', 'Toque para tentar sincronizar agora')
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
  )
}

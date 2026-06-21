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

  const refreshPending = () => setPendingCount(getPendingSyncCount())

  const runSync = () => {
    setSyncing(true)
    autoSyncPendingChanges().then(({ synced }) => {
      refreshPending()
      setSyncing(false)
      if (synced > 0) setLastSync(Date.now())
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

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('nonato-sync-completed', handleSyncCompleted)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('nonato-sync-completed', handleSyncCompleted)
      teardownAutoSync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runSync estável o suficiente para este efeito
  }, [])

  useEffect(() => {
    const interval = setInterval(refreshPending, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (lastSync && online && pendingCount === 0 && !syncing) {
      const t = setTimeout(() => setLastSync(null), 4000)
      return () => clearTimeout(t)
    }
  }, [lastSync, online, pendingCount, syncing])

  if (online && pendingCount === 0 && !syncing && !lastSync) return null

  return (
    <div
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
        ...(online
          ? {
              backgroundColor: syncing ? 'rgba(0, 150, 255, 0.9)' : 'rgba(0, 200, 100, 0.9)',
              color: '#fff',
            }
          : {
              backgroundColor: 'rgba(200, 80, 80, 0.95)',
              color: '#fff',
            }),
      }}
    >
      {!online ? (
        <>
          {getStoredUiString(
            'offlineModeBanner',
            'Modo offline — pode trabalhar; alterações serão enviadas ao servidor quando voltar a ligar.'
          )}
        </>
      ) : syncing ? (
        <>{getStoredUiString('offlineSyncing', 'A sincronizar com o servidor…')}</>
      ) : pendingCount > 0 ? (
        <>
          {getStoredUiString('offlineSyncPending', '{n} alteração(ões) pendente(s) — a enviar ao servidor…').replace(
            '{n}',
            String(pendingCount)
          )}
        </>
      ) : lastSync ? (
        <>{getStoredUiString('offlineSyncDone', 'Sincronizado com o servidor')}</>
      ) : null}
    </div>
  )
}

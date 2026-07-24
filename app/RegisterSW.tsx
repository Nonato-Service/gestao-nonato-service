'use client'

import { useEffect, useState, useRef } from 'react'
import { setupAutoSyncOnReconnect, setupFlushSyncOnPageHide } from './utils/dataStorage'
import { getStoredUiString } from './translations'

// Bumpar este número em cada deploy para forçar atualização no telemóvel/tablet
const SW_VERSION = 85
const SW_DISMISSED_SESSION_KEY = 'nonato-pwa-update-dismissed-v'
const UI_LANGUAGE_EVENT = 'nonato-ui-language'

export function RegisterSW() {
  const [updateReady, setUpdateReady] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [uiLangTick, setUiLangTick] = useState(0)
  const reloadHandled = useRef(false)
  const userConfirmedUpdate = useRef(false)
  const lastUpdateCheckAt = useRef(0)

  useEffect(() => {
    const refreshUiLang = () => setUiLangTick((n) => n + 1)
    window.addEventListener(UI_LANGUAGE_EVENT, refreshUiLang)
    window.addEventListener('storage', refreshUiLang)
    return () => {
      window.removeEventListener(UI_LANGUAGE_EVENT, refreshUiLang)
      window.removeEventListener('storage', refreshUiLang)
    }
  }, [])

  void uiLangTick
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const isDismissedThisSession = () => {
      try {
        return sessionStorage.getItem(SW_DISMISSED_SESSION_KEY) === String(SW_VERSION)
      } catch {
        return false
      }
    }

    const markUpdateAvailable = () => {
      if (isDismissedThisSession()) return
      setUpdateReady(true)
    }

    const register = () => {
      navigator.serviceWorker
        .register(`/sw.js?v=${SW_VERSION}`, {
          // iPad/tablet Safari tende a cachear o sw.js — isto força ir buscar versão nova
          updateViaCache: 'none',
        })
        .then((reg) => {
          setRegistration(reg)

          // Não recarregar automaticamente — o utilizador escolhe «Atualizar» no banner.
          if (reg.waiting && navigator.serviceWorker.controller) {
            markUpdateAvailable()
            return
          }

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (!newWorker) return
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                markUpdateAvailable()
              }
            })
          })
        })
        .catch((err) => console.warn('PWA: Registo falhou:', err))
    }
    register()

    const onControllerChange = () => {
      if (!userConfirmedUpdate.current) return
      if (reloadHandled.current) return
      reloadHandled.current = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    const checkForUpdates = () => {
      const now = Date.now()
      if (now - lastUpdateCheckAt.current < 5 * 60_000) return
      if (!navigator.onLine) return
      lastUpdateCheckAt.current = now
      navigator.serviceWorker.ready.then((reg) => reg.update()).catch(() => {})
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkForUpdates()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    const onPageShow = () => checkForUpdates()
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('focus', onPageShow)

    const teardownAutoSync = setupAutoSyncOnReconnect()
    const teardownFlush = setupFlushSyncOnPageHide()

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('focus', onPageShow)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      teardownAutoSync()
      teardownFlush()
    }
  }, [])

  const handleUpdate = () => {
    userConfirmedUpdate.current = true
    setUpdateReady(false)
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      setTimeout(() => {
        if (!reloadHandled.current) window.location.reload()
      }, 1500)
      return
    }
    window.location.reload()
  }

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(SW_DISMISSED_SESSION_KEY, String(SW_VERSION))
    } catch {
      /* ignorar */
    }
    setUpdateReady(false)
  }

  if (!updateReady) return null
  return (
    <div
      className="pwa-update-banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: 'linear-gradient(135deg, #00aa00 0%, #006600 100%)',
        color: '#fff',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        fontSize: 15,
        fontWeight: 600,
      }}
    >
      <span>
        {getStoredUiString(
          'pwaUpdateBannerMessage',
          'Nova versão disponível — carregue em «Atualizar» para recarregar o programa'
        )}
      </span>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="pwa-update-banner__btn pwa-update-banner__btn--later"
          onClick={handleDismiss}
          title={getStoredUiString(
            'pwaUpdateBtnLaterTitle',
            'Continuar com a versão actual e actualizar mais tarde'
          )}
        >
          {getStoredUiString('pwaUpdateBtnLater', 'DEPOIS')}
        </button>
        <button
          type="button"
          className="pwa-update-banner__btn pwa-update-banner__btn--update"
          onClick={handleUpdate}
          title={getStoredUiString('pwaUpdateBtnUpdateTitle', 'Recarregar o programa com a versão nova')}
        >
          {getStoredUiString('pwaUpdateBtnUpdate', 'ATUALIZAR')}
        </button>
      </div>
    </div>
  )
}

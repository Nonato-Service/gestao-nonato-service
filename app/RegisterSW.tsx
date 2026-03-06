'use client'

import { useEffect, useState, useRef } from 'react'
import { processSyncQueue } from './utils/dataStorage'

// Bumpar este número em cada deploy para forçar atualização na hospedagem
const SW_VERSION = 9

export function RegisterSW() {
  const [updateReady, setUpdateReady] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const reloadHandled = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker
        .register(`/sw.js?v=${SW_VERSION}`)
        .then((reg) => {
          setRegistration(reg)
          if (reg.waiting) setUpdateReady(true)
          // Verificar atualizações imediatamente e quando voltar ao app (importante no mobile)
          reg.update()
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (!newWorker) return
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateReady(true)
              }
            })
          })
        })
        .catch((err) => console.warn('PWA: Registo falhou:', err))
    }
    register()

    const onControllerChange = () => {
      if (reloadHandled.current) return
      reloadHandled.current = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        navigator.serviceWorker.ready.then((reg) => reg.update())
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    if (navigator.onLine) {
      processSyncQueue().then(({ synced }) => {
        if (synced > 0) console.log('PWA: Sincronizados', synced, 'itens.')
      })
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      // Fallback para mobile: controllerchange pode não disparar em alguns telemóveis
      setTimeout(() => {
        if (!reloadHandled.current) window.location.reload()
      }, 1500)
    }
  }

  // Fechar o banner (importante no telemóvel/tablet: não bloquear zoom nem a tela)
  const DISMISS_KEY = 'nonato-pwa-banner-dismissed'
  const DISMISS_HOURS = 24

  const handleDismiss = () => {
    setUpdateReady(false)
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_HOURS * 60 * 60 * 1000))
    } catch {}
  }

  // Não mostrar o banner se o utilizador fechou nas últimas 24h (evita tela verde no telemóvel)
  const [canShowBanner, setCanShowBanner] = useState<boolean | null>(null)
  useEffect(() => {
    if (!updateReady) return
    try {
      const until = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10)
      setCanShowBanner(until <= Date.now())
    } catch {
      setCanShowBanner(true)
    }
  }, [updateReady])

  if (!updateReady || canShowBanner !== true) return null
  return (
    <div
      className="pwa-update-banner"
      role="alert"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: 'linear-gradient(135deg, #00aa00 0%, #006600 100%)',
        color: '#fff',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        fontSize: 15,
        fontWeight: 600,
        minHeight: '48px',
        touchAction: 'manipulation'
      }}
    >
      <span style={{ flex: '1 1 auto', minWidth: 0 }}>Atualização disponível</span>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.25)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          Fechar
        </button>
        <button
          type="button"
          onClick={handleUpdate}
          style={{
            padding: '10px 24px',
            background: '#fff',
            color: '#006600',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          ATUALIZAR
        </button>
      </div>
    </div>
  )
}

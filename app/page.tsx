'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { AppErrorRecovery } from './components/AppErrorRecovery'
import { isWarmSessionResume } from './utils/syncRevision'

const BOOT_COPY: Record<string, { load: string; stuck: string; btn: string }> = {
  'pt-BR': {
    load: 'A carregar…',
    stuck: 'O programa não abriu. Toque para tentar de novo.',
    btn: 'Tentar de novo',
  },
  es: {
    load: 'Cargando…',
    stuck: 'El programa no se abrió. Toque para intentarlo de nuevo.',
    btn: 'Intentar de nuevo',
  },
  fr: {
    load: 'Chargement…',
    stuck: 'Le programme ne s’est pas ouvert. Touchez pour réessayer.',
    btn: 'Réessayer',
  },
  it: {
    load: 'Caricamento…',
    stuck: 'Il programma non si è aperto. Tocca per riprovare.',
    btn: 'Riprova',
  },
  de: {
    load: 'Wird geladen…',
    stuck: 'Das Programm hat sich nicht geöffnet. Tippen Sie, um es erneut zu versuchen.',
    btn: 'Erneut versuchen',
  },
  en: {
    load: 'Loading…',
    stuck: 'The program did not open. Tap to try again.',
    btn: 'Try again',
  },
}

function bootCopy() {
  try {
    const raw = window.localStorage.getItem('nonato-language') || 'pt-BR'
    const key = raw === 'en-US' ? 'en' : raw
    return BOOT_COPY[key] || BOOT_COPY['pt-BR']
  } catch {
    return BOOT_COPY['pt-BR']
  }
}

async function reloadAppHard() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k.startsWith('nonato-pwa')).map((k) => caches.delete(k)))
    }
  } catch {
    /* ignorar */
  }
  const url = new URL(window.location.href)
  url.searchParams.set('boot', String(Date.now()))
  window.location.replace(url.toString())
}

function BootShell({
  message,
  showRetry,
}: {
  message: string
  showRetry?: boolean
}) {
  const copy = bootCopy()
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: '#1a1a1a',
        color: '#e8e8e8',
        fontFamily: 'system-ui, sans-serif',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'linear-gradient(145deg, #00c853, #009624)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: 1,
          color: '#fff',
        }}
      >
        NS
      </div>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>NONATO SERVICE</p>
      <p style={{ margin: 0, fontSize: 14, opacity: 0.75 }}>{message}</p>
      {showRetry ? (
        <button
          type="button"
          onClick={() => void reloadAppHard()}
          style={{
            marginTop: 8,
            minHeight: 44,
            padding: '12px 22px',
            borderRadius: 10,
            border: '1px solid #00ff00',
            background: '#2a2a2a',
            color: '#00ff00',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          {copy.btn}
        </button>
      ) : null}
    </div>
  )
}

function BootStuck() {
  return <BootShell message={bootCopy().stuck} showRetry />
}

function BootLoading() {
  const [stuck, setStuck] = useState(false)
  const copy = bootCopy()

  useEffect(() => {
    const id = window.setTimeout(() => setStuck(true), 10000)
    return () => window.clearTimeout(id)
  }, [])

  if (typeof window !== 'undefined' && isWarmSessionResume() && !stuck) return null

  return <BootShell message={stuck ? copy.stuck : copy.load} showRetry={stuck} />
}

async function loadNonatoMainApp() {
  try {
    return await import('./NonatoMainApp')
  } catch (first) {
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    try {
      return await import('./NonatoMainApp')
    } catch {
      console.error('[Nonato] falha ao carregar o programa', first)
      return {
        default: function MainLoadFailed() {
          return <BootStuck />
        },
      }
    }
  }
}

const NonatoMainApp = dynamic(() => loadNonatoMainApp(), {
  ssr: false,
  loading: () => <BootLoading />,
})

export default function Page() {
  return (
    <AppErrorRecovery>
      <NonatoMainApp />
    </AppErrorRecovery>
  )
}

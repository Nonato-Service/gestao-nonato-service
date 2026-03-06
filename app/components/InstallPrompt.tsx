'use client'

import { useEffect, useState, useRef } from 'react'

const STORAGE_KEY = 'nonato-install-prompt-dismissed'
const DISMISS_DAYS = 7

const texts: Record<string, { installApp: string; installDesc: string; installNow: string; addToHome: string; iosHint: string; androidHint: string; later: string; close: string }> = {
  pt: {
    installApp: 'Instalar a app',
    installDesc: 'Use no telemóvel ou tablet como uma app. Acesso rápido a partir do ecrã inicial.',
    installNow: 'Instalar agora',
    addToHome: 'Adicionar ao ecrã inicial',
    iosHint: 'No iPhone/iPad: Safari → Partilhar (□↑) → "Adicionar ao Ecrã Inicial"',
    androidHint: 'No Android: Chrome → Menu (⋮) → "Instalar app" ou "Adicionar ao ecrã inicial"',
    later: 'Agora não',
    close: 'Fechar'
  },
  en: {
    installApp: 'Install the app',
    installDesc: 'Use on your phone or tablet as an app. Quick access from the home screen.',
    installNow: 'Install now',
    addToHome: 'Add to home screen',
    iosHint: 'On iPhone/iPad: Safari → Share (□↑) → "Add to Home Screen"',
    androidHint: 'On Android: Chrome → Menu (⋮) → "Install app" or "Add to home screen"',
    later: 'Not now',
    close: 'Close'
  },
  es: {
    installApp: 'Instalar la app',
    installDesc: 'Úsala en el móvil o tablet como una app. Acceso rápido desde la pantalla de inicio.',
    installNow: 'Instalar ahora',
    addToHome: 'Añadir a la pantalla de inicio',
    iosHint: 'En iPhone/iPad: Safari → Compartir (□↑) → "Añadir a la pantalla de inicio"',
    androidHint: 'En Android: Chrome → Menú (⋮) → "Instalar aplicación" o "Añadir a la pantalla de inicio"',
    later: 'Ahora no',
    close: 'Cerrar'
  },
  fr: {
    installApp: 'Installer l\'app',
    installDesc: 'Utilisez sur téléphone ou tablette comme une app. Accès rapide depuis l\'écran d\'accueil.',
    installNow: 'Installer',
    addToHome: 'Ajouter à l\'écran d\'accueil',
    iosHint: 'Sur iPhone/iPad : Safari → Partager (□↑) → "Sur l\'écran d\'accueil"',
    androidHint: 'Sur Android : Chrome → Menu (⋮) → "Installer l\'application"',
    later: 'Plus tard',
    close: 'Fermer'
  },
  it: {
    installApp: 'Installa l\'app',
    installDesc: 'Usa su telefono o tablet come un\'app. Accesso rapido dalla schermata Home.',
    installNow: 'Installa ora',
    addToHome: 'Aggiungi alla schermata Home',
    iosHint: 'Su iPhone/iPad: Safari → Condividi (□↑) → "Aggiungi a Home"',
    androidHint: 'Su Android: Chrome → Menu (⋮) → "Installa app"',
    later: 'Ora no',
    close: 'Chiudi'
  },
  de: {
    installApp: 'App installieren',
    installDesc: 'Auf dem Handy oder Tablet als App nutzen. Schnellzugriff vom Startbildschirm.',
    installNow: 'Jetzt installieren',
    addToHome: 'Zum Startbildschirm',
    iosHint: 'Auf iPhone/iPad: Safari → Teilen (□↑) → "Zum Home-Bildschirm"',
    androidHint: 'Auf Android: Chrome → Menü (⋮) → "App installieren"',
    later: 'Später',
    close: 'Schließen'
  }
}

function getLang(): string {
  if (typeof window === 'undefined') return 'pt'
  const lang = navigator.language || (navigator as any).userLanguage || ''
  if (lang.startsWith('pt')) return 'pt'
  if (lang.startsWith('es')) return 'es'
  if (lang.startsWith('fr')) return 'fr'
  if (lang.startsWith('it')) return 'it'
  if (lang.startsWith('de')) return 'de'
  return 'en'
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showCard, setShowCard] = useState(false)
  const [canShow, setCanShow] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setIsMobileOrTablet(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    mounted.current = true

    const standalone = (window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    setIsStandalone(standalone)
    if (standalone) {
      setCanShow(false)
      setInstalled(true)
      return
    }

    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) {
      const t = parseInt(dismissed, 10)
      if (Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000) setCanShow(false)
    }
    setCanShow(true)

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      mounted.current = false
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
    setShowCard(false)
  }

  const handleDismiss = () => {
    setShowCard(false)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, Date.now().toString())
    setCanShow(false)
  }

  const t = texts[getLang()] || texts.pt

  if (!canShow || installed || isStandalone || !isMobileOrTablet) return null

  return (
    <>
      {/* Botão flutuante "Instalar a app" */}
      <button
        type="button"
        onClick={() => setShowCard(true)}
        aria-label={t.installApp}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 9998,
          padding: '12px 20px',
          background: 'linear-gradient(135deg, rgba(0, 200, 0, 0.9) 0%, rgba(0, 120, 0, 0.95) 100%)',
          color: '#fff',
          border: '2px solid rgba(0, 255, 0, 0.6)',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0, 255, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          touchAction: 'manipulation'
        }}
      >
        <span style={{ fontSize: 20 }}>📲</span>
        {t.installApp}
      </button>

      {/* Card / modal com instruções */}
      {showCard && (
        <div
          role="dialog"
          aria-label={t.installApp}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 16,
            paddingBottom: 100,
            boxSizing: 'border-box'
          }}
          onClick={() => setShowCard(false)}
        >
          <div
            style={{
              background: '#1a1a1a',
              borderRadius: 16,
              border: '2px solid rgba(0, 255, 0, 0.5)',
              padding: 24,
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              onClick: e => e.stopPropagation()
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#00ff00', fontSize: 18 }}>📲 {t.installApp}</h3>
              <button type="button" onClick={() => setShowCard(false)} aria-label={t.close} style={{ background: 'transparent', border: 'none', color: '#999', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <p style={{ color: '#ccc', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>{t.installDesc}</p>

            {deferredPrompt ? (
              <button
                type="button"
                onClick={handleInstall}
                style={{
                  width: '100%',
                  padding: 14,
                  background: '#00aa00',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  marginBottom: 12
                }}
              >
                {t.installNow}
              </button>
            ) : (
              <>
                <p style={{ color: '#00ff00', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>{t.addToHome}</p>
                <p style={{ color: '#aaa', fontSize: 12, marginBottom: 8 }}>{t.iosHint}</p>
                <p style={{ color: '#aaa', fontSize: 12, marginBottom: 16 }}>{t.androidHint}</p>
              </>
            )}

            <button type="button" onClick={handleDismiss} style={{ width: '100%', padding: 10, background: 'transparent', color: '#888', border: '1px solid #555', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
              {t.later}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

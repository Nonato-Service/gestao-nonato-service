'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'nonato-install-prompt-dismissed'
const DISMISS_DAYS = 7

const texts: Record<
  string,
  {
    installApp: string
    installDesc: string
    installNow: string
    addToHome: string
    iosHint: string
    iosSafariHint: string
    androidHint: string
    desktopHint: string
    later: string
    close: string
    acessoTitle: string
    acessoDesc: string
    acessoLabel: string
    abrirSistema: string
    copiarLigacao: string
    copiado: string
    atalhoPc: string
    atalhoGuardado: string
    jaInstalado: string
    copyFail: string
  }
> = {
  pt: {
    installApp: 'Instalar a app',
    installDesc: 'Use no telemóvel, tablet ou computador. Funciona no Firefox, Chrome e Edge.',
    installNow: 'Instalar agora',
    addToHome: 'Adicionar ao ecrã inicial',
    iosHint: 'No iPhone/iPad: Safari → Partilhar (□↑) → "Adicionar ao Ecrã Inicial"',
    iosSafariHint: 'No iPhone/iPad, use o Safari para adicionar à tela inicial e ter a melhor compatibilidade.',
    androidHint: 'No Android: Firefox ou Chrome → Menu (⋮) → "Instalar app" ou "Adicionar ao ecrã inicial"',
    desktopHint: 'No computador: Firefox, Chrome ou Edge → menu (⋮) → "Instalar" ou "Guardar como"',
    later: 'Agora não',
    close: 'Fechar',
    acessoTitle: 'Acesso neste aparelho',
    acessoDesc:
      'Este botão continua a funcionar depois das actualizações. Use no PC, notebook, tablet e telefone. A ligação /acesso vai sempre à versão nova.',
    acessoLabel: 'Acesso neste aparelho',
    abrirSistema: 'Abrir o sistema',
    copiarLigacao: 'Copiar ligação de acesso',
    copiado: 'Ligação copiada. Cole nos favoritos ou envie para outro aparelho.',
    atalhoPc: 'Guardar atalho do computador (.url)',
    atalhoGuardado: 'Atalho descarregado. Abra-o na Área de Trabalho.',
    jaInstalado: 'Já está instalado neste aparelho.',
    copyFail: 'Não foi possível copiar. Segure o endereço na barra do browser.',
  },
  en: {
    installApp: 'Install the app',
    installDesc: 'Use on phone, tablet or computer. Works in Firefox, Chrome and Edge.',
    installNow: 'Install now',
    addToHome: 'Add to home screen',
    iosHint: 'On iPhone/iPad: Safari → Share (□↑) → "Add to Home Screen"',
    iosSafariHint: 'On iPhone/iPad, use Safari to add it to the home screen and get the best compatibility.',
    androidHint: 'On Android: Firefox or Chrome → Menu (⋮) → "Install app" or "Add to home screen"',
    desktopHint: 'On computer: Firefox, Chrome or Edge → menu (⋮) → "Install" or "Save as"',
    later: 'Not now',
    close: 'Close',
    acessoTitle: 'Access on this device',
    acessoDesc:
      'This button keeps working after updates. Use it on PC, laptop, tablet and phone. The /acesso link always opens the latest version.',
    acessoLabel: 'Access on this device',
    abrirSistema: 'Open the system',
    copiarLigacao: 'Copy access link',
    copiado: 'Link copied. Save it as a bookmark or send it to another device.',
    atalhoPc: 'Save computer shortcut (.url)',
    atalhoGuardado: 'Shortcut downloaded. Open it from the desktop.',
    jaInstalado: 'Already installed on this device.',
    copyFail: 'Could not copy. Long-press the address in the browser bar.',
  },
  es: {
    installApp: 'Instalar la app',
    installDesc: 'Úsala en móvil, tablet o ordenador. Funciona en Firefox, Chrome y Edge.',
    installNow: 'Instalar ahora',
    addToHome: 'Añadir a la pantalla de inicio',
    iosHint: 'En iPhone/iPad: Safari → Compartir (□↑) → "Añadir a la pantalla de inicio"',
    iosSafariHint: 'En iPhone/iPad, usa Safari para añadirla a la pantalla de inicio y tener la mejor compatibilidad.',
    androidHint: 'En Android: Firefox o Chrome → Menú (⋮) → "Instalar aplicación" o "Añadir a la pantalla de inicio"',
    desktopHint: 'En ordenador: Firefox, Chrome o Edge → menú (⋮) → "Instalar" o "Guardar como"',
    later: 'Ahora no',
    close: 'Cerrar',
    acessoTitle: 'Acceso en este dispositivo',
    acessoDesc:
      'Este botón sigue funcionando después de las actualizaciones. Úsalo en PC, portátil, tablet y teléfono. El enlace /acesso abre siempre la versión nueva.',
    acessoLabel: 'Acceso en este dispositivo',
    abrirSistema: 'Abrir el sistema',
    copiarLigacao: 'Copiar enlace de acceso',
    copiado: 'Enlace copiado. Guárdalo en favoritos o envíalo a otro dispositivo.',
    atalhoPc: 'Guardar acceso directo del ordenador (.url)',
    atalhoGuardado: 'Acceso descargado. Ábrelo en el escritorio.',
    jaInstalado: 'Ya está instalado en este dispositivo.',
    copyFail: 'No se pudo copiar. Mantén la dirección en la barra del navegador.',
  },
  fr: {
    installApp: "Installer l'app",
    installDesc: 'Utilisez sur téléphone, tablette ou ordinateur. Fonctionne avec Firefox, Chrome et Edge.',
    installNow: 'Installer',
    addToHome: "Ajouter à l'écran d'accueil",
    iosHint: 'Sur iPhone/iPad : Safari → Partager (□↑) → "Sur l\'écran d\'accueil"',
    iosSafariHint:
      "Sur iPhone/iPad, utilisez Safari pour l'ajouter à l'écran d'accueil et obtenir la meilleure compatibilité.",
    androidHint: 'Sur Android : Firefox ou Chrome → Menu (⋮) → "Installer l\'application"',
    desktopHint: 'Sur ordinateur : Firefox, Chrome ou Edge → menu (⋮) → "Installer"',
    later: 'Plus tard',
    close: 'Fermer',
    acessoTitle: 'Accès sur cet appareil',
    acessoDesc:
      'Ce bouton continue de fonctionner après les mises à jour. PC, portable, tablette et téléphone. Le lien /acesso ouvre toujours la dernière version.',
    acessoLabel: 'Accès sur cet appareil',
    abrirSistema: 'Ouvrir le système',
    copiarLigacao: 'Copier le lien d’accès',
    copiado: 'Lien copié. Enregistrez-le en favori ou envoyez-le à un autre appareil.',
    atalhoPc: 'Enregistrer le raccourci ordinateur (.url)',
    atalhoGuardado: 'Raccourci téléchargé. Ouvrez-le sur le bureau.',
    jaInstalado: 'Déjà installé sur cet appareil.',
    copyFail: 'Impossible de copier. Maintenez l’adresse dans la barre du navigateur.',
  },
  it: {
    installApp: "Installa l'app",
    installDesc: 'Usa su telefono, tablet o computer. Funziona con Firefox, Chrome e Edge.',
    installNow: 'Installa ora',
    addToHome: 'Aggiungi alla schermata Home',
    iosHint: 'Su iPhone/iPad: Safari → Condividi (□↑) → "Aggiungi a Home"',
    iosSafariHint: 'Su iPhone/iPad, usa Safari per aggiungerla alla schermata Home e avere la migliore compatibilità.',
    androidHint: 'Su Android: Firefox o Chrome → Menu (⋮) → "Installa app"',
    desktopHint: 'Su computer: Firefox, Chrome o Edge → menu (⋮) → "Installa"',
    later: 'Ora no',
    close: 'Chiudi',
    acessoTitle: 'Accesso su questo dispositivo',
    acessoDesc:
      'Questo pulsante continua a funzionare dopo gli aggiornamenti. PC, notebook, tablet e telefono. Il link /acesso apre sempre la versione nuova.',
    acessoLabel: 'Accesso su questo dispositivo',
    abrirSistema: 'Apri il sistema',
    copiarLigacao: 'Copia il collegamento di accesso',
    copiado: 'Collegamento copiato. Salvalo nei preferiti o invialo a un altro dispositivo.',
    atalhoPc: 'Salva collegamento per il computer (.url)',
    atalhoGuardado: 'Collegamento scaricato. Aprilo sul desktop.',
    jaInstalado: 'Già installato su questo dispositivo.',
    copyFail: 'Impossibile copiare. Tieni premuto l’indirizzo nella barra del browser.',
  },
  de: {
    installApp: 'App installieren',
    installDesc: 'Auf Handy, Tablet oder Computer nutzen. Läuft in Firefox, Chrome und Edge.',
    installNow: 'Jetzt installieren',
    addToHome: 'Zum Startbildschirm',
    iosHint: 'Auf iPhone/iPad: Safari → Teilen (□↑) → "Zum Home-Bildschirm"',
    iosSafariHint:
      'Auf iPhone/iPad Safari verwenden, um die App zum Startbildschirm hinzuzufügen und die beste Kompatibilität zu erhalten.',
    androidHint: 'Auf Android: Firefox oder Chrome → Menü (⋮) → "App installieren"',
    desktopHint: 'Am Computer: Firefox, Chrome oder Edge → Menü (⋮) → "Installieren"',
    later: 'Später',
    close: 'Schließen',
    acessoTitle: 'Zugriff auf diesem Gerät',
    acessoDesc:
      'Diese Schaltfläche funktioniert nach Updates weiter. PC, Notebook, Tablet und Telefon. Der Link /acesso öffnet immer die neue Version.',
    acessoLabel: 'Zugriff auf diesem Gerät',
    abrirSistema: 'System öffnen',
    copiarLigacao: 'Zugriffslink kopieren',
    copiado: 'Link kopiert. Als Lesezeichen speichern oder an ein anderes Gerät senden.',
    atalhoPc: 'Desktop-Verknüpfung speichern (.url)',
    atalhoGuardado: 'Verknüpfung heruntergeladen. Auf dem Desktop öffnen.',
    jaInstalado: 'Bereits auf diesem Gerät installiert.',
    copyFail: 'Kopieren nicht möglich. Adresse in der Browserleiste gedrückt halten.',
  },
}

function getLang(): string {
  if (typeof window === 'undefined') return 'pt'
  try {
    const stored = localStorage.getItem('nonato-language') || ''
    if (stored.startsWith('pt')) return 'pt'
    if (stored.startsWith('es')) return 'es'
    if (stored.startsWith('fr')) return 'fr'
    if (stored.startsWith('it')) return 'it'
    if (stored.startsWith('de')) return 'de'
    if (stored.startsWith('en')) return 'en'
  } catch {
    /* ignore */
  }
  const lang = navigator.language || (navigator as any).userLanguage || ''
  if (lang.startsWith('pt')) return 'pt'
  if (lang.startsWith('es')) return 'es'
  if (lang.startsWith('fr')) return 'fr'
  if (lang.startsWith('it')) return 'it'
  if (lang.startsWith('de')) return 'de'
  return 'en'
}

function acessoUrl(): string {
  if (typeof window === 'undefined') return '/acesso'
  return `${window.location.origin}/acesso`
}

type InstallPromptContextValue = {
  canShow: boolean
  canShowAcesso: boolean
  openInstallModal: () => void
  openAcessoModal: () => void
  installLabel: string
  installDesc: string
  acessoLabel: string
  acessoDesc: string
}

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null)

export function useInstallPrompt(): InstallPromptContextValue | null {
  return useContext(InstallPromptContext)
}

const btnMain: React.CSSProperties = {
  width: '100%',
  padding: 14,
  background: '#00aa00',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
  marginBottom: 10,
}

const btnSec: React.CSSProperties = {
  width: '100%',
  padding: 12,
  background: 'transparent',
  color: '#00ff00',
  border: '1px solid #00ff00',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 10,
}

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showCard, setShowCard] = useState(false)
  const [canShow, setCanShow] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isSafari, setIsSafari] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [langTick, setLangTick] = useState(0)
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
    const onLang = () => setLangTick((n) => n + 1)
    window.addEventListener('nonato-ui-language', onLang)
    window.addEventListener('storage', onLang)
    return () => {
      window.removeEventListener('nonato-ui-language', onLang)
      window.removeEventListener('storage', onLang)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    mounted.current = true

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    const ua = window.navigator.userAgent || ''
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const safari = /^((?!chrome|android).)*safari/i.test(ua)
    setIsIos(ios)
    setIsSafari(safari)
    setIsStandalone(standalone)
    if (standalone) {
      setCanShow(false)
      setInstalled(true)
    } else {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      if (dismissed) {
        const t = parseInt(dismissed, 10)
        if (Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000) setCanShow(false)
        else setCanShow(true)
      } else {
        setCanShow(true)
      }
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const onOpenAcesso = () => setShowCard(true)
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('nonato-open-acesso', onOpenAcesso)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('nonato-open-acesso', onOpenAcesso)
      mounted.current = false
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowCard(false)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, Date.now().toString())
    setCanShow(false)
  }

  const t = texts[getLang()] || texts.pt
  void langTick
  const visible = canShow && !installed && !isStandalone

  const openAcessoModal = useCallback(() => {
    setStatusMsg('')
    setShowCard(true)
  }, [])

  const openInstallModal = useCallback(() => {
    setStatusMsg('')
    setShowCard(true)
  }, [])

  const handleCopy = async () => {
    const url = acessoUrl()
    try {
      await navigator.clipboard.writeText(url)
      setStatusMsg(t.copiado)
    } catch {
      setStatusMsg(t.copyFail)
    }
  }

  const handleShortcut = () => {
    const body = `[InternetShortcut]\r\nURL=${acessoUrl()}\r\n`
    const blob = new Blob([body], { type: 'application/internet-shortcut' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'NONATO SERVICE.url'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setStatusMsg(t.atalhoGuardado)
  }

  const handleOpenApp = () => {
    setShowCard(false)
    if (typeof window !== 'undefined') window.location.assign('/')
  }

  const contextValue = useMemo<InstallPromptContextValue>(
    () => ({
      canShow: visible,
      canShowAcesso: true,
      openInstallModal,
      openAcessoModal,
      installLabel: t.installApp,
      installDesc: t.installDesc,
      acessoLabel: t.acessoLabel,
      acessoDesc: t.acessoDesc,
    }),
    [visible, openInstallModal, openAcessoModal, t.installApp, t.installDesc, t.acessoLabel, t.acessoDesc]
  )

  return (
    <InstallPromptContext.Provider value={contextValue}>
      {children}
      {showCard && (
        <div data-ns-print-hide="1">
          <div
            role="dialog"
            aria-label={t.acessoTitle}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: 16,
              paddingBottom: 48,
              boxSizing: 'border-box',
            }}
            onClick={() => setShowCard(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#2a2a2a',
                borderRadius: 16,
                border: '2px solid #00ff00',
                padding: 24,
                maxWidth: 420,
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: '#00ff00', fontSize: 18 }}>🔗 {t.acessoTitle}</h3>
                <button
                  type="button"
                  onClick={() => setShowCard(false)}
                  aria-label={t.close}
                  style={{ background: 'transparent', border: 'none', color: '#b0b0b0', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
              <p style={{ color: '#ccc', fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>{t.acessoDesc}</p>

              <button type="button" onClick={handleOpenApp} style={btnMain}>
                {t.abrirSistema}
              </button>

              {deferredPrompt ? (
                <button type="button" onClick={handleInstall} style={btnMain}>
                  {t.installNow}
                </button>
              ) : installed || isStandalone ? (
                <p style={{ color: '#00c853', fontSize: 13, marginBottom: 12 }}>{t.jaInstalado}</p>
              ) : (
                <>
                  <p style={{ color: '#00c853', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>{t.addToHome}</p>
                  {isMobileOrTablet ? (
                    isIos ? (
                      <>
                        {!isSafari && (
                          <p style={{ color: '#ffd166', fontSize: 12, marginBottom: 8 }}>{t.iosSafariHint}</p>
                        )}
                        <p style={{ color: '#aaa', fontSize: 12, marginBottom: 12 }}>{t.iosHint}</p>
                      </>
                    ) : (
                      <p style={{ color: '#aaa', fontSize: 12, marginBottom: 12 }}>{t.androidHint}</p>
                    )
                  ) : (
                    <p style={{ color: '#aaa', fontSize: 12, marginBottom: 12 }}>{t.desktopHint}</p>
                  )}
                </>
              )}

              <button type="button" onClick={handleCopy} style={btnSec}>
                {t.copiarLigacao}
              </button>
              <button type="button" onClick={handleShortcut} style={btnSec}>
                {t.atalhoPc}
              </button>
              {statusMsg ? (
                <p style={{ color: '#00c853', fontSize: 13, margin: '0 0 10px', lineHeight: 1.4 }}>{statusMsg}</p>
              ) : null}

              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  width: '100%',
                  padding: 10,
                  background: 'transparent',
                  color: '#888',
                  border: '1px solid #555',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                {t.later}
              </button>
            </div>
          </div>
        </div>
      )}
    </InstallPromptContext.Provider>
  )
}

/** @deprecated Use InstallPromptProvider — mantido por compatibilidade */
export function InstallPrompt() {
  return <InstallPromptProvider>{null}</InstallPromptProvider>
}

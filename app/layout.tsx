import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AdicionarServicosStyle } from './AdicionarServicosStyle'
import { RegisterSW } from './RegisterSW'
import { OfflineIndicator } from './components/OfflineIndicator'
import { InstallPromptProvider } from './components/InstallPrompt'
import { NonatoDemoShell } from './components/NonatoDemoShell'
import { MobileBrowserZoomPan } from './components/MobileBrowserZoomPan'

// Evita pré-renderização pesada no build (reduz memória no Railway)
export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#00c853',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'NONATO SERVICE',
  description: 'Sistema de Gestão Técnica — funciona no telefone, tablet e notebook',
  manifest: '/manifest.json',
  /** Favicon / PWA: app/icon.svg + public/icon.svg (logo em public/brand/nonato-logo-original.png) */
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NONATO SERVICE',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var w=window.innerWidth||document.documentElement.clientWidth||1025;if(w<=1024){document.documentElement.classList.add('app-compact-layout-early');}}catch(e){}})();`,
          }}
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NONATO SERVICE" />
        <meta name="theme-color" content="#00c853" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body suppressHydrationWarning>
        <InstallPromptProvider>
          {children}
        </InstallPromptProvider>
        <AdicionarServicosStyle />
        <RegisterSW />
        <OfflineIndicator />
        <NonatoDemoShell />
        <MobileBrowserZoomPan />
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AdicionarServicosStyle } from './AdicionarServicosStyle'
import { RegisterSW } from './RegisterSW'
import { OfflineIndicator } from './components/OfflineIndicator'
import { InstallPrompt } from './components/InstallPrompt'

// Evita pré-renderização pesada no build (reduz memória no Railway)
export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  themeColor: '#000000', // preto no telemóvel para não ficar "tela verde" na barra de estado
}

export const metadata: Metadata = {
  title: 'Gestão Técnica da Nonato Service',
  description: 'Sistema de Gestão Técnica',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nonato Service',
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
        <meta charSet="utf-8" />
        {/* Viewport otimizado para celular: evita zoom estranho e garante área útil */}
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover, height=device-height, interactive-widget=resizes-content" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nonato Service" />
      </head>
      <body suppressHydrationWarning className="nonato-body">
        <div className="nonato-root" style={{ minHeight: '100%', minHeight: '100dvh', minHeight: '-webkit-fill-available', width: '100%', overflowX: 'hidden' }}>
          {children}
        </div>
        <AdicionarServicosStyle />
        <RegisterSW />
        <OfflineIndicator />
        <InstallPrompt />
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AdicionarServicosStyle } from './AdicionarServicosStyle'
import { RegisterSW } from './RegisterSW'
import { OfflineIndicator } from './components/OfflineIndicator'

// Evita pré-renderização pesada no build (reduz memória no Railway)
export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  themeColor: '#00ff00',
}

export const metadata: Metadata = {
  title: 'Gestão Técnica da Nonato Service',
  description: 'Sistema de Gestão Técnica — funciona no telefone, tablet e notebook',
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
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nonato Service" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <AdicionarServicosStyle />
        <RegisterSW />
        <OfflineIndicator />
      </body>
    </html>
  )
}

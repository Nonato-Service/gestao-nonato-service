import type { Metadata } from 'next'
import './globals.css'
import { AdicionarServicosStyle } from './AdicionarServicosStyle'
import { RegisterSW } from './RegisterSW'
import { OfflineIndicator } from './components/OfflineIndicator'

export const metadata: Metadata = {
  title: 'Gestão Técnica da Nonato Service',
  description: 'Sistema de Gestão Técnica',
  manifest: '/manifest.json',
  themeColor: '#00ff00',
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00ff00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nonato Service" />
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

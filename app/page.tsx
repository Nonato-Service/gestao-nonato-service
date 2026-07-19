'use client'

import dynamic from 'next/dynamic'
import { isWarmSessionResume } from './utils/syncRevision'

const warmSessionResume = typeof window !== 'undefined' && isWarmSessionResume()

const NonatoMainApp = dynamic(() => import('./NonatoMainApp'), {
  ssr: false,
  loading: () =>
    warmSessionResume ? null : (
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
        <p style={{ margin: 0, fontSize: 14, opacity: 0.75 }}>A carregar…</p>
      </div>
    ),
})

export default function Page() {
  return <NonatoMainApp />
}

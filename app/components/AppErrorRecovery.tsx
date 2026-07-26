'use client'

import React from 'react'
import { clearLastAuthUser, clearWarmSessionMarkers } from '../utils/syncRevision'

type Props = { children: React.ReactNode }

type State = { hasError: boolean; message: string }

export class AppErrorRecovery extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown) {
    console.error('[Nonato] Erro fatal na interface:', error)
  }

  private handleClearCacheAndReload = () => {
    try {
      clearLastAuthUser()
      clearWarmSessionMarkers()
      sessionStorage.removeItem('nonato-boot-crash-ts')
      sessionStorage.removeItem('nonato-pwa-update-dismissed-v162')
      sessionStorage.removeItem('nonato-pwa-update-dismissed-v163')
    } catch {
      /* ignorar */
    }
    window.location.href = `${window.location.pathname}${window.location.search}`
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          background: '#1a1a1a',
          color: '#f5f5f5',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>Não foi possível abrir o programa</h1>
        <p style={{ margin: 0, maxWidth: 520, opacity: 0.85, lineHeight: 1.5 }}>
          Ocorreu um erro ao carregar a aplicação. Isto pode ser cache antigo no telemóvel ou tablet.
        </p>
        {this.state.message ? (
          <p style={{ margin: 0, fontSize: 13, opacity: 0.55, maxWidth: 520, wordBreak: 'break-word' }}>
            {this.state.message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={this.handleClearCacheAndReload}
          style={{
            marginTop: 8,
            padding: '14px 22px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #00aa00 0%, #006600 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Limpar cache e tentar de novo
        </button>
      </div>
    )
  }
}

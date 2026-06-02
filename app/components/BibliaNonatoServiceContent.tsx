'use client'

import React, { useCallback } from 'react'

/** Chave de armazenamento no servidor (API /api/data) — mantida para compatibilidade. */
export const BIBLIA_NONATO_STORAGE_KEY = 'nonato-biblia-nonato-service'

type BibliaNonatoServiceContentProps = {
  t: Record<string, string | undefined>
  onClose: () => void
  onHome: () => void
}

/**
 * Bíblia integrada no Gestão: mesma interface que a app pessoal (public/biblia-app),
 * com sincronização automática via servidor quando hospedada.
 */
export function BibliaNonatoServiceContent({ t, onClose, onHome }: BibliaNonatoServiceContentProps) {
  const tr = useCallback((k: string, fb: string) => String(t[k] ?? fb), [t])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: '#0f0f10',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
            {tr('bibliaNonatoServiceTitle', 'BÍBLIA DA NONATO SERVICE')}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            {tr(
              'bibliaNonatoServiceSubtitle',
              'Categorias, fabricantes e modelos — software, mecânica e eletricidade'
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={onHome}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              background: 'transparent',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            {tr('paginaInicial', 'Página Inicial')}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#fca5a5',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>
      <iframe
        title={tr('bibliaNonatoServiceTitle', 'Bíblia da Nonato Service')}
        src="/biblia-app/?embedded=1"
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          minHeight: 'min(72vh, 900px)',
          background: '#1a1a1c',
        }}
      />
    </div>
  )
}

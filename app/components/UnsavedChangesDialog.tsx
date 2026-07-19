'use client'

import { useEffect, useRef, useState } from 'react'
import {
  setUnsavedChangesDialogHandler,
  type UnsavedLeaveAction,
} from '../utils/unsavedChangesGuard'
import { getStoredUiString } from '../translations'

type Pending = {
  labels: string[]
  resolve: (action: UnsavedLeaveAction) => void
}

export function UnsavedChangesDialog() {
  const [pending, setPending] = useState<Pending | null>(null)
  const pendingRef = useRef<Pending | null>(null)

  useEffect(() => {
    setUnsavedChangesDialogHandler((labels) => {
      return new Promise<UnsavedLeaveAction>((resolve) => {
        const p = { labels, resolve }
        pendingRef.current = p
        setPending(p)
      })
    })
    return () => setUnsavedChangesDialogHandler(null)
  }, [])

  const finish = (action: UnsavedLeaveAction) => {
    const p = pendingRef.current
    pendingRef.current = null
    setPending(null)
    p?.resolve(action)
  }

  if (!pending) return null

  const labelText = pending.labels.join(', ')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100001,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={() => finish('cancel')}
    >
      <div
        style={{
          background: '#1a2220',
          border: '1px solid rgba(0, 200, 83, 0.45)',
          borderRadius: 12,
          padding: '22px 24px',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
          color: '#fff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="unsaved-changes-title" style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700 }}>
          {getStoredUiString('unsavedChangesTitle', 'Guardar alterações?')}
        </h2>
        <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.5, opacity: 0.92 }}>
          {getStoredUiString(
            'unsavedChangesBody',
            'Tem alterações não guardadas em: {labels}. Deseja guardar antes de sair?'
          ).replace('{labels}', labelText)}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', padding: '11px 16px', fontWeight: 700 }}
            onClick={() => finish('save')}
          >
            {getStoredUiString('unsavedChangesSave', 'Guardar')}
          </button>
          <button
            type="button"
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: 6,
              border: '1px solid rgba(255,120,80,0.55)',
              background: 'rgba(180,60,40,0.25)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            onClick={() => finish('discard')}
          >
            {getStoredUiString('unsavedChangesDiscard', 'Sair sem guardar')}
          </button>
          <button
            type="button"
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#ddd',
              cursor: 'pointer',
            }}
            onClick={() => finish('cancel')}
          >
            {getStoredUiString('unsavedChangesCancel', 'Cancelar — continuar a editar')}
          </button>
        </div>
      </div>
    </div>
  )
}

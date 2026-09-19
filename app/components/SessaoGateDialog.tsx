'use client'

import React from 'react'

type Props = {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  variant?: 'sair' | 'acesso'
  busy?: boolean
  busyLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function SessaoGateDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  variant = 'sair',
  busy = false,
  busyLabel,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div
      className={`ns-sessao-gate ns-sessao-gate--${variant}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ns-sessao-gate-title"
      onClick={() => {
        if (!busy) onCancel()
      }}
    >
      <div className="ns-sessao-gate__card" onClick={(e) => e.stopPropagation()}>
        <div className="ns-sessao-gate__icon" aria-hidden>
          {variant === 'acesso' ? '🔐' : '🚪'}
        </div>
        <h2 id="ns-sessao-gate-title" className="ns-sessao-gate__title">
          {title}
        </h2>
        <p className="ns-sessao-gate__body">{body}</p>
        <div className="ns-sessao-gate__actions">
          <button
            type="button"
            className={`ns-sessao-gate__confirm${variant === 'acesso' ? ' ns-sessao-gate__confirm--acesso' : ''}`}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? busyLabel || confirmLabel : confirmLabel}
          </button>
          <button
            type="button"
            className="ns-sessao-gate__cancel"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

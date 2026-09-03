'use client'

import React from 'react'

export type AdminSyncBatteryProgressProps = {
  percent: number
  /** Em curso (azul a «carregar»). */
  active: boolean
  /** Terminou com sucesso (verde). */
  done?: boolean
  label: string
  className?: string
}

/** Indicador estilo bateria: azul a carregar, verde concluído, % sempre visível. */
export function AdminSyncBatteryProgress({
  percent,
  active,
  done = false,
  label,
  className = '',
}: AdminSyncBatteryProgressProps) {
  const pct = Math.max(0, Math.min(100, Math.round(Number.isFinite(percent) ? percent : 0)))
  const isDone = done || pct >= 100
  const fillClass = isDone
    ? 'admin-sync-battery__fill admin-sync-battery__fill--done'
    : 'admin-sync-battery__fill admin-sync-battery__fill--charging'

  return (
    <div
      className={`admin-sync-battery${active || isDone ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
    >
      <div className="admin-sync-battery__row">
        <div className="admin-sync-battery__shell" aria-hidden="true">
          <div className={fillClass} style={{ width: `${pct}%` }} />
        </div>
        <span className={`admin-sync-battery__pct${isDone ? ' admin-sync-battery__pct--done' : ''}`}>
          {pct}%
        </span>
      </div>
      <p className={`admin-sync-battery__label${isDone ? ' admin-sync-battery__label--done' : ''}`}>{label}</p>
    </div>
  )
}

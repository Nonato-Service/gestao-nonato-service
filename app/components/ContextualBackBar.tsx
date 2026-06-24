'use client'

import React from 'react'

type Props = {
  label: string
  onBack: () => void
  meta?: React.ReactNode
  className?: string
  compact?: boolean
}

export function ContextualBackBar({ label, onBack, meta, className, compact }: Props) {
  return (
    <div
      className={`ns-nav-back-bar${compact ? ' ns-nav-back-bar--compact' : ''}${className ? ` ${className}` : ''}`}
    >
      <button type="button" className="ns-nav-back-bar__btn" onClick={onBack}>
        ← {label}
      </button>
      {meta ? <div className="ns-nav-back-bar__meta">{meta}</div> : null}
    </div>
  )
}

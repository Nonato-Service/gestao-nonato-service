'use client'

import React from 'react'

type Props = {
  id: string
  icon: string
  title: string
  sub: string
  toneClass: string
  children: React.ReactNode
}

export function AdminDisclosure({ id, icon, title, sub, toneClass, children }: Props) {
  return (
    <details id={id} className={`admin-disclosure ${toneClass}`}>
      <summary>
        <span className="admin-disclosure__icon" aria-hidden>{icon}</span>
        <span className="admin-disclosure__meta">
          <span className="admin-disclosure__title">{title}</span>
          <span className="admin-disclosure__sub">{sub}</span>
        </span>
        <span className="admin-disclosure__chev ui-expand-chevron" aria-hidden>▶</span>
      </summary>
      <div className="admin-disclosure__body">{children}</div>
    </details>
  )
}

'use client'

import React, { useMemo } from 'react'

export { BIBLIA_NONATO_STORAGE_KEY } from './bibliaNonatoTypes'

type Props = {
  safeT: Record<string, string | undefined>
  closeTab: (tabId: string) => void
  activeTabId?: string
  onHome: () => void
  isCompactLayout?: boolean
  /** Mantidos por compatibilidade com page.tsx — a Bíblia sincroniza via /biblia-app/ */
  saveData?: (key: string, data: unknown) => Promise<void>
  loadData?: (key: string) => Promise<unknown>
}

export function BibliaNonatoServiceContent({ safeT }: Props) {
  const title = useMemo(
    () => String(safeT.bibliaNonatoServiceTitle ?? 'BÍBLIA DA NONATO SERVICE'),
    [safeT]
  )

  return (
    <div className="biblia-embed-root">
      <iframe
        className="biblia-embed-frame"
        src="/biblia-app/index.html?embedded=1"
        title={title}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}

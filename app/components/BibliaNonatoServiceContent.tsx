'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { useWritingAssistField } from '../context/WritingAssistFieldContext'

export { BIBLIA_NONATO_STORAGE_KEY } from './bibliaNonatoTypes'

type Props = {
  safeT: Record<string, string | undefined>
  locale?: string
  closeTab: (tabId: string) => void
  activeTabId?: string
  onHome: () => void
  isCompactLayout?: boolean
  saveData?: (key: string, data: unknown) => Promise<void>
  loadData?: (key: string) => Promise<unknown>
}

type BibliaTranslateRequest = {
  type: 'nonato-biblia-translate-request'
  text: string
  callbackId: string
}

export function BibliaNonatoServiceContent({ safeT, locale = 'pt-BR' }: Props) {
  const { openForField } = useWritingAssistField()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const title = useMemo(
    () => String(safeT.bibliaNonatoServiceTitle ?? 'BÍBLIA DA NONATO SERVICE'),
    [safeT]
  )

  const iframeSrc = useMemo(
    () => `/biblia-app/index.html?embedded=1&lang=${encodeURIComponent(locale)}`,
    [locale]
  )

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const postLocale = () => {
      try {
        iframe.contentWindow?.postMessage(
          { type: 'nonato-biblia-set-locale', locale },
          window.location.origin
        )
      } catch {
        /* cross-origin until load */
      }
    }

    iframe.addEventListener('load', postLocale)
    postLocale()
    return () => iframe.removeEventListener('load', postLocale)
  }, [locale, iframeSrc])

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return
      const data = ev.data as Partial<BibliaTranslateRequest> | null
      if (!data || data.type !== 'nonato-biblia-translate-request') return
      const text = String(data.text || '').trim()
      const callbackId = String(data.callbackId || '')
      if (!callbackId) return

      openForField(text, (translated) => {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: 'nonato-biblia-translate-result',
            callbackId,
            translated: String(translated || ''),
          },
          window.location.origin
        )
      })
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [openForField])

  return (
    <div className="biblia-embed-root">
      <iframe
        ref={iframeRef}
        className="biblia-embed-frame"
        src={iframeSrc}
        title={title}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}

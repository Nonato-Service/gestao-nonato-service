'use client'

import React, { useEffect, useRef, useState } from 'react'

type Props = {
  bytes: Uint8Array
  path: string
  entryPaths: string[]
  onNavigate: (path: string) => void
  tr: (key: string, fallback: string) => string
  /** URL blob com application/pdf — fallback se pdf.js falhar */
  fallbackBlobUrl?: string | null
}

function normalizePathPart(part: string): string {
  return decodeURIComponent(part.trim().replace(/\\/g, '/'))
}

/** Resolve ligações relativas do PDF (ex.: Elektrik/Index.PDF) para um ficheiro dentro do ZIP. */
export function resolveZipEntryPath(
  currentPath: string,
  linkTarget: string,
  entryPaths: string[]
): string | null {
  const raw = normalizePathPart(linkTarget.split('#')[0].split('?')[0])
  if (!raw) return null

  const lowerPaths = entryPaths.map((p) => ({ p, l: p.toLowerCase() }))
  const rawLower = raw.toLowerCase()

  const direct = lowerPaths.find((x) => x.l === rawLower)
  if (direct) return direct.p

  const base = rawLower.split('/').pop() || rawLower
  const byBase = lowerPaths.filter((x) => x.l.split('/').pop() === base)
  if (byBase.length === 1) return byBase[0].p

  const dir = currentPath.includes('/') ? currentPath.replace(/\/[^/]+$/, '/') : ''
  const combined = normalizePathPart(`${dir}${raw}`).replace(/\/+/g, '/')
  const comb = lowerPaths.find((x) => x.l === combined.toLowerCase())
  if (comb) return comb.p

  const ends = lowerPaths.filter(
    (x) => x.l.endsWith(`/${rawLower}`) || x.l.endsWith(rawLower) || x.l.includes(`/${rawLower}`)
  )
  if (ends.length === 1) return ends[0].p

  const keyword = rawLower.replace(/\.(pdf|html?)$/i, '')
  if (keyword.length >= 4) {
    const kw = lowerPaths.filter((x) => x.l.includes(keyword) && x.l.endsWith('.pdf'))
    if (kw.length === 1) return kw[0].p
  }

  return null
}

async function handleAnnotationLink(
  ann: {
    url?: string | null
    unsafeUrl?: string | null
    dest?: unknown
    titleObj?: { str?: string }
  },
  currentPath: string,
  entryPaths: string[],
  onNavigate: (path: string) => void,
  pdf: { getDestination: (id: unknown) => Promise<unknown>; getPageIndex: (ref: unknown) => Promise<number> }
): Promise<boolean> {
  const title = ann.titleObj?.str?.trim() || ''
  const url = (ann.url || ann.unsafeUrl || '').trim()
  if (url) {
    if (/^https?:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return true
    }
    const resolved = resolveZipEntryPath(currentPath, url, entryPaths)
    if (resolved) {
      onNavigate(resolved)
      return true
    }
    const blob = `${url} ${title}`.toLowerCase()
    if (/elektr|eletric|electric|elektro/.test(blob)) {
      const target = entryPaths.find((p) => /elektr|eletric|electric|elektro/i.test(p) && /\.pdf$/i.test(p))
      if (target) {
        onNavigate(target)
        return true
      }
    }
    if (/mechan|mecan|mechanik/.test(blob)) {
      const target = entryPaths.find((p) => /mechan|mecan|mechanik/i.test(p) && /\.pdf$/i.test(p))
      if (target) {
        onNavigate(target)
        return true
      }
    }
  }

  if (title && /\.(pdf|htm|html)$/i.test(title)) {
    const resolved = resolveZipEntryPath(currentPath, title, entryPaths)
    if (resolved) {
      onNavigate(resolved)
      return true
    }
  }

  if (ann.dest) {
    try {
      const dest = await pdf.getDestination(ann.dest)
      if (Array.isArray(dest) && dest[0]) {
        const pageIndex = await pdf.getPageIndex(dest[0] as never)
        const el = document.querySelector(`[data-zip-pdf-page="${pageIndex + 1}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return true
      }
    } catch {
      /* ignorar destinos inválidos */
    }
  }

  return false
}

let pdfjsWorkerConfigured = false

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  if (!pdfjsWorkerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    pdfjsWorkerConfigured = true
  }
  return pdfjs
}

export function ManuaisZipPdfPreview(props: Props) {
  const { bytes, path, entryPaths, onNavigate, tr, fallbackBlobUrl } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const onNavigateRef = useRef(onNavigate)
  const entryPathsRef = useRef(entryPaths)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useFallback, setUseFallback] = useState(false)

  onNavigateRef.current = onNavigate
  entryPathsRef.current = entryPaths

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setUseFallback(false)

    const container = containerRef.current
    if (container) container.innerHTML = ''

    ;(async () => {
      try {
        const pdfjs = await loadPdfJs()
        const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise
        if (cancelled) {
          await pdf.destroy()
          return
        }

        const host = containerRef.current
        if (!host) {
          await pdf.destroy()
          return
        }

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          if (cancelled) return

          const scale = 1.12
          const viewport = page.getViewport({ scale })

          const pageWrap = document.createElement('div')
          pageWrap.className = 'manuais-pro__zip-pdf-page'
          pageWrap.dataset.zipPdfPage = String(pageNum)

          const canvas = document.createElement('canvas')
          canvas.className = 'manuais-pro__zip-pdf-canvas'
          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)

          await page.render({ canvasContext: ctx, viewport }).promise
          if (cancelled) return

          pageWrap.appendChild(canvas)

          const linkLayer = document.createElement('div')
          linkLayer.className = 'manuais-pro__zip-pdf-links'
          linkLayer.style.width = `${viewport.width}px`
          linkLayer.style.height = `${viewport.height}px`

          const annotations = await page.getAnnotations()
          for (const ann of annotations) {
            if (ann.subtype !== 'Link' || !ann.rect) continue
            const rect = viewport.convertToViewportRectangle(ann.rect)
            const left = Math.min(rect[0], rect[2])
            const top = Math.min(rect[1], rect[3])
            const width = Math.max(4, Math.abs(rect[2] - rect[0]))
            const height = Math.max(4, Math.abs(rect[3] - rect[1]))

            const btn = document.createElement('button')
            btn.type = 'button'
            btn.className = 'manuais-pro__zip-pdf-link'
            btn.style.left = `${left}px`
            btn.style.top = `${top}px`
            btn.style.width = `${width}px`
            btn.style.height = `${height}px`
            btn.setAttribute(
              'aria-label',
              ann.titleObj?.str || ann.url || 'Ligação do manual'
            )
            btn.onclick = (e) => {
              e.preventDefault()
              void handleAnnotationLink(
                ann,
                path,
                entryPathsRef.current,
                onNavigateRef.current,
                pdf
              )
            }
            linkLayer.appendChild(btn)
          }

          pageWrap.appendChild(linkLayer)
          host.appendChild(pageWrap)
        }

        await pdf.destroy()
      } catch (err) {
        if (!cancelled) {
          if (fallbackBlobUrl) {
            setUseFallback(true)
          } else {
            setError(err instanceof Error ? err.message : String(err))
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [bytes, path, fallbackBlobUrl])

  return (
    <div className="manuais-pro__zip-pdf-wrap">
      {loading ? (
        <p className="manuais-pro__preview-status manuais-pro__zip-pdf-loading">
          {tr('bibliaPreviewCarregando', 'A carregar conteúdo…')}
        </p>
      ) : null}
      {error ? (
        <p className="manuais-pro__preview-status manuais-pro__preview-status--warn">
          {tr('manuaisZipPdfErro', 'Não foi possível renderizar o PDF com ligações.')}
          {error ? ` (${error})` : ''}
        </p>
      ) : null}
      {useFallback && fallbackBlobUrl ? (
        <>
          <p className="manuais-pro__preview-status" style={{ marginBottom: 8, fontSize: '0.8rem' }}>
            {tr(
              'manuaisZipPdfFallback',
              'Modo simples (sem ligações Elétrica/Mecânica no PDF). Use os botões Índice / Elétrica / Mecânica acima.'
            )}
          </p>
          <iframe
            className="manuais-pro__preview-frame"
            src={`${fallbackBlobUrl}#toolbar=1&navpanes=0`}
            title={path}
          />
        </>
      ) : (
        <div
          ref={containerRef}
          className="manuais-pro__zip-pdf-scroll"
          aria-label={tr('manuaisZipPdfViewer', 'Visualizador PDF do ZIP')}
          style={{ display: loading || error ? 'none' : 'block' }}
        />
      )}
    </div>
  )
}

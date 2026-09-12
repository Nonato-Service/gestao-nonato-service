'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  cleanLinkTarget,
  findManualSectionPdf,
  resolveZipEntryPath,
  type ManualSection,
} from '../modules/manuais'

export type { ManualSection }
export { findManualSectionPdf, resolveZipEntryPath }

type Props = {
  bytes: Uint8Array
  path: string
  entryPaths: string[]
  onNavigate: (path: string) => void
  tr: (key: string, fallback: string) => string
  fallbackBlobUrl?: string | null
}

function extractAnnotationTargets(ann: Record<string, unknown>): string[] {
  const out: string[] = []
  const push = (v: unknown) => {
    if (typeof v === 'string' && v.trim()) out.push(v.trim())
  }
  push(ann.unsafeUrl)
  push(ann.url)
  const titleObj = ann.titleObj as { str?: string } | undefined
  push(titleObj?.str)
  const contentsObj = ann.contentsObj as { str?: string } | undefined
  push(contentsObj?.str)
  push(ann.attachment)
  return out
}

function targetLooksLikeSection(target: string, section: ManualSection): boolean {
  const blob = cleanLinkTarget(target).toLowerCase()
  if (section === 'eletrica') {
    return /elektr|eletric|electric|elektro|(^|[\\/])el[\.\-_/\\]/.test(blob)
  }
  return /mechan|mecan|mechanik|(^|[\\/])mk[\.\-_/\\]/.test(blob)
}

async function handleAnnotationLink(
  ann: Record<string, unknown>,
  currentPath: string,
  entryPaths: string[],
  onNavigate: (path: string) => void,
  pdf: { getDestination: (id: unknown) => Promise<unknown>; getPageIndex: (ref: unknown) => Promise<number> },
  sectionHint?: ManualSection | null
): Promise<boolean> {
  if (sectionHint) {
    const hinted = findManualSectionPdf(entryPaths, sectionHint)
    if (hinted) {
      onNavigate(hinted)
      return true
    }
  }

  for (const rawTarget of extractAnnotationTargets(ann)) {
    const target = cleanLinkTarget(rawTarget)
    if (/^https?:\/\//i.test(rawTarget)) {
      window.open(rawTarget, '_blank', 'noopener,noreferrer')
      return true
    }
    if (/^file:/i.test(rawTarget) && !target) continue

    const resolved = resolveZipEntryPath(currentPath, target, entryPaths)
    if (resolved) {
      onNavigate(resolved)
      return true
    }
    if (targetLooksLikeSection(target, 'eletrica')) {
      const t = findManualSectionPdf(entryPaths, 'eletrica')
      if (t) {
        onNavigate(t)
        return true
      }
    }
    if (targetLooksLikeSection(target, 'mecanica')) {
      const t = findManualSectionPdf(entryPaths, 'mecanica')
      if (t) {
        onNavigate(t)
        return true
      }
    }
  }

  const dest = ann.dest
  if (dest) {
    try {
      const resolvedDest = await pdf.getDestination(dest)
      if (Array.isArray(resolvedDest) && resolvedDest[0]) {
        const pageIndex = await pdf.getPageIndex(resolvedDest[0] as never)
        const el = document.querySelector(`[data-zip-pdf-page="${pageIndex + 1}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return true
      }
    } catch {
      /* ignorar */
    }
  }

  return false
}

function inferIndexSectionHints(
  links: Array<{ centerX: number; centerY: number; viewportWidth: number }>,
  indexPath: string
): Map<number, ManualSection> {
  const hints = new Map<number, ManualSection>()
  if (!/(^|\/)index\.pdf$/i.test(indexPath)) return hints

  const rightSide = links
    .map((l, i) => ({ ...l, i }))
    .filter((l) => l.centerX >= l.viewportWidth * 0.4)
    .sort((a, b) => a.centerX - b.centerX || a.centerY - b.centerY)

  if (rightSide.length >= 2) {
    hints.set(rightSide[rightSide.length - 2].i, 'mecanica')
    hints.set(rightSide[rightSide.length - 1].i, 'eletrica')
  } else if (rightSide.length === 1) {
    hints.set(rightSide[0].i, 'eletrica')
  }

  return hints
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

const MAX_PDFJS_PAGES = 12
const MAX_PDFJS_BYTES = 3 * 1024 * 1024

function preferNativePdfViewer(path: string, byteLength: number, numPages: number): boolean {
  if (numPages > MAX_PDFJS_PAGES) return true
  if (byteLength > MAX_PDFJS_BYTES) return true
  if (/(elektr|eletric|electric|elektro|mechan|mecan|mechanik)/i.test(path) && !/(^|\/)index\.pdf$/i.test(path)) {
    return true
  }
  return false
}

export function ManuaisZipPdfPreview(props: Props) {
  const { bytes, path, entryPaths, onNavigate, tr, fallbackBlobUrl } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfDocRef = useRef<{ getDestination: (id: unknown) => Promise<unknown>; getPageIndex: (ref: unknown) => Promise<number>; destroy: () => Promise<void> } | null>(null)
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

        if (preferNativePdfViewer(path, bytes.length, pdf.numPages)) {
          await pdf.destroy()
          if (fallbackBlobUrl) {
            setUseFallback(true)
          } else {
            setError('PDF demasiado grande para o visualizador interno.')
          }
          return
        }

        const host = containerRef.current
        if (!host) {
          await pdf.destroy()
          if (fallbackBlobUrl) setUseFallback(true)
          return
        }

        pdfDocRef.current = pdf
        let renderedPages = 0

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          if (cancelled) return

          const scale = 1.12
          const viewport = page.getViewport({ scale })
          const annotations = await page.getAnnotations()

          const linkMeta: Array<{ centerX: number; centerY: number; viewportWidth: number }> = []
          const linkAnnotations: Array<Record<string, unknown>> = []

          for (const ann of annotations) {
            if (ann.subtype !== 'Link' || !ann.rect) continue
            const rect = viewport.convertToViewportRectangle(ann.rect)
            const left = Math.min(rect[0], rect[2])
            const top = Math.min(rect[1], rect[3])
            const width = Math.max(4, Math.abs(rect[2] - rect[0]))
            const height = Math.max(4, Math.abs(rect[3] - rect[1]))
            linkMeta.push({
              centerX: left + width / 2,
              centerY: top + height / 2,
              viewportWidth: viewport.width,
            })
            linkAnnotations.push(ann as Record<string, unknown>)
          }

          const sectionHints =
            pageNum === 1 ? inferIndexSectionHints(linkMeta, path) : new Map<number, ManualSection>()

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

          linkAnnotations.forEach((ann, linkIdx) => {
            const rect = viewport.convertToViewportRectangle(ann.rect as number[])
            const left = Math.min(rect[0], rect[2])
            const top = Math.min(rect[1], rect[3])
            const width = Math.max(4, Math.abs(rect[2] - rect[0]))
            const height = Math.max(4, Math.abs(rect[3] - rect[1]))
            const sectionHint = sectionHints.get(linkIdx) ?? null

            const btn = document.createElement('button')
            btn.type = 'button'
            btn.className = 'manuais-pro__zip-pdf-link'
            if (sectionHint) btn.dataset.section = sectionHint
            btn.style.left = `${left}px`
            btn.style.top = `${top}px`
            btn.style.width = `${width}px`
            btn.style.height = `${height}px`
            const titleObj = ann.titleObj as { str?: string } | undefined
            btn.setAttribute(
              'aria-label',
              titleObj?.str ||
                (typeof ann.url === 'string' ? ann.url : '') ||
                (sectionHint === 'eletrica'
                  ? tr('manuaisZipNavEletrica', 'Elétrica')
                  : sectionHint === 'mecanica'
                    ? tr('manuaisZipNavMecanica', 'Mecânica')
                    : tr('manuaisZipPdfLink', 'Ligação do manual'))
            )
            btn.onclick = (e) => {
              e.preventDefault()
              e.stopPropagation()
              if (sectionHint) {
                const hinted = findManualSectionPdf(entryPathsRef.current, sectionHint)
                if (hinted) {
                  onNavigateRef.current(hinted)
                  return
                }
              }
              const livePdf = pdfDocRef.current
              if (!livePdf) return
              void handleAnnotationLink(
                ann,
                path,
                entryPathsRef.current,
                onNavigateRef.current,
                livePdf,
                sectionHint
              )
            }
            linkLayer.appendChild(btn)
          })

          pageWrap.appendChild(linkLayer)
          host.appendChild(pageWrap)
          renderedPages += 1
          if (pageNum === 1 && !cancelled) setLoading(false)
        }

        if (!cancelled && renderedPages === 0) {
          if (fallbackBlobUrl) setUseFallback(true)
          else setError('Não foi possível desenhar páginas do PDF.')
        }
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
      void pdfDocRef.current?.destroy()
      pdfDocRef.current = null
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

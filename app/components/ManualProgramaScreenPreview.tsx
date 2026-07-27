'use client'

import { useEffect, useState } from 'react'
import type { ManualProgramaPageDef } from '../lib/manualProgramaCatalog'
import { manualProgramaScreenshotUrl, MANUAL_SCREENSHOT_FILE } from '../lib/manualProgramaAssets'
import { previewConfigForPage } from '../lib/manualProgramaPreviews'
import { ManualProgramaLightbox } from './ManualProgramaLightbox'

type ManualProgramaScreenPreviewProps = {
  page: ManualProgramaPageDef
  title: string
  locale: string
  sidebarPath: string
  screenLabel: string
  simulatedNote: string
  realScreenNote: string
  realCaptureBadge: string
  zoomHint: string
  closeLightboxLabel: string
  loadingLabel?: string
}

export function ManualProgramaScreenPreview({
  page,
  title,
  locale,
  sidebarPath,
  screenLabel,
  simulatedNote,
  realScreenNote,
  realCaptureBadge,
  zoomHint,
  closeLightboxLabel,
  loadingLabel = 'A carregar captura…',
}: ManualProgramaScreenPreviewProps) {
  const config = previewConfigForPage(page, title)
  const screenshotUrl = manualProgramaScreenshotUrl(locale, page.id, MANUAL_SCREENSHOT_FILE)
  const previewKey = `${locale}/${page.id}`
  const [hasRealShot, setHasRealShot] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    setHasRealShot(true)
    setImageLoaded(false)
    setLightboxOpen(false)
  }, [previewKey])

  return (
    <>
      <figure className="manual-pro-v2-screen manual-pro-v3-screen">
        <figcaption className="manual-pro-v2-screen__caption manual-pro-v3-screen__caption">
          <span className="manual-pro-v2-screen__caption-label">{screenLabel}</span>
          <span className="manual-pro-v2-screen__caption-note">
            {hasRealShot ? realScreenNote : simulatedNote}
          </span>
        </figcaption>

        {hasRealShot ? (
          <div className="manual-pro-v3-device">
            <div className="manual-pro-v3-device__chrome">
              <span className="manual-pro-v3-device__dots" aria-hidden>
                <i className="manual-pro-v3-device__dot manual-pro-v3-device__dot--red" />
                <i className="manual-pro-v3-device__dot manual-pro-v3-device__dot--yellow" />
                <i className="manual-pro-v3-device__dot manual-pro-v3-device__dot--green" />
              </span>
              <span className="manual-pro-v3-device__url">{sidebarPath}</span>
              <span className="manual-pro-v3-device__badge">{realCaptureBadge}</span>
            </div>
            <button
              type="button"
              className="manual-pro-v3-device__viewport"
              onClick={() => imageLoaded && setLightboxOpen(true)}
              title={zoomHint}
              disabled={!imageLoaded}
            >
              {!imageLoaded ? (
                <span className="manual-pro-v3-device__loading" aria-live="polite">
                  <span className="manual-pro-v3-device__loading-spinner" aria-hidden />
                  <span>{loadingLabel}</span>
                  <strong>{title}</strong>
                </span>
              ) : null}
              <img
                key={previewKey}
                className={`manual-pro-v2-screen__shot manual-pro-v3-device__shot${imageLoaded ? ' manual-pro-v3-device__shot--ready' : ''}`}
                src={screenshotUrl}
                alt={`${screenLabel}: ${title}`}
                loading="eager"
                decoding="async"
                onLoad={() => {
                  setHasRealShot(true)
                  setImageLoaded(true)
                }}
                onError={() => {
                  setHasRealShot(false)
                  setImageLoaded(false)
                }}
              />
              {imageLoaded ? (
                <span className="manual-pro-v3-device__zoom" aria-hidden>
                  <span className="manual-pro-v3-device__zoom-icon">⤢</span>
                  <span>{zoomHint}</span>
                </span>
              ) : null}
            </button>
          </div>
        ) : (
          <div className={`manual-pro-page-preview manual-pro-page-preview--${config.layout}`} aria-hidden="true">
            <div className="manual-pro-page-preview__chrome">
              <span className="manual-pro-page-preview__dot manual-pro-page-preview__dot--red" />
              <span className="manual-pro-page-preview__dot manual-pro-page-preview__dot--yellow" />
              <span className="manual-pro-page-preview__dot manual-pro-page-preview__dot--green" />
              <span className="manual-pro-page-preview__path">{sidebarPath}</span>
            </div>
            <div className="manual-pro-page-preview__body">
              <aside className="manual-pro-page-preview__sidebar">
                <div className="manual-pro-page-preview__sidebar-item manual-pro-page-preview__sidebar-item--active">
                  <span>{page.icon}</span>
                  <span>{title}</span>
                </div>
                <div className="manual-pro-page-preview__sidebar-item">
                  <span>📂</span>
                  <span>Menu</span>
                </div>
                <div className="manual-pro-page-preview__sidebar-item">
                  <span>❓</span>
                  <span>F1</span>
                </div>
              </aside>
              <main className="manual-pro-page-preview__main">
                <div className="manual-pro-page-preview__toolbar">
                  <span>F1 · HELP</span>
                  <span>🏠 Início</span>
                </div>
                <div className="manual-pro-page-preview__hero">
                  <span className="manual-pro-page-preview__hero-icon">{page.icon}</span>
                  <div>
                    <strong>{title}</strong>
                    <small>{config.heroSub || 'Módulo selecionado'}</small>
                  </div>
                </div>
                <div className="manual-pro-page-preview__actions">
                  {config.actions.map((action, i) => (
                    <span
                      key={i}
                      className={
                        'manual-pro-page-preview__btn' +
                        (action.variant === 'ghost'
                          ? ' manual-pro-page-preview__btn--ghost'
                          : action.variant === 'gold'
                            ? ' manual-pro-page-preview__btn--gold'
                            : action.variant === 'purple'
                              ? ' manual-pro-page-preview__btn--purple'
                              : '')
                      }
                    >
                      {action.label}
                    </span>
                  ))}
                </div>
                <div
                  className={
                    'manual-pro-page-preview__content' +
                    (config.layout === 'catalog' ? ' manual-pro-page-preview__content--grid' : '') +
                    (config.layout === 'agenda' ? ' manual-pro-page-preview__content--agenda' : '')
                  }
                >
                  {config.blocks.map((block, i) => {
                    if (block.type === 'filter') {
                      return (
                        <div key={i} className="manual-pro-page-preview__filters">
                          <span />
                          <span />
                          <span />
                          <span className="manual-pro-page-preview__filters-search" />
                        </div>
                      )
                    }
                    if (block.type === 'stat') {
                      return <div key={i} className="manual-pro-page-preview__stat" />
                    }
                    if (block.type === 'card') {
                      return <div key={i} className="manual-pro-page-preview__card" />
                    }
                    return (
                      <div
                        key={i}
                        className={
                          'manual-pro-page-preview__row' +
                          (block.width === 'short' ? ' manual-pro-page-preview__row--short' : '')
                        }
                      />
                    )
                  })}
                </div>
              </main>
            </div>
          </div>
        )}
      </figure>

      <ManualProgramaLightbox
        open={lightboxOpen && hasRealShot && imageLoaded}
        src={screenshotUrl}
        alt={`${screenLabel}: ${title}`}
        closeLabel={closeLightboxLabel}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}

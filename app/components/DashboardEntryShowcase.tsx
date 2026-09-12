'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { buildShowcaseSlides } from '../modules/sidebar'
import { DashboardShowcaseSlideVisual } from './DashboardShowcaseSlideVisual'
import { ShowcaseTypingText } from './ShowcaseTypingText'

type Props = {
  safeT: Record<string, string | undefined>
  isCompactLayout?: boolean
  logoSlot?: React.ReactNode
  onEnter: () => void
  enterLabel: string
  note?: string
}

const SLIDE_INTERVAL_MS = 9000

export function DashboardEntryShowcase(props: Props) {
  const { safeT, isCompactLayout, logoSlot, onEnter, enterLabel, note } = props
  const t = safeT as Record<string, string | undefined>

  const slides = useMemo(() => buildShowcaseSlides(t), [t])

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  const go = useCallback(
    (next: number, dir?: 'next' | 'prev') => {
      if (dir) setDirection(dir)
      setIndex((next + slides.length) % slides.length)
      setProgress(0)
    },
    [slides.length]
  )

  useEffect(() => {
    if (paused || slides.length <= 1) return
    const stepMs = 50
    const timer = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + (stepMs / SLIDE_INTERVAL_MS) * 100
        if (next >= 100) {
          setDirection('next')
          setIndex((cur) => (cur + 1) % slides.length)
          return 0
        }
        return next
      })
    }, stepMs)
    return () => window.clearInterval(timer)
  }, [paused, slides.length, index])

  const current = slides[index]
  const badge =
    t?.dashboardShowcaseBadge || t?.dashboardEntradaBadge || 'Nonato Service · Gestão Técnica'
  const headline = t?.title || 'GESTÃO TÉCNICA'
  const tagline = t?.welcomeText2 || 'Gerencie clientes, equipamentos, relatórios e muito mais num único lugar.'

  return (
    <div
      className={`ns-showcase ns-showcase--modern ns-showcase--cinematic${isCompactLayout ? ' ns-showcase--compact' : ''}`}
      style={{ '--ns-showcase-accent': current.accent } as React.CSSProperties}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="ns-showcase__backdrop" aria-hidden>
        <div className="ns-showcase__orb ns-showcase__orb--a" />
        <div className="ns-showcase__orb ns-showcase__orb--b" />
        <div className="ns-showcase__grid-lines" />
      </div>

      <div className="ns-showcase__layout">
        <section className="ns-showcase__hero" aria-labelledby="ns-showcase-headline">
          <div className="ns-showcase__brand-row">
            {logoSlot ? <div className="ns-showcase__logo">{logoSlot}</div> : null}
            <div className="ns-showcase__brand-copy">
              <span className="ns-showcase__badge">{badge}</span>
              <p className="ns-showcase__kicker">{t?.welcome || 'Sistema de Gestão Completo'}</p>
            </div>
          </div>

          <h1 id="ns-showcase-headline" className="ns-showcase__headline">
            {headline}
          </h1>
          <p className="ns-showcase__tagline">{tagline}</p>

          <div
            className="ns-showcase__module-grid"
            role="tablist"
            aria-label={t?.dashboardShowcaseModules || 'Módulos do sistema'}
          >
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={slide.title}
                className={`ns-showcase__module${i === index ? ' is-active' : ''}`}
                onClick={() => go(i, i >= index ? 'next' : 'prev')}
                style={{ '--module-accent': slide.accent } as React.CSSProperties}
              >
                <span className="ns-showcase__module-icon" aria-hidden>
                  {slide.icon}
                </span>
                <span className="ns-showcase__module-label">{slide.chip}</span>
              </button>
            ))}
          </div>

          <div className="ns-showcase__actions">
            <button type="button" className="btn-primary ns-showcase__cta" onClick={onEnter}>
              <span className="ns-showcase__cta-icon" aria-hidden>
                →
              </span>
              {enterLabel}
            </button>
            {note ? <p className="ns-showcase__note">{note}</p> : null}
          </div>

          <ul className="ns-showcase__trust" aria-label={t?.dashboardShowcaseTrustAria || 'Destaques'}>
            <li>
              <strong>{slides.length}</strong>
              <span>{t?.dashboardShowcaseModules || 'Módulos integrados'}</span>
            </li>
            <li>
              <strong>PDF</strong>
              <span>{t?.dashboardShowcaseTrustPdf || 'Relatórios profissionais'}</span>
            </li>
            <li>
              <strong>24/7</strong>
              <span>{t?.dashboardShowcaseTrustSync || 'Dados sincronizados'}</span>
            </li>
          </ul>
        </section>

        <section
          className="ns-showcase__preview"
          aria-label={t?.dashboardShowcaseAria || 'Demonstração das funcionalidades'}
        >
          <div className="ns-showcase__preview-shell ns-showcase__preview-shell--float">
            <header className="ns-showcase__preview-bar">
              <div className="ns-showcase__preview-dots" aria-hidden>
                <span />
                <span />
                <span />
              </div>
              <span className="ns-showcase__preview-chip">
                <span className="ns-showcase__preview-chip-dot ns-showcase-animate-pulse" aria-hidden />
                {current.highlight}
              </span>
              <span className="ns-showcase__preview-counter">
                {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
            </header>

            <div className="ns-showcase__preview-body">
              {slides.map((slide, i) => (
                <article
                  key={slide.id}
                  className={`ns-showcase__preview-slide ns-showcase__preview-slide--${direction}${
                    i === index ? ' is-active' : ''
                  }`}
                  aria-hidden={i !== index}
                >
                  <DashboardShowcaseSlideVisual visual={slide.id} live={i === index} />
                </article>
              ))}
              <div className="ns-showcase__preview-scanline" aria-hidden />
            </div>

            <footer className="ns-showcase__preview-footer">
              <div className="ns-showcase__preview-copy">
                <h2 className="ns-showcase__title" key={`title-${index}`}>
                  <ShowcaseTypingText text={current.title} active speed={22} delay={80} showCursor={false} />
                </h2>
                <p className="ns-showcase__desc" key={`desc-${index}`}>
                  <ShowcaseTypingText text={current.desc} active speed={14} delay={420} showCursor={false} />
                </p>
              </div>
              <div className="ns-showcase__preview-nav">
                <button
                  type="button"
                  className="ns-showcase__nav-btn"
                  aria-label={t?.dashboardShowcaseNavPrev || 'Módulo anterior'}
                  onClick={() => go(index - 1, 'prev')}
                >
                  ‹
                </button>
                <div className="ns-showcase__progress" aria-hidden>
                  <span className="ns-showcase__progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <button
                  type="button"
                  className="ns-showcase__nav-btn"
                  aria-label={t?.dashboardShowcaseNavNext || 'Próximo módulo'}
                  onClick={() => go(index + 1, 'next')}
                >
                  ›
                </button>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </div>
  )
}

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardShowcaseSlideVisual } from './DashboardShowcaseSlideVisual'

type VisualId = 'reports' | 'clients' | 'parts' | 'knowledge' | 'warehouse' | 'finance'

type Slide = {
  id: VisualId
  title: string
  desc: string
  chip: string
  icon: string
  accent: string
  highlight: string
}

type Props = {
  safeT: Record<string, string | undefined>
  isCompactLayout?: boolean
  logoSlot?: React.ReactNode
  onEnter: () => void
  enterLabel: string
  note?: string
}

const SLIDE_INTERVAL_MS = 6000

export function DashboardEntryShowcase(props: Props) {
  const { safeT, isCompactLayout, logoSlot, onEnter, enterLabel, note } = props
  const t = safeT as Record<string, string | undefined>

  const slides: Slide[] = useMemo(
    () => [
      {
        id: 'reports',
        title: t?.dashboardShowcaseSlide1Title || 'Relatórios de serviço',
        desc:
          t?.dashboardShowcaseSlide1Desc ||
          'Protocolos visuais, peças utilizadas, PDF profissional e envio ao cliente — tudo num fluxo claro.',
        chip: t?.dashboardShowcaseChipReports || 'Relatórios',
        icon: '📋',
        accent: '#34d399',
        highlight: 'PDF e envio automático',
      },
      {
        id: 'clients',
        title: t?.dashboardShowcaseSlide2Title || 'Clientes e equipamentos',
        desc:
          t?.dashboardShowcaseSlide2Desc ||
          'Cadastro completo, histórico por cliente, IDs de equipamento e rastreio em tempo real.',
        chip: t?.dashboardShowcaseChipClients || 'Clientes',
        icon: '👥',
        accent: '#38bdf8',
        highlight: 'Histórico e equipamentos',
      },
      {
        id: 'parts',
        title: t?.dashboardShowcaseSlide3Title || 'Biblioteca de peças',
        desc:
          t?.dashboardShowcaseSlide3Desc ||
          'Catálogo organizado, importação por URL, numeração inteligente e imagens ampliadas.',
        chip: t?.dashboardShowcaseChipParts || 'Peças',
        icon: '🔧',
        accent: '#fbbf24',
        highlight: 'Stock e catálogo visual',
      },
      {
        id: 'knowledge',
        title: t?.dashboardShowcaseSlide4Title || 'Centro de conhecimento técnico',
        desc:
          t?.dashboardShowcaseSlide4Desc ||
          'Bíblia, manuais, PDFs e fichas técnicas unificados por família, marca e modelo.',
        chip: t?.dashboardShowcaseChipKnowledge || 'Conhecimento',
        icon: '📚',
        accent: '#a78bfa',
        highlight: 'Bíblia e manuais técnicos',
      },
      {
        id: 'warehouse',
        title: t?.dashboardShowcaseSlide5Title || 'Armazém e industrial',
        desc:
          t?.dashboardShowcaseSlide5Desc ||
          'Stock, separação de peças, ordens de preparação e almoxarifado ligados à operação.',
        chip: t?.dashboardShowcaseChipWarehouse || 'Armazém',
        icon: '🏭',
        accent: '#fb7185',
        highlight: 'Separação e stock',
      },
      {
        id: 'finance',
        title: t?.dashboardShowcaseSlide6Title || 'Finanças e comunicação',
        desc:
          t?.dashboardShowcaseSlide6Desc ||
          'Orçamentos, custos, mensagens internas e fecho financeiro com transparência.',
        chip: t?.dashboardShowcaseChipFinance || 'Finanças',
        icon: '💬',
        accent: '#2dd4bf',
        highlight: 'Orçamentos e mensagens',
      },
    ],
    [t]
  )

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  const go = useCallback(
    (next: number) => {
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
      className={`ns-showcase ns-showcase--modern${isCompactLayout ? ' ns-showcase--compact' : ''}`}
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
              <p className="ns-showcase__kicker">
                {t?.welcome || 'Sistema de Gestão Completo'}
              </p>
            </div>
          </div>

          <h1 id="ns-showcase-headline" className="ns-showcase__headline">
            {headline}
          </h1>
          <p className="ns-showcase__tagline">{tagline}</p>

          <div className="ns-showcase__module-grid" role="tablist" aria-label={t?.dashboardShowcaseModules || 'Módulos'}>
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={slide.title}
                className={`ns-showcase__module${i === index ? ' is-active' : ''}`}
                onClick={() => go(i)}
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

          <ul className="ns-showcase__trust" aria-label="Destaques">
            <li>
              <strong>6</strong>
              <span>{t?.dashboardShowcaseModules || 'Módulos integrados'}</span>
            </li>
            <li>
              <strong>PDF</strong>
              <span>Relatórios profissionais</span>
            </li>
            <li>
              <strong>24/7</strong>
              <span>Dados sincronizados</span>
            </li>
          </ul>
        </section>

        <section
          className="ns-showcase__preview"
          aria-label={t?.dashboardShowcaseAria || 'Demonstração das funcionalidades'}
        >
          <div className="ns-showcase__preview-shell">
            <header className="ns-showcase__preview-bar">
              <div className="ns-showcase__preview-dots" aria-hidden>
                <span />
                <span />
                <span />
              </div>
              <span className="ns-showcase__preview-chip">
                <span className="ns-showcase__preview-chip-dot" aria-hidden />
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
                  className={`ns-showcase__preview-slide${i === index ? ' is-active' : ''}`}
                  aria-hidden={i !== index}
                >
                  <DashboardShowcaseSlideVisual visual={slide.id} />
                </article>
              ))}
            </div>

            <footer className="ns-showcase__preview-footer">
              <div className="ns-showcase__preview-copy">
                <h2 className="ns-showcase__title">{current.title}</h2>
                <p className="ns-showcase__desc">{current.desc}</p>
              </div>
              <div className="ns-showcase__preview-nav">
                <button
                  type="button"
                  className="ns-showcase__nav-btn"
                  aria-label="Módulo anterior"
                  onClick={() => go(index - 1)}
                >
                  ‹
                </button>
                <div className="ns-showcase__progress" aria-hidden>
                  <span className="ns-showcase__progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <button
                  type="button"
                  className="ns-showcase__nav-btn"
                  aria-label="Próximo módulo"
                  onClick={() => go(index + 1)}
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

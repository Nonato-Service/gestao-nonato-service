'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardShowcaseSlideVisual } from './DashboardShowcaseSlideVisual'

type VisualId = 'reports' | 'clients' | 'parts' | 'knowledge' | 'warehouse' | 'finance'

type Slide = {
  id: string
  title: string
  desc: string
  visual: VisualId
  chip: string
  icon: string
}

type Props = {
  safeT: Record<string, string | undefined>
  isCompactLayout?: boolean
  logoSlot?: React.ReactNode
  onEnter: () => void
  enterLabel: string
  note?: string
}

const SLIDE_INTERVAL_MS = 5200

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
        visual: 'reports',
        chip: t?.dashboardShowcaseChipReports || 'Relatórios',
        icon: '📋',
      },
      {
        id: 'clients',
        title: t?.dashboardShowcaseSlide2Title || 'Clientes e equipamentos',
        desc:
          t?.dashboardShowcaseSlide2Desc ||
          'Cadastro completo, histórico por cliente, IDs de equipamento e rastreio em tempo real.',
        visual: 'clients',
        chip: t?.dashboardShowcaseChipClients || 'Clientes',
        icon: '👥',
      },
      {
        id: 'parts',
        title: t?.dashboardShowcaseSlide3Title || 'Biblioteca de peças',
        desc:
          t?.dashboardShowcaseSlide3Desc ||
          'Catálogo organizado, importação por URL, numeração inteligente e imagens ampliadas.',
        visual: 'parts',
        chip: t?.dashboardShowcaseChipParts || 'Peças',
        icon: '🔧',
      },
      {
        id: 'knowledge',
        title: t?.dashboardShowcaseSlide4Title || 'Centro de conhecimento técnico',
        desc:
          t?.dashboardShowcaseSlide4Desc ||
          'Bíblia, manuais, PDFs e fichas técnicas unificados por família, marca e modelo.',
        visual: 'knowledge',
        chip: t?.dashboardShowcaseChipKnowledge || 'Conhecimento',
        icon: '📚',
      },
      {
        id: 'warehouse',
        title: t?.dashboardShowcaseSlide5Title || 'Armazém e industrial',
        desc:
          t?.dashboardShowcaseSlide5Desc ||
          'Stock, separação de peças, ordens de preparação e almoxarifado ligados à operação.',
        visual: 'warehouse',
        chip: t?.dashboardShowcaseChipWarehouse || 'Armazém',
        icon: '🏭',
      },
      {
        id: 'finance',
        title: t?.dashboardShowcaseSlide6Title || 'Finanças e comunicação',
        desc:
          t?.dashboardShowcaseSlide6Desc ||
          'Orçamentos, custos, mensagens internas e fecho financeiro com transparência.',
        visual: 'finance',
        chip: t?.dashboardShowcaseChipFinance || 'Finanças',
        icon: '💬',
      },
    ],
    [t]
  )

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const go = useCallback(
    (next: number) => {
      setIndex((next + slides.length) % slides.length)
    },
    [slides.length]
  )

  useEffect(() => {
    if (paused || slides.length <= 1) return
    const timer = window.setInterval(() => {
      setIndex((cur) => (cur + 1) % slides.length)
    }, SLIDE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [paused, slides.length])

  const current = slides[index]

  return (
    <div
      className={`ns-showcase ns-showcase--cinema ns-showcase--clean${isCompactLayout ? ' ns-showcase--compact' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="ns-showcase__glow" aria-hidden />

      <header className="ns-showcase__topbar">
        {logoSlot ? <div className="ns-showcase__logo ns-showcase__logo--mini">{logoSlot}</div> : null}
        <div className="ns-showcase__topbar-meta">
          <span className="ns-showcase__badge">
            {t?.dashboardShowcaseBadge || t?.dashboardEntradaBadge || 'Nonato Service · Gestão Técnica'}
          </span>
          <span className="ns-showcase__counter">
            {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
        </div>
      </header>

      <div className="ns-showcase__cinema" aria-label={t?.dashboardShowcaseAria || 'Demonstração das funcionalidades'}>
        <div className="ns-showcase__stage">
          {slides.map((slide, i) => (
            <article
              key={slide.id}
              className={`ns-showcase__slide${i === index ? ' is-active' : ''}`}
              aria-hidden={i !== index}
            >
              <div className="ns-showcase__slide-frame">
                <DashboardShowcaseSlideVisual visual={slide.visual} />
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="ns-showcase__info" aria-live="polite">
        <h1 className="ns-showcase__title">{current.title}</h1>
        <p className="ns-showcase__desc">{current.desc}</p>
      </div>

      <footer className="ns-showcase__dock">
        <div className="ns-showcase__chips" role="tablist" aria-label={t?.dashboardShowcaseModules || 'Módulos'}>
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={slide.title}
              className={`ns-showcase__chip${i === index ? ' is-active' : ''}`}
              onClick={() => go(i)}
            >
              <span className="ns-showcase__chip-icon" aria-hidden>
                {slide.icon}
              </span>
              <span className="ns-showcase__chip-label">{slide.chip}</span>
            </button>
          ))}
        </div>

        <button type="button" className="btn-primary ns-showcase__cta" onClick={onEnter}>
          <span aria-hidden>→</span>
          {enterLabel}
        </button>

        {note ? <p className="ns-showcase__note">{note}</p> : null}
      </footer>
    </div>
  )
}

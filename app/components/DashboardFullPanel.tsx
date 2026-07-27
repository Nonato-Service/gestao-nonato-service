'use client'

import React from 'react'

type StatItem = {
  id: string
  action: string
  icon: string
  label: string
  value: number
  tone: 'green' | 'blue' | 'violet' | 'amber'
}

type Props = {
  safeT: Record<string, string | undefined>
  isCompactLayout?: boolean
  logoSlot: React.ReactNode
  stats: {
    clientes: number
    equipamentos: number
    relatorios: number
    gestores: number
  }
  onStatClick: (action: string) => void
  children?: React.ReactNode
}

export function DashboardFullPanel({
  safeT,
  isCompactLayout,
  logoSlot,
  stats,
  onStatClick,
  children,
}: Props) {
  const tr = safeT

  const statItems: StatItem[] = [
    {
      id: 'clientes',
      action: 'open-clientes',
      icon: '👥',
      label: tr.dashboardStatClientes || 'Clientes',
      value: stats.clientes,
      tone: 'green',
    },
    {
      id: 'equipamentos',
      action: 'open-equipamentos',
      icon: '⚙️',
      label: tr.dashboardStatEquipamentos || 'Equipamentos',
      value: stats.equipamentos,
      tone: 'blue',
    },
    {
      id: 'relatorios',
      action: 'open-relatorio-servico',
      icon: '📋',
      label: tr.dashboardStatRelatorios || 'Relatórios',
      value: stats.relatorios,
      tone: 'violet',
    },
    {
      id: 'gestores',
      action: 'open-gestores',
      icon: '👨‍💼',
      label: tr.dashboardStatGestores || 'Gestores',
      value: stats.gestores,
      tone: 'amber',
    },
  ]

  return (
    <div className="ns-dashboard-full">
      <header
        className={`ns-dashboard-full-hero${isCompactLayout ? ' ns-dashboard-full-hero--compact' : ''}`}
      >
        <div className="ns-dashboard-full-hero__backdrop" aria-hidden>
          <div className="ns-dashboard-full-hero__orb ns-dashboard-full-hero__orb--a" />
          <div className="ns-dashboard-full-hero__orb ns-dashboard-full-hero__orb--b" />
          <div className="ns-dashboard-full-hero__mesh" />
        </div>

        <div className="ns-dashboard-full-hero__inner">
          <div className="ns-dashboard-full-hero__brand-col">
            <div className="ns-dashboard-full-hero__logo">{logoSlot}</div>
            <span className="ns-dashboard-full-hero__badge">
              {tr.dashboardShowcaseBadge || 'Nonato Service · Gestão Técnica'}
            </span>
          </div>

          <div className="ns-dashboard-full-hero__copy">
            <p className="ns-dashboard-full-hero__eyebrow">
              {tr.welcomeDashboard || tr.welcome || 'Centro de comando da operação'}
            </p>
            <h1 className="ns-dashboard-full-title">{tr.title || 'Gestão Técnica'}</h1>
            <p className="ns-dashboard-full-lead">
              {tr.welcomeText2 ||
                'Utilize o menu lateral para aceder às funcionalidades disponíveis.'}
            </p>
          </div>
        </div>
      </header>

      <section className="ns-dashboard-stats-section" aria-labelledby="ns-dashboard-stats-heading">
        <div className="ns-dashboard-stats-section__head">
          <h2 id="ns-dashboard-stats-heading" className="ns-dashboard-stats-section__title">
            {tr.dashboardStatsTitle || 'Resumo operacional'}
          </h2>
          <p className="ns-dashboard-stats-section__hint">
            {tr.dashboardStatOpenHint || 'Clique num cartão para abrir a área correspondente'}
          </p>
        </div>

        <div className="ns-dashboard-stats">
          {statItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ns-dashboard-stat ns-dashboard-stat--${item.tone}`}
              onClick={() => onStatClick(item.action)}
            >
              <span className="ns-dashboard-stat__icon-wrap" aria-hidden>
                {item.icon}
              </span>
              <span className="ns-dashboard-stat__body">
                <span className="ns-dashboard-stat-label">{item.label}</span>
                <span className="ns-dashboard-stat-value">{item.value}</span>
              </span>
              <span className="ns-dashboard-stat__chev" aria-hidden>
                ›
              </span>
            </button>
          ))}
        </div>
      </section>

      {children}
    </div>
  )
}

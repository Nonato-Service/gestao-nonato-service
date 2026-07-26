'use client'

import { useMemo, useState } from 'react'
import {
  MANUAL_PROGRAMA_CHAPTERS,
  MANUAL_PROGRAMA_PAGES,
  type ManualProgramaPageDef,
} from '../lib/manualProgramaCatalog'
import { MANUAL_PROGRAMA_TRAIL } from '../lib/manualProgramaTrail'
import { parseHelpContent } from '../lib/parseHelpContent'
import { ManualProgramaScreenPreview } from './ManualProgramaScreenPreview'

type ManualProgramaContentProps = {
  tr: Record<string, string | undefined>
  getHelpContent: (helpKey: string, page: ManualProgramaPageDef) => string
  getTabTitle: (tabType: string) => string
  onOpenModule: (tabType: string, action: string) => void
  onClose: () => void
  onHome: () => void
}

function pickTr(tr: Record<string, string | undefined>, key: string, fallback: string): string {
  const v = tr[key]
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

function formatProgress(template: string, current: number, total: number): string {
  return template.replace('{current}', String(current)).replace('{total}', String(total))
}

export default function ManualProgramaContent({
  tr,
  getHelpContent,
  getTabTitle,
  onOpenModule,
  onClose,
  onHome,
}: ManualProgramaContentProps) {
  const firstPage = MANUAL_PROGRAMA_CHAPTERS[0]?.pages[0]
  const [selectedPageId, setSelectedPageId] = useState(firstPage?.id || 'dashboard')
  const [query, setQuery] = useState('')
  const [showTrail, setShowTrail] = useState(true)

  const pageIndex = useMemo(
    () => MANUAL_PROGRAMA_PAGES.findIndex((p) => p.id === selectedPageId),
    [selectedPageId]
  )

  const selectedPage = useMemo(() => {
    if (pageIndex >= 0) return MANUAL_PROGRAMA_PAGES[pageIndex]
    return firstPage
  }, [pageIndex, firstPage])

  const filteredChapters = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return MANUAL_PROGRAMA_CHAPTERS

    return MANUAL_PROGRAMA_CHAPTERS.map((chapter) => {
      const chapterTitle = pickTr(tr, chapter.titleKey, chapter.fallbackTitle).toLowerCase()
      const pages = chapter.pages.filter((page) => {
        const title = pickTr(tr, page.titleKey, page.fallbackTitle).toLowerCase()
        return (
          title.includes(q) ||
          chapterTitle.includes(q) ||
          page.sidebarPath.toLowerCase().includes(q) ||
          page.moduleTitle.toLowerCase().includes(q)
        )
      })
      if (pages.length === 0 && chapterTitle.includes(q)) return chapter
      if (pages.length === 0) return null
      return { ...chapter, pages }
    }).filter(Boolean) as typeof MANUAL_PROGRAMA_CHAPTERS
  }, [query, tr])

  const pageTitle = selectedPage ? pickTr(tr, selectedPage.titleKey, selectedPage.fallbackTitle) : ''

  const parsed = useMemo(() => {
    if (!selectedPage) {
      return { purpose: '', steps: [], sections: [] as Array<{ title: string; items: string[] }>, tips: [], warnings: [] }
    }
    return parseHelpContent(getHelpContent(selectedPage.helpKey, selectedPage))
  }, [selectedPage, getHelpContent])

  const canOpen = Boolean(selectedPage?.tabType)
  const totalPages = MANUAL_PROGRAMA_PAGES.length
  const currentNum = pageIndex >= 0 ? pageIndex + 1 : 1

  const goPrev = () => {
    if (pageIndex > 0) setSelectedPageId(MANUAL_PROGRAMA_PAGES[pageIndex - 1].id)
  }
  const goNext = () => {
    if (pageIndex >= 0 && pageIndex < MANUAL_PROGRAMA_PAGES.length - 1) {
      setSelectedPageId(MANUAL_PROGRAMA_PAGES[pageIndex + 1].id)
    }
  }

  let globalStep = 0

  return (
    <div className="manual-pro-root manual-pro-v2 tab-content-wrapper">
      <div className="mobile-sticky-toolbar">
        <button type="button" className="mobile-toolbar-btn mobile-toolbar-voltar" onClick={onClose}>
          ↶ {pickTr(tr, 'voltar', 'Voltar')}
        </button>
        <button
          type="button"
          className="mobile-toolbar-btn mobile-toolbar-home"
          onClick={onHome}
          title={pickTr(tr, 'paginaInicial', 'Página Inicial')}
        >
          🏠
        </button>
      </div>

      <header className="manual-pro-v2-hero">
        <div className="manual-pro-v2-hero__main">
          <span className="manual-pro-v2-hero__badge">{pickTr(tr, 'manualProV2Badge', 'Guia oficial')}</span>
          <h1>{pickTr(tr, 'manualProgramaTitle', 'Manual do Programa')}</h1>
          <p>
            {pickTr(
              tr,
              'manualProV2Subtitle',
              'Documentação profissional passo a passo de cada ecrã — com representação visual, objectivos claros e atalho directo para o módulo.'
            )}
          </p>
          <p className="manual-pro-v2-hero__langs">
            {pickTr(
              tr,
              'manualProLanguagesNote',
              'Disponível nos 6 idiomas do programa. Altere o idioma no menu lateral para ler neste manual.'
            )}
          </p>
        </div>
        <div className="manual-pro-v2-hero__stats">
          <div className="manual-pro-v2-stat">
            <strong>{MANUAL_PROGRAMA_CHAPTERS.length}</strong>
            <span>{pickTr(tr, 'manualProChapters', 'capítulos')}</span>
          </div>
          <div className="manual-pro-v2-stat">
            <strong>{totalPages}</strong>
            <span>{pickTr(tr, 'manualProPages', 'páginas')}</span>
          </div>
          <div className="manual-pro-v2-stat">
            <strong>6</strong>
            <span>{pickTr(tr, 'manualProV2LangCount', 'idiomas')}</span>
          </div>
        </div>
      </header>

      <section className="manual-pro-v2-trail">
        <button
          type="button"
          className="manual-pro-v2-trail__toggle"
          onClick={() => setShowTrail((v) => !v)}
          aria-expanded={showTrail}
        >
          <span>
            <strong>{pickTr(tr, 'manualProTrailTitle', 'Trilha recomendada')}</strong>
            <small>
              {pickTr(
                tr,
                'manualProTrailSubtitle',
                'Ordem sugerida para novos utilizadores — do primeiro acesso ao fecho financeiro.'
              )}
            </small>
          </span>
          <span className="manual-pro-v2-trail__chevron">{showTrail ? '▾' : '▸'}</span>
        </button>
        {showTrail ? (
          <ol className="manual-pro-v2-trail__list">
            {MANUAL_PROGRAMA_TRAIL.map((step, idx) => (
              <li key={step.id} className="manual-pro-v2-trail__item">
                <span className="manual-pro-v2-trail__num">{idx + 1}</span>
                <span className="manual-pro-v2-trail__icon" aria-hidden>
                  {step.icon}
                </span>
                <div>
                  <strong>{pickTr(tr, step.titleKey, step.fallbackTitle)}</strong>
                  <p>{pickTr(tr, step.descKey, step.fallbackDesc)}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      <div className="manual-pro-layout manual-pro-v2-layout">
        <nav className="manual-pro-nav manual-pro-v2-nav" aria-label={pickTr(tr, 'manualProNavLabel', 'Índice do manual')}>
          <label className="manual-pro-search">
            <span className="manual-pro-search__icon" aria-hidden>
              🔍
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={pickTr(tr, 'manualProSearchPlaceholder', 'Pesquisar módulo ou página…')}
            />
          </label>

          <div className="manual-pro-nav__list">
            {filteredChapters.map((chapter) => (
              <section key={chapter.id} className="manual-pro-nav__chapter">
                <h2>
                  <span aria-hidden>{chapter.icon}</span>
                  {pickTr(tr, chapter.titleKey, chapter.fallbackTitle)}
                </h2>
                <ul>
                  {chapter.pages.map((page) => {
                    const title = pickTr(tr, page.titleKey, page.fallbackTitle)
                    const active = page.id === selectedPageId
                    return (
                      <li key={page.id}>
                        <button
                          type="button"
                          className={`manual-pro-nav__item${active ? ' manual-pro-nav__item--active' : ''}`}
                          onClick={() => setSelectedPageId(page.id)}
                        >
                          <span className="manual-pro-nav__item-title">{title}</span>
                          <span className="manual-pro-nav__item-path">{page.sidebarPath}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        </nav>

        <article className="manual-pro-detail manual-pro-v2-detail">
          {!selectedPage ? (
            <p className="manual-pro-empty">{pickTr(tr, 'manualProEmpty', 'Selecione uma página no índice.')}</p>
          ) : (
            <>
              <div className="manual-pro-v2-detail__top">
                <div className="manual-pro-v2-progress">
                  {formatProgress(
                    pickTr(tr, 'manualProPageProgress', 'Página {current} de {total}'),
                    currentNum,
                    totalPages
                  )}
                </div>
                <div className="manual-pro-v2-pager">
                  <button type="button" className="btn-secondary manual-pro-v2-pager__btn" onClick={goPrev} disabled={pageIndex <= 0}>
                    ← {pickTr(tr, 'manualProPrevPage', 'Anterior')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary manual-pro-v2-pager__btn"
                    onClick={goNext}
                    disabled={pageIndex < 0 || pageIndex >= MANUAL_PROGRAMA_PAGES.length - 1}
                  >
                    {pickTr(tr, 'manualProNextPage', 'Seguinte')} →
                  </button>
                </div>
              </div>

              <div className="manual-pro-detail__head">
                <div>
                  <span className="manual-pro-detail__badge">{selectedPage.icon}</span>
                  <h2>{pageTitle}</h2>
                  <p className="manual-pro-detail__path">{selectedPage.sidebarPath}</p>
                </div>
                {canOpen && selectedPage.tabType ? (
                  <button
                    type="button"
                    className="btn-primary manual-pro-open-btn"
                    onClick={() => onOpenModule(selectedPage.tabType!, selectedPage.action)}
                  >
                    {pickTr(tr, 'manualProOpenModule', 'Abrir esta página')} → {getTabTitle(selectedPage.tabType!)}
                  </button>
                ) : selectedPage.action === 'open-diario-pedidos-dia' ? (
                  <p className="manual-pro-note">
                    {pickTr(tr, 'manualProDiarioNote', 'Abra pelo botão «Diário de anotação» na barra lateral (Gestão Técnica).')}
                  </p>
                ) : selectedPage.action === 'open-manual-gestor' ? (
                  <p className="manual-pro-note">
                    {pickTr(tr, 'manualProGestorNote', 'Abra em Extras › Manual de uso do gestor (PDF).')}
                  </p>
                ) : null}
              </div>

              <ManualProgramaScreenPreview
                page={selectedPage}
                title={pageTitle}
                screenLabel={pickTr(tr, 'manualProScreenLabel', 'Ecrã do módulo')}
                simulatedNote={pickTr(
                  tr,
                  'manualProScreenSimulated',
                  'Representação visual alinhada à interface real do sistema.'
                )}
              />

              <div className="manual-pro-v2-cards">
                <section className="manual-pro-v2-card manual-pro-v2-card--purpose">
                  <h3>{pickTr(tr, 'manualProPurposeCard', 'Objectivo desta página')}</h3>
                  <p>{parsed.purpose || pickTr(tr, 'helpDefault', 'Consulte o administrador para mais detalhes.')}</p>
                </section>

                <aside className="manual-pro-v2-card manual-pro-v2-card--f1">
                  <h3>{pickTr(tr, 'manualProOpenF1', 'Ajuda contextual (F1)')}</h3>
                  <p>
                    {pickTr(
                      tr,
                      'manualProOpenF1Desc',
                      'Dentro do módulo, prima F1 ou o botão HELP no topo — verá a mesma explicação actualizada no ecrã activo.'
                    )}
                  </p>
                </aside>
              </div>

              {parsed.warnings.length > 0 ? (
                <section className="manual-pro-v2-callout manual-pro-v2-callout--warn">
                  <h3>{pickTr(tr, 'manualProWarningLabel', 'Atenção')}</h3>
                  <ul>
                    {parsed.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="manual-pro-v2-card manual-pro-v2-card--steps">
                <h3>{pickTr(tr, 'manualProStepsCard', 'Procedimento passo a passo')}</h3>
                {parsed.sections.length > 0 ? (
                  parsed.sections.map((section, idx) => (
                    <div key={idx} className="manual-pro-v2-steps-block">
                      {section.title ? <h4 className="manual-pro-v2-steps-block__title">{section.title}</h4> : null}
                      <ol className="manual-pro-v2-steps">
                        {section.items.map((item, i) => {
                          globalStep += 1
                          const stepNum = globalStep
                          return (
                            <li key={i} className="manual-pro-v2-step">
                              <span className="manual-pro-v2-step__num">{stepNum}</span>
                              <span className="manual-pro-v2-step__text">{item}</span>
                            </li>
                          )
                        })}
                      </ol>
                    </div>
                  ))
                ) : parsed.steps.length > 0 ? (
                  <ol className="manual-pro-v2-steps">
                    {parsed.steps.map((step, i) => (
                      <li key={i} className="manual-pro-v2-step">
                        <span className="manual-pro-v2-step__num">{i + 1}</span>
                        <span className="manual-pro-v2-step__text">{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="manual-pro-note">
                    {pickTr(
                      tr,
                      'manualProNoSteps',
                      'Abra o módulo e prima F1 ou HELP no topo para ver a ajuda contextual desta página.'
                    )}
                  </p>
                )}
              </section>

              {parsed.tips.length > 0 ? (
                <section className="manual-pro-v2-callout manual-pro-v2-callout--tip">
                  <h3>{pickTr(tr, 'manualProTipLabel', 'Dica')}</h3>
                  <ul>
                    {parsed.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <footer className="manual-pro-footer manual-pro-v2-footer">
                <p>{pickTr(tr, 'manualProUpdatedNote', 'Conteúdo sincronizado com a versão actual do sistema e com a ajuda F1 de cada módulo.')}</p>
                <p>{pickTr(tr, 'manualProFooter', 'Dica: F1 e HELP mostram a mesma explicação no ecrã onde está.')}</p>
              </footer>
            </>
          )}
        </article>
      </div>
    </div>
  )
}

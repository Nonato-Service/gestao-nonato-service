'use client'

import { useMemo, useState } from 'react'
import {
  MANUAL_PROGRAMA_CHAPTERS,
  type ManualProgramaPageDef,
} from '../lib/manualProgramaCatalog'
import { parseHelpContent } from '../lib/parseHelpContent'

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

function ManualPagePreview({ page, title }: { page: ManualProgramaPageDef; title: string }) {
  return (
    <div className="manual-pro-page-preview" aria-hidden="true">
      <div className="manual-pro-page-preview__chrome">
        <span className="manual-pro-page-preview__dot manual-pro-page-preview__dot--red" />
        <span className="manual-pro-page-preview__dot manual-pro-page-preview__dot--yellow" />
        <span className="manual-pro-page-preview__dot manual-pro-page-preview__dot--green" />
        <span className="manual-pro-page-preview__path">{page.sidebarPath}</span>
      </div>
      <div className="manual-pro-page-preview__body">
        <aside className="manual-pro-page-preview__sidebar">
          <div className="manual-pro-page-preview__sidebar-item manual-pro-page-preview__sidebar-item--active">
            <span>{page.icon}</span>
            <span>{page.moduleTitle}</span>
          </div>
          <div className="manual-pro-page-preview__sidebar-item">
            <span>📋</span>
            <span>Menu lateral</span>
          </div>
        </aside>
        <main className="manual-pro-page-preview__main">
          <div className="manual-pro-page-preview__toolbar">
            <span>HELP</span>
            <span>🏠 Início</span>
          </div>
          <div className="manual-pro-page-preview__hero">
            <span className="manual-pro-page-preview__hero-icon">{page.icon}</span>
            <div>
              <strong>{title}</strong>
              <small>Módulo selecionado</small>
            </div>
          </div>
          <div className="manual-pro-page-preview__actions">
            <span className="manual-pro-page-preview__btn">+ Novo registo</span>
            <span className="manual-pro-page-preview__btn manual-pro-page-preview__btn--ghost">🔍 Pesquisar</span>
            <span className="manual-pro-page-preview__btn manual-pro-page-preview__btn--ghost">📄 Exportar</span>
          </div>
          <div className="manual-pro-page-preview__content">
            <div className="manual-pro-page-preview__row" />
            <div className="manual-pro-page-preview__row manual-pro-page-preview__row--short" />
            <div className="manual-pro-page-preview__row" />
          </div>
        </main>
      </div>
    </div>
  )
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

  const selectedPage = useMemo(() => {
    for (const chapter of MANUAL_PROGRAMA_CHAPTERS) {
      const hit = chapter.pages.find((p) => p.id === selectedPageId)
      if (hit) return hit
    }
    return firstPage
  }, [selectedPageId, firstPage])

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

  const pageTitle = selectedPage
    ? pickTr(tr, selectedPage.titleKey, selectedPage.fallbackTitle)
    : ''

  const parsed = useMemo(() => {
    if (!selectedPage) return { purpose: '', steps: [], sections: [] as Array<{ title: string; items: string[] }> }
    return parseHelpContent(getHelpContent(selectedPage.helpKey, selectedPage))
  }, [selectedPage, getHelpContent])

  const canOpen = Boolean(selectedPage?.tabType)

  return (
    <div className="manual-pro-root tab-content-wrapper">
      <div className="mobile-sticky-toolbar">
        <button type="button" className="mobile-toolbar-btn mobile-toolbar-voltar" onClick={onClose}>
          ↶ {pickTr(tr, 'voltar', 'Voltar')}
        </button>
        <button type="button" className="mobile-toolbar-btn mobile-toolbar-home" onClick={onHome} title={pickTr(tr, 'paginaInicial', 'Página Inicial')}>
          🏠
        </button>
      </div>

      <header className="manual-pro-header">
        <div>
          <h1>{pickTr(tr, 'manualProgramaTitle', 'Manual do Programa')}</h1>
          <p>
            {pickTr(
              tr,
              'manualProSubtitle',
              'Guia passo a passo de cada página: o que é, como usar e atalho para abrir o módulo real.'
            )}
          </p>
        </div>
        <div className="manual-pro-header__meta">
          <span>{MANUAL_PROGRAMA_CHAPTERS.length} {pickTr(tr, 'manualProChapters', 'capítulos')}</span>
          <span>{MANUAL_PROGRAMA_CHAPTERS.reduce((n, c) => n + c.pages.length, 0)} {pickTr(tr, 'manualProPages', 'páginas')}</span>
        </div>
      </header>

      <div className="manual-pro-layout">
        <nav className="manual-pro-nav" aria-label={pickTr(tr, 'manualProNavLabel', 'Índice do manual')}>
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

        <article className="manual-pro-detail">
          {!selectedPage ? (
            <p className="manual-pro-empty">{pickTr(tr, 'manualProEmpty', 'Selecione uma página no índice.')}</p>
          ) : (
            <>
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
                  <p className="manual-pro-note">{pickTr(tr, 'manualProDiarioNote', 'Abra pelo botão «Diário de anotação» na barra lateral (Gestão Técnica).')}</p>
                ) : selectedPage.action === 'open-manual-gestor' ? (
                  <p className="manual-pro-note">{pickTr(tr, 'manualProGestorNote', 'Abra em Extras › Manual de uso do gestor (PDF).')}</p>
                ) : null}
              </div>

              <ManualPagePreview page={selectedPage} title={pageTitle} />

              <section className="manual-pro-section">
                <h3>{pickTr(tr, 'helpSectionParaQueServe', 'Para que serve')}</h3>
                <p>{parsed.purpose || pickTr(tr, 'helpDefault', 'Consulte o administrador para mais detalhes.')}</p>
              </section>

              <section className="manual-pro-section">
                <h3>{pickTr(tr, 'helpSectionComoFazer', 'Passo a passo')}</h3>
                {parsed.sections.length > 0 ? (
                  parsed.sections.map((section, idx) => (
                    <div key={idx} className="manual-pro-steps-block">
                      {section.title ? <h4>{section.title}</h4> : null}
                      <ol className="manual-pro-steps">
                        {section.items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ol>
                    </div>
                  ))
                ) : parsed.steps.length > 0 ? (
                  <ol className="manual-pro-steps">
                    {parsed.steps.map((step, i) => (
                      <li key={i}>{step}</li>
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

              <footer className="manual-pro-footer">
                <p>
                  {pickTr(
                    tr,
                    'manualProFooter',
                    'Dica: dentro de qualquer módulo, F1 e o botão HELP mostram a mesma explicação actualizada para o ecrã onde está.'
                  )}
                </p>
              </footer>
            </>
          )}
        </article>
      </div>
    </div>
  )
}

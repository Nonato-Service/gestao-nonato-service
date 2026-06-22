'use client'

import React, { useMemo, useState } from 'react'
import { NonatoBrandLogo } from '../NonatoBrandLogo'
import {
  PDF_LOGO_SITUATIONS,
  type PdfLogoSituationId,
} from '../../lib/adminPdfLogoSituations'
import type {
  AdminBibliotecaLogoDraft,
  AdminInterfaceLogoDraft,
  LogoRelatorio,
  SafeT,
} from './adminTypes'

export type AdminLogosHubProps = {
  safeT: SafeT
  variant?: 'full' | 'compact'
  logoUrl: string | null
  logoType: 'image' | 'video' | null
  logoUrlDashboard: string | null
  logoTypeDashboard: 'image' | 'video' | null
  adminSidebarLogoDraft: AdminInterfaceLogoDraft | null
  adminDashboardLogoDraft: AdminInterfaceLogoDraft | null
  adminLogoSavingSidebar: boolean
  adminLogoSavingDashboard: boolean
  handleFileChangeSidebarLogo: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleFileChangeDashboardLogo: (e: React.ChangeEvent<HTMLInputElement>) => void
  commitAdminSidebarLogoDraft: () => void | Promise<void>
  discardAdminSidebarLogoDraft: () => void
  commitAdminDashboardLogoDraft: () => void | Promise<void>
  discardAdminDashboardLogoDraft: () => void
  handleRemoveSidebarLogo: () => void
  handleRemoveDashboardLogo: () => void
  pdfLogosModoUnificado: boolean
  setPdfLogosModoUnificado: (v: boolean) => void
  logosRelatorios: LogoRelatorio[]
  adminBibliotecaLogoDraft: AdminBibliotecaLogoDraft | null
  adminBibliotecaLogoSaving: boolean
  getSelectedLogoIdForSituation: (situationId: PdfLogoSituationId) => string
  incluirLogoNosRelatorios: boolean
  incluirLogoFechamentosDespesas: boolean
  setIncluirLogoNosRelatorios: (v: boolean) => void
  setIncluirLogoFechamentosDespesas: (v: boolean) => void
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
  administradorPreviewPdfLogo: (selectedId: string) => string | null
  aplicarLogoUnificadoTodosPdfs: (logoId: string) => void
  setSelectedLogoIdForSituation: (situationId: PdfLogoSituationId, logoId: string) => void
  administradorUploadLogoForSituation: (
    situationId: PdfLogoSituationId,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void | Promise<void>
  administradorClearLogoForSituation: (situationId: PdfLogoSituationId) => void
  administradorRemoveBibliotecaLogo: (logoId: string) => void
  administradorAddBibliotecaLogo: (e: React.ChangeEvent<HTMLInputElement>) => void
  commitAdminBibliotecaLogoDraft: () => void | Promise<void>
  discardAdminBibliotecaLogoDraft: () => void
}

const PDF_ACCENT: Record<PdfLogoSituationId, string> = {
  relatorios: 'green',
  fechamentos: 'amber',
  orcamentoPecas: 'blue',
  orcamentoServico: 'cyan',
  documentos: 'indigo',
  protocolos: 'violet',
  checklist: 'teal',
  preChecklist: 'rose',
}

function tr(safeT: SafeT, key: string, fallback: string): string {
  return (safeT as Record<string, string | undefined>)[key] || fallback
}

function resolveLogoLabel(selectedId: string, logosRelatorios: LogoRelatorio[], safeT: SafeT): string {
  if (!selectedId) return safeT.logoPrincipal || 'Logo principal (barra lateral)'
  return logosRelatorios.find((l) => l.id === selectedId)?.name || selectedId
}

function InterfaceLogoPanel({
  safeT,
  title,
  hint,
  accent,
  draft,
  savedUrl,
  savedIsVideo,
  saving,
  onFileChange,
  onCommit,
  onDiscard,
  onRemove,
  hasSaved,
}: {
  safeT: SafeT
  title: string
  hint: string
  accent: 'cyan' | 'emerald'
  draft: AdminInterfaceLogoDraft | null
  savedUrl: string | null
  savedIsVideo: boolean
  saving: boolean
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCommit: () => void
  onDiscard: () => void
  onRemove: () => void
  hasSaved: boolean
}) {
  const isVideo = draft ? draft.isVideo : savedIsVideo
  const preview = draft?.previewUrl || savedUrl
  const status = draft ? 'draft' : hasSaved ? 'active' : 'empty'

  return (
    <article className={`admin-logos-hub-ui-card admin-logos-hub-ui-card--${accent}`}>
      <header className="admin-logos-hub-ui-card__head">
        <div>
          <h4 className="admin-logos-hub-ui-card__title">{title}</h4>
          <p className="admin-logos-hub-ui-card__hint">{hint}</p>
        </div>
        <span className={`admin-logos-hub-status admin-logos-hub-status--${status}`}>
          {status === 'draft'
            ? tr(safeT, 'adminLogoRascunhoBadge', 'Rascunho')
            : status === 'active'
              ? tr(safeT, 'adminLogoStatusAtivo', 'Ativo')
              : tr(safeT, 'adminSemLogoPreview', 'Sem logo')}
        </span>
      </header>

      <div className={`admin-logos-hub-dropzone${draft ? ' admin-logos-hub-dropzone--draft' : ''}`}>
        {preview ? (
          isVideo ? (
            <video src={preview} autoPlay loop muted playsInline className="admin-logos-hub-dropzone__media" />
          ) : (
            <img src={preview} alt="" className="admin-logos-hub-dropzone__media" />
          )
        ) : (
          <div className="admin-logos-hub-dropzone__placeholder">
            <span className="admin-logos-hub-dropzone__icon" aria-hidden="true">
              ⬆
            </span>
            <span>{tr(safeT, 'adminLogoArrastarOuCarregar', 'PNG, JPG ou MP4')}</span>
          </div>
        )}
      </div>

      <div className="admin-logos-hub-actions">
        <label className="admin-logos-hub-btn admin-logos-hub-btn--primary">
          {safeT.changeLogo || 'Carregar ficheiro'}
          <input type="file" accept="image/*,video/mp4" hidden onChange={onFileChange} />
        </label>
        {draft ? (
          <>
            <button type="button" className="admin-logos-hub-btn admin-logos-hub-btn--save" disabled={saving} onClick={() => void onCommit()}>
              {tr(safeT, 'guardar', safeT.save || 'Guardar')}
            </button>
            <button type="button" className="admin-logos-hub-btn admin-logos-hub-btn--ghost" disabled={saving} onClick={onDiscard}>
              {tr(safeT, 'adminLogoDescartarRascunho', safeT.cancel || 'Cancelar')}
            </button>
          </>
        ) : hasSaved ? (
          <button type="button" className="admin-logos-hub-btn admin-logos-hub-btn--danger" onClick={onRemove}>
            {safeT.removeLogo || 'Apagar logo'}
          </button>
        ) : null}
      </div>
    </article>
  )
}

function PdfSituationEditor({
  safeT,
  situationId,
  badge,
  icon,
  title,
  description,
  accent,
  selectedId,
  includeToggle,
  includeChecked,
  onIncludeChange,
  previewUrl,
  logoLabel,
  logosRelatorios,
  onSelectLogo,
  onUpload,
  onClear,
}: {
  safeT: SafeT
  situationId: PdfLogoSituationId
  badge: string
  icon: string
  title: string
  description: string
  accent: string
  selectedId: string
  includeToggle?: 'relatorios' | 'fechamentos'
  includeChecked?: boolean
  onIncludeChange?: (v: boolean) => void
  previewUrl: string | null
  logoLabel: string
  logosRelatorios: LogoRelatorio[]
  onSelectLogo: (logoId: string) => void
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
}) {
  return (
    <div className={`admin-logos-hub-pdf-editor admin-logos-hub-pdf-editor--${accent}`}>
      <header className="admin-logos-hub-pdf-editor__head">
        <span className="admin-logos-hub-pdf-editor__badge">{badge}</span>
        <span className="admin-logos-hub-pdf-editor__icon" aria-hidden="true">
          {icon}
        </span>
        <div className="admin-logos-hub-pdf-editor__titles">
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
      </header>

      <div className="admin-logos-hub-pdf-editor__preview">
        {previewUrl ? (
          <img src={previewUrl} alt="" />
        ) : (
          <span>{tr(safeT, 'adminSemLogoPdf', 'Ainda não há imagem nesta situação')}</span>
        )}
      </div>

      <p className="admin-logos-hub-pdf-editor__current">
        <span>{tr(safeT, 'adminLogoAtual', 'Logo em uso')}</span>
        <strong>{logoLabel}</strong>
      </p>

      {includeToggle && onIncludeChange ? (
        <label className="admin-logos-hub-toggle-row">
          <input type="checkbox" checked={!!includeChecked} onChange={(e) => onIncludeChange(e.target.checked)} />
          <span>
            {includeToggle === 'fechamentos'
              ? tr(safeT, 'incluirLogoFechamentosDespesasShort', 'Mostrar logo nestes PDF')
              : safeT.incluirLogoNosRelatorios || 'Mostrar logo nestes PDF'}
          </span>
        </label>
      ) : null}

      <div className="admin-logos-hub-actions admin-logos-hub-actions--pdf">
        <label className="admin-logos-hub-btn admin-logos-hub-btn--primary">
          {tr(safeT, 'adminLogoAnexarSituacao', 'Carregar imagem')}
          <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/*" hidden onChange={onUpload} />
        </label>
        <div className="admin-logos-hub-select-wrap">
          <label htmlFor={`logo-select-${situationId}`}>{tr(safeT, 'adminLogoEscolherBiblioteca', 'Ou escolher da biblioteca')}</label>
          <select
            id={`logo-select-${situationId}`}
            value={selectedId}
            onChange={(e) => onSelectLogo(e.target.value)}
          >
            <option value="">{safeT.logoPrincipal || 'Logo principal (barra lateral)'}</option>
            {logosRelatorios
              .filter((l) => l.type === 'image')
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name || l.id}
                </option>
              ))}
          </select>
        </div>
        <button
          type="button"
          className="admin-logos-hub-btn admin-logos-hub-btn--danger"
          disabled={!selectedId}
          onClick={onClear}
        >
          {tr(safeT, 'adminLogoLimparSituacao', 'Usar logo principal')}
        </button>
      </div>
    </div>
  )
}

export function AdminLogosHub(props: AdminLogosHubProps) {
  const {
    safeT,
    variant = 'full',
    logoUrl,
    logoType,
    logoUrlDashboard,
    logoTypeDashboard,
    adminSidebarLogoDraft,
    adminDashboardLogoDraft,
    adminLogoSavingSidebar,
    adminLogoSavingDashboard,
    handleFileChangeSidebarLogo,
    handleFileChangeDashboardLogo,
    commitAdminSidebarLogoDraft,
    discardAdminSidebarLogoDraft,
    commitAdminDashboardLogoDraft,
    discardAdminDashboardLogoDraft,
    handleRemoveSidebarLogo,
    handleRemoveDashboardLogo,
    pdfLogosModoUnificado,
    setPdfLogosModoUnificado,
    logosRelatorios,
    adminBibliotecaLogoDraft,
    adminBibliotecaLogoSaving,
    getSelectedLogoIdForSituation,
    incluirLogoNosRelatorios,
    incluirLogoFechamentosDespesas,
    setIncluirLogoNosRelatorios,
    setIncluirLogoFechamentosDespesas,
    saveData,
    administradorPreviewPdfLogo,
    aplicarLogoUnificadoTodosPdfs,
    setSelectedLogoIdForSituation,
    administradorUploadLogoForSituation,
    administradorClearLogoForSituation,
    administradorRemoveBibliotecaLogo,
    administradorAddBibliotecaLogo,
    commitAdminBibliotecaLogoDraft,
    discardAdminBibliotecaLogoDraft,
  } = props

  const compact = variant === 'compact'
  const [activeTab, setActiveTab] = useState<'pdf' | 'interface' | 'brand'>('pdf')
  const [activePdfSituation, setActivePdfSituation] = useState<PdfLogoSituationId>('relatorios')

  const selectedBySituation = useMemo(
    (): Record<PdfLogoSituationId, string> =>
      Object.fromEntries(
        PDF_LOGO_SITUATIONS.map((sit) => [sit.id, getSelectedLogoIdForSituation(sit.id)])
      ) as Record<PdfLogoSituationId, string>,
    [getSelectedLogoIdForSituation]
  )

  const activeSitDef = PDF_LOGO_SITUATIONS.find((s) => s.id === activePdfSituation) || PDF_LOGO_SITUATIONS[0]
  const activeSelectedId = pdfLogosModoUnificado
    ? getSelectedLogoIdForSituation('relatorios')
    : selectedBySituation[activePdfSituation]
  const activePreview = administradorPreviewPdfLogo(activeSelectedId)
  const activeLabel = resolveLogoLabel(activeSelectedId, logosRelatorios, safeT)

  const tabs = [
    { id: 'pdf' as const, label: tr(safeT, 'adminLogosTabPdf', 'Documentos PDF'), icon: '📄' },
    { id: 'interface' as const, label: tr(safeT, 'adminLogosTabInterface', 'Ecrã e menu'), icon: '🖥️' },
    ...(compact ? [] : [{ id: 'brand' as const, label: tr(safeT, 'adminLogosTabBrand', 'Tons da marca'), icon: '🎨' }]),
  ]

  return (
    <section className={`admin-logos-hub${compact ? ' admin-logos-hub--compact' : ''}`}>
      <header className="admin-logos-hub__hero">
        <div className="admin-logos-hub__hero-glow" aria-hidden="true" />
        <div className="admin-logos-hub__hero-content">
          <div className="admin-logos-hub__hero-icon" aria-hidden="true">
            🎯
          </div>
          <div>
            <h3 className="admin-logos-hub__hero-title">
              {tr(safeT, 'adminLogosHubTitle', 'Centro de Logos')}
            </h3>
            <p className="admin-logos-hub__hero-desc">
              {tr(
                safeT,
                'adminLogosHubDesc',
                'Escolha o logo certo para cada situação: relatórios, despesas, orçamentos, documentos, menu lateral e ecrã inicial.'
              )}
            </p>
          </div>
        </div>
        <ol className="admin-logos-hub__steps">
          <li>{tr(safeT, 'adminLogosStep1', '1. Escolha a aba')}</li>
          <li>{tr(safeT, 'adminLogosStep2', '2. Selecione a situação')}</li>
          <li>{tr(safeT, 'adminLogosStep3', '3. Carregue ou escolha o logo')}</li>
        </ol>
      </header>

      <nav className="admin-logos-hub__tabs" role="tablist" aria-label={tr(safeT, 'adminLogosHubTitle', 'Centro de Logos')}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`admin-logos-hub__tab${activeTab === tab.id ? ' admin-logos-hub__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'interface' ? (
        <div className="admin-logos-hub__panel" role="tabpanel">
          <div className="admin-logos-hub-ui-grid">
            <InterfaceLogoPanel
              safeT={safeT}
              title={tr(safeT, 'logoBarraLateral', 'Logo da barra lateral')}
              hint={safeT.selectImageOrVideo || 'Aparece no menu lateral da aplicação.'}
              accent="cyan"
              draft={adminSidebarLogoDraft}
              savedUrl={logoUrl}
              savedIsVideo={logoType === 'video'}
              saving={adminLogoSavingSidebar}
              onFileChange={handleFileChangeSidebarLogo}
              onCommit={commitAdminSidebarLogoDraft}
              onDiscard={discardAdminSidebarLogoDraft}
              onRemove={handleRemoveSidebarLogo}
              hasSaved={!!logoUrl}
            />
            <InterfaceLogoPanel
              safeT={safeT}
              title={tr(safeT, 'logoDashboard', 'Logo do ecrã inicial')}
              hint={safeT.selectImageOrVideo || 'Aparece no painel de controlo / dashboard.'}
              accent="emerald"
              draft={adminDashboardLogoDraft}
              savedUrl={logoUrlDashboard}
              savedIsVideo={logoTypeDashboard === 'video'}
              saving={adminLogoSavingDashboard}
              onFileChange={handleFileChangeDashboardLogo}
              onCommit={commitAdminDashboardLogoDraft}
              onDiscard={discardAdminDashboardLogoDraft}
              onRemove={handleRemoveDashboardLogo}
              hasSaved={!!logoUrlDashboard}
            />
          </div>
        </div>
      ) : null}

      {activeTab === 'brand' && !compact ? (
        <div className="admin-logos-hub__panel" role="tabpanel">
          <p className="admin-logos-hub-brand-intro">
            {tr(
              safeT,
              'brandSituationsDesc',
              'Variações automáticas da marca NONATO consoante o contexto (alertas, financeiro, sucesso).'
            )}
          </p>
          <div className="admin-logos-hub-brand-grid">
            {(
              [
                ['original', tr(safeT, 'brandVariantOriginal', 'Original')],
                ['sucesso', tr(safeT, 'brandVariantSucesso', 'Sucesso')],
                ['alerta', tr(safeT, 'brandVariantAlerta', 'Alerta')],
                ['devedor', tr(safeT, 'brandVariantDevedor', 'Urgência')],
                ['financeiro', tr(safeT, 'brandVariantFinanceiro', 'Financeiro')],
                ['informacao', tr(safeT, 'brandVariantInformacao', 'Informação')],
              ] as const
            ).map(([variant, label]) => (
              <div key={variant} className="admin-logos-hub-brand-item">
                <NonatoBrandLogo variant={variant} style={{ height: 44, width: 'auto' }} alt="" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'pdf' ? (
        <div className="admin-logos-hub__panel" role="tabpanel">
          <div className="admin-logos-hub-mode">
            <span className="admin-logos-hub-mode__label">
              {tr(safeT, 'pdfLogosModoTitulo', 'Aplicação nos PDF')}
            </span>
            <div className="admin-logos-hub-mode__switch">
              <button
                type="button"
                className={`admin-logos-hub-mode__btn${!pdfLogosModoUnificado ? ' admin-logos-hub-mode__btn--active' : ''}`}
                onClick={() => {
                  if (!pdfLogosModoUnificado) return
                  setPdfLogosModoUnificado(false)
                  void saveData('nonato-pdf-logos-unificado', false)
                }}
              >
                {tr(safeT, 'adminLogosModoSeparado', 'Logo por situação')}
              </button>
              <button
                type="button"
                className={`admin-logos-hub-mode__btn${pdfLogosModoUnificado ? ' admin-logos-hub-mode__btn--active' : ''}`}
                onClick={() => {
                  if (pdfLogosModoUnificado) return
                  setPdfLogosModoUnificado(true)
                  void saveData('nonato-pdf-logos-unificado', true)
                  aplicarLogoUnificadoTodosPdfs(getSelectedLogoIdForSituation('relatorios') || '')
                }}
              >
                {tr(safeT, 'adminLogosModoUnico', 'Mesmo logo em tudo')}
              </button>
            </div>
          </div>

          {pdfLogosModoUnificado ? (
            <PdfSituationEditor
              safeT={safeT}
              situationId="relatorios"
              badge="ALL"
              icon="🖼️"
              title={tr(safeT, 'pdfLogosUnificadoCabecalho', 'Um logo para todos os documentos')}
              description={tr(
                safeT,
                'pdfLogosUnificadoSub',
                'Relatórios, despesas, orçamentos e protocolos usam a mesma imagem.'
              )}
              accent="green"
              selectedId={getSelectedLogoIdForSituation('relatorios')}
              includeToggle="relatorios"
              includeChecked={incluirLogoNosRelatorios}
              onIncludeChange={(v) => {
                setIncluirLogoNosRelatorios(v)
                void saveData('nonato-relatorios-incluir-logo', v)
              }}
              previewUrl={activePreview}
              logoLabel={activeLabel}
              logosRelatorios={logosRelatorios}
              onSelectLogo={(id) => aplicarLogoUnificadoTodosPdfs(id)}
              onUpload={(e) => void administradorUploadLogoForSituation('relatorios', e)}
              onClear={() => aplicarLogoUnificadoTodosPdfs('')}
            />
          ) : (
            <div className="admin-logos-hub-pdf-layout">
              <aside className="admin-logos-hub-pdf-nav">
                <p className="admin-logos-hub-pdf-nav__title">
                  {tr(safeT, 'adminLogosSituacoes', 'Situações')}
                </p>
                <ul>
                  {PDF_LOGO_SITUATIONS.map((sit) => {
                    const title = tr(safeT, sit.titleKey, sit.titleFallback)
                    const selId = selectedBySituation[sit.id]
                    const hasCustom = !!selId
                    return (
                      <li key={sit.id}>
                        <button
                          type="button"
                          className={`admin-logos-hub-pdf-nav__item admin-logos-hub-pdf-nav__item--${PDF_ACCENT[sit.id]}${
                            activePdfSituation === sit.id ? ' admin-logos-hub-pdf-nav__item--active' : ''
                          }`}
                          onClick={() => setActivePdfSituation(sit.id)}
                        >
                          <span className="admin-logos-hub-pdf-nav__icon" aria-hidden="true">
                            {sit.icon}
                          </span>
                          <span className="admin-logos-hub-pdf-nav__text">
                            <strong>{title}</strong>
                            <small>
                              {hasCustom
                                ? resolveLogoLabel(selId, logosRelatorios, safeT)
                                : tr(safeT, 'adminLogoUsandoPrincipal', 'Logo principal')}
                            </small>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </aside>

              <PdfSituationEditor
                safeT={safeT}
                situationId={activeSitDef.id}
                badge={activeSitDef.badge}
                icon={activeSitDef.icon}
                title={tr(safeT, activeSitDef.titleKey, activeSitDef.titleFallback)}
                description={tr(safeT, activeSitDef.descKey, activeSitDef.descFallback)}
                accent={PDF_ACCENT[activeSitDef.id]}
                selectedId={selectedBySituation[activeSitDef.id]}
                includeToggle={activeSitDef.includeToggle}
                includeChecked={
                  activeSitDef.includeToggle === 'relatorios'
                    ? incluirLogoNosRelatorios
                    : activeSitDef.includeToggle === 'fechamentos'
                      ? incluirLogoFechamentosDespesas
                      : undefined
                }
                onIncludeChange={
                  activeSitDef.includeToggle === 'relatorios'
                    ? (v) => {
                        setIncluirLogoNosRelatorios(v)
                        void saveData('nonato-relatorios-incluir-logo', v)
                      }
                    : activeSitDef.includeToggle === 'fechamentos'
                      ? (v) => {
                          setIncluirLogoFechamentosDespesas(v)
                          void saveData('nonato-fechamentos-incluir-logo', v)
                        }
                      : undefined
                }
                previewUrl={activePreview}
                logoLabel={activeLabel}
                logosRelatorios={logosRelatorios}
                onSelectLogo={(id) => setSelectedLogoIdForSituation(activeSitDef.id, id)}
                onUpload={(e) => void administradorUploadLogoForSituation(activeSitDef.id, e)}
                onClear={() => administradorClearLogoForSituation(activeSitDef.id)}
              />
            </div>
          )}

          {pdfLogosModoUnificado ? (
            <label className="admin-logos-hub-toggle-row admin-logos-hub-toggle-row--inline">
              <input
                type="checkbox"
                checked={incluirLogoFechamentosDespesas}
                onChange={(e) => {
                  const v = e.target.checked
                  setIncluirLogoFechamentosDespesas(v)
                  void saveData('nonato-fechamentos-incluir-logo', v)
                }}
              />
              <span>{tr(safeT, 'incluirLogoFechamentosDespesasShort', 'Incluir logo nos PDF de despesas')}</span>
            </label>
          ) : null}

          <details className="admin-logos-hub-library">
            <summary>
              <span>{tr(safeT, 'logosDisponiveisRelatorios', 'Biblioteca de imagens')}</span>
              <span className="admin-logos-hub-library__count">{logosRelatorios.length}</span>
            </summary>
            <div className="admin-logos-hub-library__body">
              <p className="admin-logos-hub-library__desc">
                {tr(
                  safeT,
                  'adminLogosBibliotecaDesc',
                  'Imagens guardadas para reutilizar. Pode carregar aqui ou diretamente em cada situação.'
                )}
              </p>
              <label className="admin-logos-hub-btn admin-logos-hub-btn--primary admin-logos-hub-btn--sm">
                {tr(safeT, 'adicionarLogoRelatorios', 'Adicionar imagem')}
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/*" hidden onChange={administradorAddBibliotecaLogo} />
              </label>

              {adminBibliotecaLogoDraft ? (
                <div className="admin-logos-hub-library__draft">
                  <img src={adminBibliotecaLogoDraft.previewUrl} alt="" />
                  <div>
                    <strong>{adminBibliotecaLogoDraft.fileName}</strong>
                    <div className="admin-logos-hub-actions">
                      <button type="button" className="admin-logos-hub-btn admin-logos-hub-btn--save" disabled={adminBibliotecaLogoSaving} onClick={() => void commitAdminBibliotecaLogoDraft()}>
                        {tr(safeT, 'adminBibliotecaSalvarNaBiblioteca', 'Guardar')}
                      </button>
                      <button type="button" className="admin-logos-hub-btn admin-logos-hub-btn--ghost" disabled={adminBibliotecaLogoSaving} onClick={discardAdminBibliotecaLogoDraft}>
                        {tr(safeT, 'cancel', 'Cancelar')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {logosRelatorios.length === 0 && !adminBibliotecaLogoDraft ? (
                <p className="admin-logos-hub-library__empty">{tr(safeT, 'nenhumLogoRelatorio', 'Biblioteca vazia.')}</p>
              ) : (
                <div className="admin-logos-hub-library__grid">
                  {logosRelatorios.map((l) => (
                    <div key={l.id} className="admin-logos-hub-library__item">
                      <div className="admin-logos-hub-library__thumb">{l.data ? <img src={l.data} alt={l.name} /> : null}</div>
                      <div>
                        <strong>{l.name || l.id}</strong>
                        <small>
                          {PDF_LOGO_SITUATIONS.filter((s) => getSelectedLogoIdForSituation(s.id) === l.id)
                            .map((s) => tr(safeT, s.titleKey, s.titleFallback))
                            .join(' · ') || tr(safeT, 'adminLogoSemUso', 'Livre')}
                        </small>
                      </div>
                      <button type="button" className="admin-logos-hub-btn admin-logos-hub-btn--danger admin-logos-hub-btn--sm" onClick={() => administradorRemoveBibliotecaLogo(l.id)}>
                        {safeT.removeLogo || 'Apagar'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
        </div>
      ) : null}
    </section>
  )
}

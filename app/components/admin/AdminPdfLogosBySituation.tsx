'use client'

import React from 'react'
import {
  PDF_LOGO_SITUATIONS,
  type PdfLogoSituationId,
} from '../../lib/adminPdfLogoSituations'
import type { LogoRelatorio, SafeT } from './adminTypes'

export type AdminPdfLogosBySituationProps = {
  safeT: SafeT
  variant?: 'full' | 'compact'
  pdfLogosModoUnificado: boolean
  setPdfLogosModoUnificado: (v: boolean) => void
  logosRelatorios: LogoRelatorio[]
  logoRelatorioSelecionadoId: string
  logoFechamentoSelecionadoId: string
  logoOrcamentoSelecionadoId: string
  logoProtocoloServicoSelecionadoId: string
  incluirLogoNosRelatorios: boolean
  incluirLogoFechamentosDespesas: boolean
  setIncluirLogoNosRelatorios: (v: boolean) => void
  setIncluirLogoFechamentosDespesas: (v: boolean) => void
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
  administradorPreviewPdfLogo: (selectedId: string) => string | null
  aplicarLogoUnificadoTodosPdfs: (logoId: string) => void
  getSelectedLogoIdForSituation: (situationId: PdfLogoSituationId) => string
  setSelectedLogoIdForSituation: (situationId: PdfLogoSituationId, logoId: string) => void
  administradorUploadLogoForSituation: (
    situationId: PdfLogoSituationId,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void | Promise<void>
  administradorClearLogoForSituation: (situationId: PdfLogoSituationId) => void
  administradorRemoveBibliotecaLogo: (logoId: string) => void
  administradorAddBibliotecaLogo: (e: React.ChangeEvent<HTMLInputElement>) => void
  adminBibliotecaLogoDraft: { previewUrl: string; fileName: string } | null
  adminBibliotecaLogoSaving: boolean
  commitAdminBibliotecaLogoDraft: () => void | Promise<void>
  discardAdminBibliotecaLogoDraft: () => void
}

function resolveLogoLabel(
  selectedId: string,
  logosRelatorios: LogoRelatorio[],
  tr: SafeT
): string {
  if (!selectedId) return tr.logoPrincipal || 'Logo principal (barra lateral)'
  const item = logosRelatorios.find((l) => l.id === selectedId)
  return item?.name || selectedId
}

function LogoPreviewBox({
  previewUrl,
  emptyText,
}: {
  previewUrl: string | null
  emptyText: string
}) {
  return (
    <div className="admin-logo-situacao-preview">
      {previewUrl ? (
        <img src={previewUrl} alt="" className="admin-logo-situacao-preview__img" />
      ) : (
        <span className="admin-logo-situacao-preview__empty">{emptyText}</span>
      )}
    </div>
  )
}

function SituationLogoCard({
  situationId,
  badge,
  icon,
  title,
  description,
  selectedId,
  includeToggle,
  includeChecked,
  onIncludeChange,
  previewUrl,
  logoLabel,
  logosRelatorios,
  tr,
  onSelectLogo,
  onUpload,
  onClear,
  compact,
}: {
  situationId: PdfLogoSituationId
  badge: string
  icon: string
  title: string
  description: string
  selectedId: string
  includeToggle?: 'relatorios' | 'fechamentos'
  includeChecked?: boolean
  onIncludeChange?: (v: boolean) => void
  previewUrl: string | null
  logoLabel: string
  logosRelatorios: LogoRelatorio[]
  tr: SafeT
  onSelectLogo: (logoId: string) => void
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  compact?: boolean
}) {
  const includeLabel =
    includeToggle === 'fechamentos'
      ? (tr as Record<string, string | undefined>).incluirLogoFechamentosDespesasShort ||
        tr.incluirLogoNosRelatorios ||
        'Incluir nos PDF'
      : tr.incluirLogoNosRelatorios || 'Incluir nos PDF'

  return (
    <article className={`admin-logo-situacao-card${compact ? ' admin-logo-situacao-card--compact' : ''}`}>
      <header className="admin-logo-situacao-card__head">
        <div className="admin-logo-situacao-card__title-wrap">
          <span className="admin-logo-situacao-card__badge">{badge}</span>
          <span className="admin-logo-situacao-card__icon" aria-hidden="true">
            {icon}
          </span>
          <div>
            <h5 className="admin-logo-situacao-card__title">{title}</h5>
            <p className="admin-logo-situacao-card__desc">{description}</p>
          </div>
        </div>
        {includeToggle && onIncludeChange ? (
          <label className="admin-logo-situacao-card__include">
            <input
              type="checkbox"
              checked={!!includeChecked}
              onChange={(e) => onIncludeChange(e.target.checked)}
            />
            <span>{includeLabel}</span>
          </label>
        ) : null}
      </header>

      <LogoPreviewBox
        previewUrl={previewUrl}
        emptyText={
          (tr as Record<string, string | undefined>).adminSemLogoPdf ||
          'Nenhum logo — use «Anexar logo» ou escolha da biblioteca.'
        }
      />

      <p className="admin-logo-situacao-card__current">
        <strong>{(tr as Record<string, string | undefined>).adminLogoAtual || 'Logo atual'}:</strong>{' '}
        {logoLabel}
      </p>

      <div className="admin-logo-situacao-card__actions">
        <label className="btn-primary admin-logo-situacao-card__btn-file">
          {(tr as Record<string, string | undefined>).adminLogoAnexarSituacao || 'Anexar logo'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
            style={{ display: 'none' }}
            onChange={onUpload}
          />
        </label>
        <select
          className="admin-logo-situacao-card__select"
          value={selectedId}
          onChange={(e) => onSelectLogo(e.target.value)}
          aria-label={`${title} — ${tr.changeLogo || 'Alterar logo'}`}
        >
          <option value="">{tr.logoPrincipal || 'Logo principal (barra lateral)'}</option>
          {logosRelatorios
            .filter((l) => l.type === 'image')
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.name || l.id}
              </option>
            ))}
        </select>
        <button
          type="button"
          className="btn-danger btn-danger--inline admin-logo-situacao-card__btn-clear"
          onClick={onClear}
          disabled={!selectedId}
          title={tr.removeLogo || 'Remover logo'}
        >
          {tr.removeLogo || 'Remover logo'}
        </button>
      </div>
      <input type="hidden" name={`logo-situacao-${situationId}`} value={selectedId} readOnly />
    </article>
  )
}

export function AdminPdfLogosBySituation({
  safeT,
  variant = 'full',
  pdfLogosModoUnificado,
  setPdfLogosModoUnificado,
  logosRelatorios,
  logoRelatorioSelecionadoId,
  logoFechamentoSelecionadoId: _logoFechamentoSelecionadoId,
  logoOrcamentoSelecionadoId: _logoOrcamentoSelecionadoId,
  logoProtocoloServicoSelecionadoId: _logoProtocoloServicoSelecionadoId,
  incluirLogoNosRelatorios,
  incluirLogoFechamentosDespesas,
  setIncluirLogoNosRelatorios,
  setIncluirLogoFechamentosDespesas,
  saveData,
  administradorPreviewPdfLogo,
  aplicarLogoUnificadoTodosPdfs,
  getSelectedLogoIdForSituation,
  setSelectedLogoIdForSituation,
  administradorUploadLogoForSituation,
  administradorClearLogoForSituation,
  administradorRemoveBibliotecaLogo,
  administradorAddBibliotecaLogo,
  adminBibliotecaLogoDraft,
  adminBibliotecaLogoSaving,
  commitAdminBibliotecaLogoDraft,
  discardAdminBibliotecaLogoDraft,
}: AdminPdfLogosBySituationProps) {
  const compact = variant === 'compact'
  const tr = safeT

  const unifiedSelectedId = logoRelatorioSelecionadoId

  return (
    <div className="admin-logos-pdf-root">
      <header className="admin-logos-pdf-root__header">
        <h4 className="admin-logos-pdf-root__title">
          {(tr as Record<string, string | undefined>).adminLogosPdfTitle || 'Logos por situação / documento'}
        </h4>
        <p className="admin-logos-pdf-root__desc">
          {(tr as Record<string, string | undefined>).adminLogosPdfDescOrganizado ||
            'Organize o logo de cada tipo de documento em secções separadas. Em cada situação pode anexar uma imagem, alterar a seleção ou remover o logo personalizado.'}
        </p>
      </header>

      <div className="admin-logos-pdf-modo">
        <strong className="admin-logos-pdf-modo__title">
          {(tr as Record<string, string | undefined>).pdfLogosModoTitulo || 'Como aplicar os logos'}
        </strong>
        <label className="admin-logos-pdf-modo__option">
          <input
            type="radio"
            name="pdf-logos-modo-ns"
            checked={pdfLogosModoUnificado}
            onChange={() => {
              if (pdfLogosModoUnificado) return
              setPdfLogosModoUnificado(true)
              void saveData('nonato-pdf-logos-unificado', true)
              aplicarLogoUnificadoTodosPdfs(unifiedSelectedId || '')
            }}
          />
          <span>
            {(tr as Record<string, string | undefined>).pdfLogosModoUnificadoLabel ||
              'Um único logo para todos os documentos'}
          </span>
        </label>
        <label className="admin-logos-pdf-modo__option">
          <input
            type="radio"
            name="pdf-logos-modo-ns"
            checked={!pdfLogosModoUnificado}
            onChange={() => {
              if (!pdfLogosModoUnificado) return
              setPdfLogosModoUnificado(false)
              void saveData('nonato-pdf-logos-unificado', false)
            }}
          />
          <span>
            {(tr as Record<string, string | undefined>).pdfLogosModoPorTipoLabel ||
              'Logo diferente em cada situação (recomendado)'}
          </span>
        </label>
      </div>

      {pdfLogosModoUnificado ? (
        <section className="admin-logos-pdf-unificado">
          <SituationLogoCard
            situationId="relatorios"
            badge="ÚNICO"
            icon="🖼️"
            title={
              (tr as Record<string, string | undefined>).pdfLogosUnificadoCabecalho ||
              'Logo único para todos os PDFs'
            }
            description={
              (tr as Record<string, string | undefined>).pdfLogosUnificadoSub ||
              'Relatórios, despesas, orçamentos e documentos usam a mesma imagem.'
            }
            selectedId={unifiedSelectedId}
            includeToggle="relatorios"
            includeChecked={incluirLogoNosRelatorios}
            onIncludeChange={(v) => {
              setIncluirLogoNosRelatorios(v)
              void saveData('nonato-relatorios-incluir-logo', v)
            }}
            previewUrl={administradorPreviewPdfLogo(unifiedSelectedId)}
            logoLabel={resolveLogoLabel(unifiedSelectedId, logosRelatorios, tr)}
            logosRelatorios={logosRelatorios}
            tr={tr}
            onSelectLogo={(logoId) => aplicarLogoUnificadoTodosPdfs(logoId)}
            onUpload={(e) => void administradorUploadLogoForSituation('relatorios', e)}
            onClear={() => aplicarLogoUnificadoTodosPdfs('')}
            compact={compact}
          />
          <div className="admin-logos-pdf-unificado__extra-toggles">
            <label className="admin-logo-situacao-card__include">
              <input
                type="checkbox"
                checked={incluirLogoFechamentosDespesas}
                onChange={(e) => {
                  const v = e.target.checked
                  setIncluirLogoFechamentosDespesas(v)
                  void saveData('nonato-fechamentos-incluir-logo', v)
                }}
              />
              <span>
                {(tr as Record<string, string | undefined>).incluirLogoFechamentosDespesasShort ||
                  'Incluir nos PDF de despesas'}
              </span>
            </label>
          </div>
        </section>
      ) : (
        <div className="admin-logo-situacao-grid">
          {PDF_LOGO_SITUATIONS.map((sit) => {
            const selectedId = getSelectedLogoIdForSituation(sit.id)
            const title =
              (tr as Record<string, string | undefined>)[sit.titleKey] || sit.titleFallback
            const description =
              (tr as Record<string, string | undefined>)[sit.descKey] || sit.descFallback

            return (
              <SituationLogoCard
                key={sit.id}
                situationId={sit.id}
                badge={sit.badge}
                icon={sit.icon}
                title={title}
                description={description}
                selectedId={selectedId}
                includeToggle={sit.includeToggle}
                includeChecked={
                  sit.includeToggle === 'relatorios'
                    ? incluirLogoNosRelatorios
                    : sit.includeToggle === 'fechamentos'
                      ? incluirLogoFechamentosDespesas
                      : undefined
                }
                onIncludeChange={
                  sit.includeToggle === 'relatorios'
                    ? (v) => {
                        setIncluirLogoNosRelatorios(v)
                        void saveData('nonato-relatorios-incluir-logo', v)
                      }
                    : sit.includeToggle === 'fechamentos'
                      ? (v) => {
                          setIncluirLogoFechamentosDespesas(v)
                          void saveData('nonato-fechamentos-incluir-logo', v)
                        }
                      : undefined
                }
                previewUrl={administradorPreviewPdfLogo(selectedId)}
                logoLabel={resolveLogoLabel(selectedId, logosRelatorios, tr)}
                logosRelatorios={logosRelatorios}
                tr={tr}
                onSelectLogo={(logoId) => setSelectedLogoIdForSituation(sit.id, logoId)}
                onUpload={(e) => void administradorUploadLogoForSituation(sit.id, e)}
                onClear={() => administradorClearLogoForSituation(sit.id)}
                compact={compact}
              />
            )
          })}
        </div>
      )}

      <section className="admin-logos-biblioteca">
        <div className="admin-logos-biblioteca__head">
          <div>
            <h5 className="admin-logos-biblioteca__title">
              {tr.logosDisponiveisRelatorios || 'Biblioteca de imagens'}
            </h5>
            <p className="admin-logos-biblioteca__desc">
              {(tr as Record<string, string | undefined>).adminLogosBibliotecaDesc ||
                'Imagens guardadas para reutilizar em várias situações. Pode adicionar aqui ou diretamente em cada secção acima.'}
            </p>
          </div>
          <label className="btn-primary admin-logo-situacao-card__btn-file">
            <span aria-hidden="true">📎</span>
            {(tr as Record<string, string | undefined>).adicionarLogoRelatorios || 'Adicionar à biblioteca'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
              style={{ display: 'none' }}
              onChange={administradorAddBibliotecaLogo}
            />
          </label>
        </div>

        {adminBibliotecaLogoDraft ? (
          <div className="admin-logos-biblioteca__draft">
            <span className="admin-logos-biblioteca__draft-badge">
              {(tr as Record<string, string | undefined>).adminLogoRascunhoBadge || 'Rascunho'}
            </span>
            <div className="admin-logos-biblioteca__draft-body">
              <img src={adminBibliotecaLogoDraft.previewUrl} alt="" />
              <div>
                <strong>{adminBibliotecaLogoDraft.fileName}</strong>
                <p>
                  {(tr as Record<string, string | undefined>).adminLogoSalvarParaAplicar ||
                    'Clique em «Guardar na biblioteca» para confirmar.'}
                </p>
              </div>
            </div>
            <div className="admin-logos-biblioteca__draft-actions">
              <button
                type="button"
                className="btn-primary"
                disabled={adminBibliotecaLogoSaving}
                onClick={() => void commitAdminBibliotecaLogoDraft()}
              >
                {(tr as Record<string, string | undefined>).adminBibliotecaSalvarNaBiblioteca ||
                  'Guardar na biblioteca'}
              </button>
              <button
                type="button"
                className="btn-primary admin-logos-biblioteca__btn-muted"
                disabled={adminBibliotecaLogoSaving}
                onClick={discardAdminBibliotecaLogoDraft}
              >
                {(tr as Record<string, string | undefined>).adminLogoDescartarRascunho ||
                  tr.cancel ||
                  'Descartar rascunho'}
              </button>
            </div>
          </div>
        ) : null}

        {logosRelatorios.length === 0 && !adminBibliotecaLogoDraft ? (
          <p className="admin-logos-biblioteca__empty">
            {tr.nenhumLogoRelatorio || 'Nenhuma imagem na biblioteca. Adicione logos acima ou nesta secção.'}
          </p>
        ) : logosRelatorios.length > 0 ? (
          <div className="admin-logos-biblioteca__grid">
            {logosRelatorios.map((l) => (
              <div key={l.id} className="admin-logos-biblioteca__item">
                <div className="admin-logos-biblioteca__thumb">
                  {l.type === 'image' && l.data ? (
                    <img src={l.data} alt={l.name} />
                  ) : null}
                </div>
                <div className="admin-logos-biblioteca__meta">
                  <span className="admin-logos-biblioteca__name" title={l.name || l.id}>
                    {l.name || l.id}
                  </span>
                  <span className="admin-logos-biblioteca__uses">
                    {PDF_LOGO_SITUATIONS.filter((s) => getSelectedLogoIdForSituation(s.id) === l.id)
                      .map((s) => (tr as Record<string, string | undefined>)[s.titleKey] || s.titleFallback)
                      .join(' · ') || (tr as Record<string, string | undefined>).adminLogoSemUso || 'Sem uso'}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-danger btn-danger--inline"
                  onClick={() => administradorRemoveBibliotecaLogo(l.id)}
                >
                  {tr.removeLogo || 'Remover'}
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

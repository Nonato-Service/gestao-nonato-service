'use client'

import React from 'react'
import { getLanguages } from '../../modules/idiomas'
import { AdminLogosHub } from './AdminLogosHub'
import type { AdminBibliotecaLogoDraft, AdminInterfaceLogoDraft, LogoRelatorio, SafeT } from './adminTypes'
import type { PdfLogoSituationId } from '../../lib/adminPdfLogoSituations'

export type AdminConfigGeralSectionProps = {
  variant?: 'full' | 'compact'
  safeT: SafeT
  preverProximoNumeroRelatorio: (dataReferenciaIso?: string) => string
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
  setSelectedLogoIdForSituation: (situationId: PdfLogoSituationId, logoId: string) => void
  incluirLogoNosRelatorios: boolean
  incluirLogoFechamentosDespesas: boolean
  setIncluirLogoNosRelatorios: (v: boolean) => void
  setIncluirLogoFechamentosDespesas: (v: boolean) => void
  /** Preferência Admin: logout correcto + aviso beforeunload. */
  exigirSaidaCorrecta: boolean
  setExigirSaidaCorrecta: (v: boolean) => void
  /** Idioma da interface neste aparelho. */
  selectedLanguage: string
  onLanguageChange: (languageCode: string) => void
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
  administradorPreviewPdfLogo: (selectedId: string) => string | null
  aplicarLogoUnificadoTodosPdfs: (logoId: string) => void
  administradorAddBibliotecaLogo: (e: React.ChangeEvent<HTMLInputElement>) => void
  commitAdminBibliotecaLogoDraft: () => void | Promise<void>
  discardAdminBibliotecaLogoDraft: () => void
  administradorUploadLogoForSituation: (
    situationId: PdfLogoSituationId,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void | Promise<void>
  administradorClearLogoForSituation: (situationId: PdfLogoSituationId) => void
  administradorRemoveBibliotecaLogo: (logoId: string) => void
}

export function AdminConfigGeralSection(props: AdminConfigGeralSectionProps) {
  const {
    variant = 'full',
    safeT,
    preverProximoNumeroRelatorio,
    exigirSaidaCorrecta,
    setExigirSaidaCorrecta,
    selectedLanguage,
    onLanguageChange,
    ...logoProps
  } = props
  const languageOptions = getLanguages(safeT)

  return (
    <div className="admin-section admin-section--violet admin-config-geral">
      {variant === 'full' ? (
        <h3 className="admin-section-title admin-section-title--violet">
          {safeT?.configuracoesGerais || 'CONFIGURAÇÕES GERAIS'}
        </h3>
      ) : (
        <h3 className="admin-section-title admin-section-title--violet">
          {safeT?.configuracoesGerais || 'CONFIGURAÇÕES GERAIS'}
        </h3>
      )}

      <div
        className={`admin-users-hub-admin-card${exigirSaidaCorrecta ? ' admin-users-hub-admin-card--active' : ''}`}
        style={{ marginBottom: 16 }}
      >
        <button
          type="button"
          className="admin-users-hub-admin-card__toggle"
          role="switch"
          aria-checked={exigirSaidaCorrecta}
          onClick={() => setExigirSaidaCorrecta(!exigirSaidaCorrecta)}
        >
          <span className="admin-users-hub-admin-card__icon" aria-hidden="true">
            🔐
          </span>
          <span className="admin-users-hub-admin-card__text">
            <strong>
              {(safeT as Record<string, string | undefined>)?.exigirSaidaCorrecta ||
                'Exigir saída correcta / Logout obrigatório'}
            </strong>
            <small>
              {(safeT as Record<string, string | undefined>)?.exigirSaidaCorrectaDesc ||
                'Activo: «Sair do sistema» guarda dados, limpa a sessão e pede novo login; avisa ao fechar o separador. Desactive só enquanto ajusta (sem aviso ao fechar).'}
            </small>
          </span>
          <span
            className={`admin-users-hub-switch${exigirSaidaCorrecta ? ' admin-users-hub-switch--on' : ''}`}
            aria-hidden="true"
          >
            <span />
          </span>
        </button>
      </div>

      <div className="admin-config-relatorio-card admin-config-idioma-card" style={{ marginBottom: 16 }}>
        <h4 className="admin-config-relatorio-card__title">
          {(safeT as Record<string, string | undefined>)?.configuraIdioma || 'CONFIGURA IDIOMA'}
        </h4>
        <p className="admin-config-relatorio-card__desc">
          {(safeT as Record<string, string | undefined>)?.configuraIdiomaDesc ||
            'Escolha o idioma da interface neste aparelho. A alteração aplica-se de imediato e fica guardada.'}
        </p>
        <label className="admin-config-relatorio-card__label" htmlFor="admin-config-idioma-select">
          {safeT?.selectLanguage || 'Selecionar Idioma'}
        </label>
        <select
          id="admin-config-idioma-select"
          className="ns-lang-select admin-config-idioma-select"
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          {languageOptions.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      {variant === 'full' ? (
        <div className="admin-config-relatorio-card">
          <h4 className="admin-config-relatorio-card__title">
            {safeT?.configuracaoRelatorios || 'Numeração dos relatórios'}
          </h4>
          <p className="admin-config-relatorio-card__desc">
            {safeT?.contadorRelatoriosDesc ||
              'Formato AAAAMMDD-NNN — número sequencial por dia de serviço.'}
          </p>
          <p className="admin-config-relatorio-card__label">
            {(safeT as Record<string, string | undefined>)?.preverNumeroRelatorioHojeLabel ||
              'Próximo número sugerido para hoje'}
          </p>
          <p className="admin-config-relatorio-card__number">
            {preverProximoNumeroRelatorio(new Date().toISOString().split('T')[0])}
          </p>
        </div>
      ) : null}

      <AdminLogosHub safeT={safeT} variant={variant} {...logoProps} />
    </div>
  )
}

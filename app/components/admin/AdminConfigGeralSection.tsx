'use client'

import React from 'react'
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
  administradorAddBibliotecaLogo: (e: React.ChangeEvent<HTMLInputElement>) => void
  commitAdminBibliotecaLogoDraft: () => void | Promise<void>
  discardAdminBibliotecaLogoDraft: () => void
  getSelectedLogoIdForSituation: (situationId: PdfLogoSituationId) => string
  setSelectedLogoIdForSituation: (situationId: PdfLogoSituationId, logoId: string) => void
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
    ...logoProps
  } = props

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

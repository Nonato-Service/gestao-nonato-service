'use client'

import React from 'react'
import { NonatoBrandLogo } from '../NonatoBrandLogo'
import { AdminPdfLogosBySituation } from './AdminPdfLogosBySituation'
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

export function AdminConfigGeralSection({
  variant = 'full',
  safeT,
  preverProximoNumeroRelatorio,
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
  logoRelatorioSelecionadoId,
  logoFechamentoSelecionadoId,
  logoOrcamentoSelecionadoId,
  logoProtocoloServicoSelecionadoId,
  incluirLogoNosRelatorios,
  incluirLogoFechamentosDespesas,
  setIncluirLogoNosRelatorios,
  setIncluirLogoFechamentosDespesas,
  saveData,
  administradorPreviewPdfLogo,
  aplicarLogoUnificadoTodosPdfs,
  administradorAddBibliotecaLogo,
  commitAdminBibliotecaLogoDraft,
  discardAdminBibliotecaLogoDraft,
  getSelectedLogoIdForSituation,
  setSelectedLogoIdForSituation,
  administradorUploadLogoForSituation,
  administradorClearLogoForSituation,
  administradorRemoveBibliotecaLogo,
}: AdminConfigGeralSectionProps) {
  const pdfLogosProps = {
    safeT,
    pdfLogosModoUnificado,
    setPdfLogosModoUnificado,
    logosRelatorios,
    logoRelatorioSelecionadoId,
    logoFechamentoSelecionadoId,
    logoOrcamentoSelecionadoId,
    logoProtocoloServicoSelecionadoId,
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
  }
  if (variant === 'compact') {
    return (
            <div className="admin-section admin-section--violet">
              <h3 className="admin-section-title admin-section-title--violet">
                {safeT?.configuracoesGerais || 'CONFIGURAÇÕES GERAIS'}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#1e1e1e', borderRadius: '6px' }}>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '5px' }}>{(safeT as any)?.logoBarraLateral || 'Logo da Barra Lateral'}</strong>
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>{safeT?.selectImageOrVideo || 'Imagem ou Vídeo MP4. Aparece no menu lateral.'}</span>
                  </div>
                  <label className="btn-primary" style={{ display: 'inline-block', cursor: 'pointer', padding: '8px 15px', margin: 0 }}>
                    {safeT?.changeLogo || 'Alterar Logo'}
                    <input type="file" accept="image/*,video/mp4" onChange={handleFileChangeSidebarLogo} style={{ display: 'none' }} />
                  </label>
                </div>
                {(adminSidebarLogoDraft || logoUrl) && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#1e1e1e',
                      borderRadius: '6px',
                      border: adminSidebarLogoDraft ? '1px solid rgba(255,180,0,0.45)' : undefined,
                    }}
                  >
                    <div style={{ marginBottom: '10px' }}>
                      {adminSidebarLogoDraft ? (
                        adminSidebarLogoDraft.isVideo ? (
                          <video
                            src={adminSidebarLogoDraft.previewUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{ maxWidth: '200px', maxHeight: '100px', borderRadius: '4px' }}
                          />
                        ) : (
                          <img
                            src={adminSidebarLogoDraft.previewUrl}
                            alt=""
                            style={{ maxWidth: '200px', maxHeight: '100px', borderRadius: '4px' }}
                          />
                        )
                      ) : logoType === 'video' ? (
                        <video
                          src={logoUrl || ''}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{ maxWidth: '200px', maxHeight: '100px', borderRadius: '4px' }}
                        />
                      ) : (
                        <img src={logoUrl || ''} alt="Logo barra lateral" style={{ maxWidth: '200px', maxHeight: '100px', borderRadius: '4px' }} />
                      )}
                    </div>
                    {adminSidebarLogoDraft ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,200,140,0.95)', margin: 0, lineHeight: 1.45 }}>
                          {(safeT as any)?.adminLogoSalvarParaAplicar ||
                            'Ainda não gravado — clique em «Guardar» para aplicar ou «Descartar rascunho» para cancelar.'}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={adminLogoSavingSidebar}
                            onClick={() => void commitAdminSidebarLogoDraft()}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            {(safeT as any)?.guardar || safeT?.save || 'Guardar'}
                          </button>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={adminLogoSavingSidebar}
                            onClick={discardAdminSidebarLogoDraft}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              borderColor: 'rgba(255,255,255,0.25)',
                              color: 'rgba(255,255,255,0.88)',
                            }}
                          >
                            {(safeT as any)?.adminLogoDescartarRascunho || safeT?.cancel || 'Descartar rascunho'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn-danger" onClick={handleRemoveSidebarLogo} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        {safeT?.removeLogo || 'Remover Logo'}
                      </button>
                    )}
                  </div>
                )}
                <AdminPdfLogosBySituation variant="compact" {...pdfLogosProps} />
              </div>
            </div>
    )
  }
  return (
            <div className="admin-section admin-section--violet">
              
              {/* Numeração automática dos relatórios de serviço (AAAAMMDD-NNN) */}
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid rgba(0, 200, 83, 0.3)' }}>
                <h4 style={{ color: '#00c853', marginBottom: '15px', fontSize: '16px' }}>
                  {safeT?.configuracaoRelatorios || 'CONFIGURAÇÃO DE RELATÓRIOS'}
                </h4>
                <div style={{ padding: '12px 14px', backgroundColor: '#141414', borderRadius: '8px', border: '1px solid rgba(0, 200, 83, 0.2)' }}>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.88)', margin: '0 0 10px', lineHeight: 1.45 }}>
                    {(safeT as any)?.numeracaoRelatoriosAutoTitle || 'Numeração automática dos relatórios de serviço'}
                  </p>
                  <p style={{ fontSize: '12px', opacity: 0.72, margin: '0 0 12px', lineHeight: 1.45 }}>
                    {safeT?.contadorRelatoriosDesc ||
                      'Formato: AAAAMMDD-NNN (ano, mês, dia, hífen, ordem do dia). O mesmo dia com vários clientes fica 001, 002, 003… sem confundir com o mês.'}
                  </p>
                  <p style={{ fontSize: '12px', marginBottom: '6px', opacity: 0.8 }}>
                    {(safeT as any)?.preverNumeroRelatorioHojeLabel || 'Próximo número sugerido para a data de hoje'}
                  </p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#00c853', margin: 0, letterSpacing: '0.02em' }}>
                    {preverProximoNumeroRelatorio(new Date().toISOString().split('T')[0])}
                  </p>
                </div>
              </div>

                {/* Logos na interface (barra lateral + painel) — grelha padronizada */}
                <div style={{ marginTop: '22px', padding: '18px', backgroundColor: '#141414', borderRadius: '8px', border: '1px solid rgba(0, 200, 83, 0.25)' }}>
                  <h4 style={{ color: '#00c853', margin: '0 0 6px 0', fontSize: '15px', letterSpacing: '0.04em' }}>
                    {(safeT as any)?.adminLogosInterfaceTitle || 'Logos na interface'}
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                    {(safeT as any)?.adminLogosInterfaceDesc || 'Imagem ou vídeo MP4 para o menu lateral e para o ecrã inicial. A pré-visualização mostra o que está ativo em cada fase.'}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div style={{ padding: '14px', backgroundColor: '#121212', borderRadius: '10px', border: '1px solid rgba(0, 200, 83, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#00c853', letterSpacing: '0.12em' }}>UI · 01</span>
                          <strong style={{ display: 'block', marginTop: '4px', fontSize: '14px', color: '#fff' }}>{(safeT as any)?.logoBarraLateral || 'Logo da barra lateral'}</strong>
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{safeT?.selectImageOrVideo || 'Imagem ou Vídeo MP4. Aparece no menu lateral.'}</span>
                        </div>
                        <label className="btn-primary" style={{ display: 'inline-block', cursor: 'pointer', padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}>
                          {safeT?.changeLogo || 'Alterar'}
                          <input type="file" accept="image/*,video/mp4" onChange={handleFileChangeSidebarLogo} style={{ display: 'none' }} />
                        </label>
                      </div>
                      <div
                        style={{
                          minHeight: '100px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          backgroundColor: adminSidebarLogoDraft ? 'rgba(255,160,0,0.08)' : '#0d0d0d',
                          borderRadius: '8px',
                          border: adminSidebarLogoDraft ? '1px solid rgba(255,180,0,0.45)' : '1px dashed rgba(0,200,83,0.25)',
                          padding: '10px',
                        }}
                      >
                        {adminSidebarLogoDraft ? (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffb74d', letterSpacing: '0.08em' }}>
                            {(safeT as any)?.adminLogoRascunhoBadge || 'Rascunho'}
                          </span>
                        ) : null}
                        {adminSidebarLogoDraft || logoUrl ? (
                          (adminSidebarLogoDraft ? adminSidebarLogoDraft.isVideo : logoType === 'video') ? (
                            <video
                              src={adminSidebarLogoDraft ? adminSidebarLogoDraft.previewUrl : logoUrl || ''}
                              autoPlay
                              loop
                              muted
                              playsInline
                              style={{ maxWidth: '100%', maxHeight: '96px', borderRadius: '6px', objectFit: 'contain' }}
                            />
                          ) : (
                            <img
                              src={adminSidebarLogoDraft ? adminSidebarLogoDraft.previewUrl : logoUrl || ''}
                              alt=""
                              style={{ maxWidth: '100%', maxHeight: '96px', objectFit: 'contain', borderRadius: '6px' }}
                            />
                          )
                        ) : (
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{(safeT as any)?.adminSemLogoPreview || 'Sem logo'}</span>
                        )}
                      </div>
                      {adminSidebarLogoDraft ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <p style={{ fontSize: '11px', color: 'rgba(255,200,140,0.95)', margin: 0, lineHeight: 1.45 }}>
                            {(safeT as any)?.adminLogoSalvarParaAplicar ||
                              'Ainda não gravado — use «Guardar» para aplicar ou «Descartar rascunho» para cancelar.'}
                          </p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn-primary"
                              disabled={adminLogoSavingSidebar}
                              onClick={() => void commitAdminSidebarLogoDraft()}
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                            >
                              {(safeT as any)?.guardar || safeT?.save || 'Guardar'}
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              disabled={adminLogoSavingSidebar}
                              onClick={discardAdminSidebarLogoDraft}
                              style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                backgroundColor: 'rgba(255,255,255,0.06)',
                                borderColor: 'rgba(255,255,255,0.25)',
                                color: 'rgba(255,255,255,0.88)',
                              }}
                            >
                              {(safeT as any)?.adminLogoDescartarRascunho || safeT?.cancel || 'Descartar rascunho'}
                            </button>
                          </div>
                        </div>
                      ) : null}
                      {logoUrl && !adminSidebarLogoDraft ? (
                        <button type="button" className="btn-danger" onClick={handleRemoveSidebarLogo} style={{ padding: '6px 12px', fontSize: '12px', alignSelf: 'flex-start' }}>{safeT?.removeLogo || 'Remover logo'}</button>
                      ) : null}
                    </div>
                    <div style={{ padding: '14px', backgroundColor: '#121212', borderRadius: '10px', border: '1px solid rgba(0, 200, 83, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#00c853', letterSpacing: '0.12em' }}>UI · 02</span>
                          <strong style={{ display: 'block', marginTop: '4px', fontSize: '14px', color: '#fff' }}>{(safeT as any)?.logoDashboard || 'Logo do Dashboard'}</strong>
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{safeT?.selectImageOrVideo || 'Imagem ou Vídeo MP4. Aparece na tela inicial (painel de controlo).'}</span>
                        </div>
                        <label className="btn-primary" style={{ display: 'inline-block', cursor: 'pointer', padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}>
                          {safeT?.changeLogo || 'Alterar'}
                          <input type="file" accept="image/*,video/mp4" onChange={handleFileChangeDashboardLogo} style={{ display: 'none' }} />
                        </label>
                      </div>
                      <div
                        style={{
                          minHeight: '100px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          backgroundColor: adminDashboardLogoDraft ? 'rgba(255,160,0,0.08)' : '#0d0d0d',
                          borderRadius: '8px',
                          border: adminDashboardLogoDraft ? '1px solid rgba(255,180,0,0.45)' : '1px dashed rgba(0,200,83,0.25)',
                          padding: '10px',
                        }}
                      >
                        {adminDashboardLogoDraft ? (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffb74d', letterSpacing: '0.08em' }}>
                            {(safeT as any)?.adminLogoRascunhoBadge || 'Rascunho'}
                          </span>
                        ) : null}
                        {adminDashboardLogoDraft || logoUrlDashboard ? (
                          (adminDashboardLogoDraft ? adminDashboardLogoDraft.isVideo : logoTypeDashboard === 'video') ? (
                            <video
                              src={adminDashboardLogoDraft ? adminDashboardLogoDraft.previewUrl : logoUrlDashboard || ''}
                              autoPlay
                              loop
                              muted
                              playsInline
                              style={{ maxWidth: '100%', maxHeight: '96px', borderRadius: '6px', objectFit: 'contain' }}
                            />
                          ) : (
                            <img
                              src={adminDashboardLogoDraft ? adminDashboardLogoDraft.previewUrl : logoUrlDashboard || ''}
                              alt=""
                              style={{ maxWidth: '100%', maxHeight: '96px', objectFit: 'contain', borderRadius: '6px' }}
                            />
                          )
                        ) : (
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{(safeT as any)?.adminSemLogoPreview || 'Sem logo'}</span>
                        )}
                      </div>
                      {adminDashboardLogoDraft ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <p style={{ fontSize: '11px', color: 'rgba(255,200,140,0.95)', margin: 0, lineHeight: 1.45 }}>
                            {(safeT as any)?.adminLogoSalvarParaAplicar ||
                              'Ainda não gravado — use «Guardar» para aplicar ou «Descartar rascunho» para cancelar.'}
                          </p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn-primary"
                              disabled={adminLogoSavingDashboard}
                              onClick={() => void commitAdminDashboardLogoDraft()}
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                            >
                              {(safeT as any)?.guardar || safeT?.save || 'Guardar'}
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              disabled={adminLogoSavingDashboard}
                              onClick={discardAdminDashboardLogoDraft}
                              style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                backgroundColor: 'rgba(255,255,255,0.06)',
                                borderColor: 'rgba(255,255,255,0.25)',
                                color: 'rgba(255,255,255,0.88)',
                              }}
                            >
                              {(safeT as any)?.adminLogoDescartarRascunho || safeT?.cancel || 'Descartar rascunho'}
                            </button>
                          </div>
                        </div>
                      ) : null}
                      {logoUrlDashboard && !adminDashboardLogoDraft ? (
                        <button type="button" className="btn-danger" onClick={handleRemoveDashboardLogo} style={{ padding: '6px 12px', fontSize: '12px', alignSelf: 'flex-start' }}>{safeT?.removeLogo || 'Remover logo'}</button>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(0,255,122,0.18)' }}>
                    <h5 style={{ color: '#2ecc71', margin: '0 0 8px', fontSize: '13px', letterSpacing: '0.03em' }}>
                      {(safeT as any)?.brandSituationsTitle || 'Marca NONATO — variações por situação'}
                    </h5>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: '0 0 12px', lineHeight: 1.45 }}>
                      {(safeT as any)?.brandSituationsDesc || 'Ficheiro base em /brand/nonato-logo-original.png; tons por contexto (CSS). Útil para alertas, financeiro, ecrãs de estado.'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
                      {([
                        ['original', (safeT as any)?.brandVariantOriginal || 'Original'],
                        ['sucesso', (safeT as any)?.brandVariantSucesso || 'Sucesso'],
                        ['alerta', (safeT as any)?.brandVariantAlerta || 'Alerta'],
                        ['devedor', (safeT as any)?.brandVariantDevedor || 'Dívida / urgência'],
                        ['financeiro', (safeT as any)?.brandVariantFinanceiro || 'Financeiro'],
                        ['informacao', (safeT as any)?.brandVariantInformacao || 'Informação'],
                      ] as const).map(([variant, label]) => (
                        <div key={variant} style={{ textAlign: 'center', width: '92px' }}>
                          <NonatoBrandLogo variant={variant} style={{ height: 42, width: 'auto', margin: '0 auto 6px', display: 'block' }} alt="" />
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.25, display: 'block' }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <AdminPdfLogosBySituation variant="full" {...pdfLogosProps} />
            </div>
  )
}

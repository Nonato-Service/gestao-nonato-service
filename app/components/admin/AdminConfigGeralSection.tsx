'use client'

import React from 'react'
import { NonatoBrandLogo } from '../NonatoBrandLogo'
import type { AdminBibliotecaLogoDraft, AdminInterfaceLogoDraft, LogoRelatorio, SafeT } from './adminTypes'

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
  setLogosRelatorios: React.Dispatch<React.SetStateAction<LogoRelatorio[]>>
  setLogoRelatorioSelecionadoId: (v: string) => void
  setLogoFechamentoSelecionadoId: (v: string) => void
  setLogoOrcamentoSelecionadoId: (v: string) => void
  setLogoProtocoloServicoSelecionadoId: (v: string) => void
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
  administradorPreviewPdfLogo: (selectedId: string) => string | null
  aplicarLogoUnificadoTodosPdfs: (logoId: string) => void
  administradorAddBibliotecaLogo: (e: React.ChangeEvent<HTMLInputElement>) => void
  commitAdminBibliotecaLogoDraft: () => void | Promise<void>
  discardAdminBibliotecaLogoDraft: () => void
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
  setLogosRelatorios,
  setLogoRelatorioSelecionadoId,
  setLogoFechamentoSelecionadoId,
  setLogoOrcamentoSelecionadoId,
  setLogoProtocoloServicoSelecionadoId,
  saveData,
  administradorPreviewPdfLogo,
  aplicarLogoUnificadoTodosPdfs,
  administradorAddBibliotecaLogo,
  commitAdminBibliotecaLogoDraft,
  discardAdminBibliotecaLogoDraft,
}: AdminConfigGeralSectionProps) {
  if (variant === 'compact') {
    return (
            <div className="admin-section admin-section--violet">
              <h3 className="admin-section-title admin-section-title--violet">
                {safeT?.configuracoesGerais || 'CONFIGURAÇÕES GERAIS'}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#222222', borderRadius: '6px' }}>
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
                      backgroundColor: '#222222',
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
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0, 255, 0, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#222222', borderRadius: '6px' }}>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '5px' }}>{(safeT as any)?.logoDashboard || 'Logo do Dashboard'}</strong>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>{safeT?.selectImageOrVideo || 'Imagem ou Vídeo MP4. Aparece na tela inicial (painel de controlo).'}</span>
                    </div>
                    <label className="btn-primary" style={{ display: 'inline-block', cursor: 'pointer', padding: '8px 15px', margin: 0 }}>
                      {safeT?.changeLogo || 'Alterar Logo'}
                      <input type="file" accept="image/*,video/mp4" onChange={handleFileChangeDashboardLogo} style={{ display: 'none' }} />
                    </label>
                  </div>
                  {(adminDashboardLogoDraft || logoUrlDashboard) && (
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: '#222222',
                        borderRadius: '6px',
                        marginTop: '10px',
                        border: adminDashboardLogoDraft ? '1px solid rgba(255,180,0,0.45)' : undefined,
                      }}
                    >
                      <div style={{ marginBottom: '10px' }}>
                        {adminDashboardLogoDraft ? (
                          adminDashboardLogoDraft.isVideo ? (
                            <video
                              src={adminDashboardLogoDraft.previewUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              style={{ maxWidth: '200px', maxHeight: '100px', borderRadius: '4px' }}
                            />
                          ) : (
                            <img
                              src={adminDashboardLogoDraft.previewUrl}
                              alt=""
                              style={{ maxWidth: '200px', maxHeight: '100px', borderRadius: '4px' }}
                            />
                          )
                        ) : logoTypeDashboard === 'video' ? (
                          <video
                            src={logoUrlDashboard || ''}
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{ maxWidth: '200px', maxHeight: '100px', borderRadius: '4px' }}
                          />
                        ) : (
                          <img src={logoUrlDashboard || ''} alt="Logo dashboard" style={{ maxWidth: '200px', maxHeight: '100px', borderRadius: '4px' }} />
                        )}
                      </div>
                      {adminDashboardLogoDraft ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <p style={{ fontSize: '11px', color: 'rgba(255,200,140,0.95)', margin: 0, lineHeight: 1.45 }}>
                            {(safeT as any)?.adminLogoSalvarParaAplicar ||
                              'Ainda não gravado — clique em «Guardar» para aplicar ou «Descartar rascunho» para cancelar.'}
                          </p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn-primary"
                              disabled={adminLogoSavingDashboard}
                              onClick={() => void commitAdminDashboardLogoDraft()}
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              {(safeT as any)?.guardar || safeT?.save || 'Guardar'}
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              disabled={adminLogoSavingDashboard}
                              onClick={discardAdminDashboardLogoDraft}
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
                        <button className="btn-danger" onClick={handleRemoveDashboardLogo} style={{ padding: '6px 12px', fontSize: '12px' }}>
                          {safeT?.removeLogo || 'Remover Logo'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0, 255, 0, 0.2)' }}>
                  <strong style={{ display: 'block', marginBottom: '6px', color: '#00ff00' }}>
                    {(safeT as any)?.adminLogosPdfTitle || 'Logos nos documentos PDF'}
                  </strong>
                  <p style={{ fontSize: '12px', opacity: 0.72, margin: '0 0 12px', lineHeight: 1.45 }}>
                    {(safeT as any)?.adminLogosPdfDescCompact ||
                      'Anexe a imagem do logo, clique em «Guardar na biblioteca» e confirme a pré-visualização abaixo. Marque «Incluir nos PDF».'}
                  </p>
                  <div style={{ marginBottom: '14px', padding: '12px', backgroundColor: '#222', borderRadius: '8px', border: '1px solid rgba(255, 180, 0, 0.35)' }}>
                    <strong style={{ fontSize: '12px', color: '#fff', display: 'block', marginBottom: '8px' }}>
                      {(safeT as any)?.pdfLogosModoTitulo || 'Modo dos logos nos PDFs'}
                    </strong>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.95)', marginBottom: '8px' }}>
                      <input
                        type="radio"
                        name="pdf-logos-modo-compact"
                        checked={pdfLogosModoUnificado}
                        onChange={() => {
                          if (pdfLogosModoUnificado) return
                          setPdfLogosModoUnificado(true)
                          saveData('nonato-pdf-logos-unificado', true)
                          aplicarLogoUnificadoTodosPdfs(logoRelatorioSelecionadoId || '')
                        }}
                        style={{ width: '16px', height: '16px', accentColor: '#00ff00', marginTop: '2px', flexShrink: 0 }}
                      />
                      <span>{(safeT as any)?.pdfLogosModoUnificadoLabel || 'Um único logo para todos os documentos PDF'}</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.95)' }}>
                      <input
                        type="radio"
                        name="pdf-logos-modo-compact"
                        checked={!pdfLogosModoUnificado}
                        onChange={() => {
                          if (!pdfLogosModoUnificado) return
                          setPdfLogosModoUnificado(false)
                          saveData('nonato-pdf-logos-unificado', false)
                        }}
                        style={{ width: '16px', height: '16px', accentColor: '#00ff00', marginTop: '2px', flexShrink: 0 }}
                      />
                      <span>{(safeT as any)?.pdfLogosModoPorTipoLabel || 'Logo diferente em cada tipo de documento'}</span>
                    </label>
                  </div>
                  <label
                    className="btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      padding: '10px 16px',
                      margin: '0 0 12px',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    <span aria-hidden="true">📎</span>
                    {(safeT as any)?.adicionarLogoRelatorios || 'Anexar logo (PNG/JPG)'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => administradorAddBibliotecaLogo(e)}
                    />
                  </label>
                  {adminBibliotecaLogoDraft ? (
                    <div
                      style={{
                        marginBottom: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,180,0,0.45)',
                        backgroundColor: 'rgba(255,160,0,0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <img
                          src={adminBibliotecaLogoDraft.previewUrl}
                          alt=""
                          style={{ maxWidth: '120px', maxHeight: '72px', objectFit: 'contain', background: '#fff', padding: '6px', borderRadius: '6px' }}
                        />
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                          <strong>{adminBibliotecaLogoDraft.fileName}</strong>
                          <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,200,140,0.95)' }}>
                            {(safeT as any)?.adminLogoSalvarParaAplicar ||
                              'Clique em «Guardar na biblioteca» para ver o logo nos relatórios PDF.'}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={adminBibliotecaLogoSaving}
                          onClick={() => void commitAdminBibliotecaLogoDraft()}
                          style={{ padding: '8px 14px', fontSize: '13px' }}
                        >
                          {(safeT as any)?.adminBibliotecaSalvarNaBiblioteca || 'Guardar na biblioteca'}
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={adminBibliotecaLogoSaving}
                          onClick={discardAdminBibliotecaLogoDraft}
                          style={{ padding: '8px 14px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.88)' }}
                        >
                          {(safeT as any)?.adminLogoDescartarRascunho || safeT?.cancel || 'Descartar rascunho'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {logosRelatorios.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      {logosRelatorios.map((l) => (
                        <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', backgroundColor: '#222', borderRadius: '6px' }}>
                          {l.type === 'image' && l.data ? (
                            <img src={l.data} alt={l.name} style={{ width: '56px', height: '40px', objectFit: 'contain', background: '#fff', borderRadius: '4px', padding: '2px' }} />
                          ) : null}
                          <span style={{ fontSize: '12px', flex: 1 }}>{l.name || l.id}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', marginBottom: '10px' }}>
                    <input
                      type="checkbox"
                      checked={incluirLogoNosRelatorios}
                      onChange={(e) => {
                        const v = e.target.checked
                        setIncluirLogoNosRelatorios(v)
                        saveData('nonato-relatorios-incluir-logo', v)
                      }}
                      style={{ width: '16px', height: '16px', accentColor: '#00ff00' }}
                    />
                    {safeT?.incluirLogoNosRelatorios || 'Incluir logo nos relatórios gerados (PDF)'}
                  </label>
                  <div style={{ minHeight: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d', borderRadius: '8px', border: '1px dashed rgba(0,255,0,0.35)', padding: '10px', marginBottom: '10px' }}>
                    {adminBibliotecaLogoDraft?.previewUrl ? (
                      <img src={adminBibliotecaLogoDraft.previewUrl} alt="" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                    ) : administradorPreviewPdfLogo(logoRelatorioSelecionadoId) ? (
                      <img src={administradorPreviewPdfLogo(logoRelatorioSelecionadoId) || ''} alt="" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
                        {(safeT as any)?.adminSemLogoPdf || 'Nenhum logo visível — anexe uma imagem PNG ou JPG acima.'}
                      </span>
                    )}
                  </div>
                  <select
                    value={logoRelatorioSelecionadoId}
                    onChange={(e) => {
                      const v = e.target.value
                      if (pdfLogosModoUnificado) {
                        aplicarLogoUnificadoTodosPdfs(v)
                      } else {
                        setLogoRelatorioSelecionadoId(v)
                        saveData('nonato-relatorios-logo-id', v)
                      }
                    }}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '6px', fontSize: '13px' }}
                  >
                    <option value="">{safeT?.logoPrincipal || 'Logo principal (barra lateral)'}</option>
                    {logosRelatorios.filter((l) => l.type === 'image').map((l) => (
                      <option key={l.id} value={l.id}>{l.name || l.id}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
    )
  }
  return (
            <div className="admin-section admin-section--violet">
              
              {/* Numeração automática dos relatórios de serviço (AAAAMMDD-NNN) */}
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#222222', borderRadius: '6px', border: '1px solid rgba(0, 255, 0, 0.3)' }}>
                <h4 style={{ color: '#00ff00', marginBottom: '15px', fontSize: '16px' }}>
                  {safeT?.configuracaoRelatorios || 'CONFIGURAÇÃO DE RELATÓRIOS'}
                </h4>
                <div style={{ padding: '12px 14px', backgroundColor: '#141414', borderRadius: '8px', border: '1px solid rgba(0, 255, 0, 0.2)' }}>
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
                  <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ff00', margin: 0, letterSpacing: '0.02em' }}>
                    {preverProximoNumeroRelatorio(new Date().toISOString().split('T')[0])}
                  </p>
                </div>
              </div>

                {/* Logos na interface (barra lateral + painel) — grelha padronizada */}
                <div style={{ marginTop: '22px', padding: '18px', backgroundColor: '#141414', borderRadius: '8px', border: '1px solid rgba(0, 255, 0, 0.25)' }}>
                  <h4 style={{ color: '#00ff00', margin: '0 0 6px 0', fontSize: '15px', letterSpacing: '0.04em' }}>
                    {(safeT as any)?.adminLogosInterfaceTitle || 'Logos na interface'}
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                    {(safeT as any)?.adminLogosInterfaceDesc || 'Imagem ou vídeo MP4 para o menu lateral e para o ecrã inicial. A pré-visualização mostra o que está ativo em cada fase.'}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div style={{ padding: '14px', backgroundColor: '#1a1a1a', borderRadius: '10px', border: '1px solid rgba(0, 255, 0, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#00ff00', letterSpacing: '0.12em' }}>UI · 01</span>
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
                          border: adminSidebarLogoDraft ? '1px solid rgba(255,180,0,0.45)' : '1px dashed rgba(0,255,0,0.25)',
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
                    <div style={{ padding: '14px', backgroundColor: '#1a1a1a', borderRadius: '10px', border: '1px solid rgba(0, 255, 0, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#00ff00', letterSpacing: '0.12em' }}>UI · 02</span>
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
                          border: adminDashboardLogoDraft ? '1px solid rgba(255,180,0,0.45)' : '1px dashed rgba(0,255,0,0.25)',
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
                    <h5 style={{ color: '#00ff88', margin: '0 0 8px', fontSize: '13px', letterSpacing: '0.03em' }}>
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

                {/* PDFs: biblioteca única + cartões por fase com pré-visualização */}
                <div style={{ marginTop: '22px', padding: '18px', backgroundColor: '#141414', borderRadius: '8px', border: '1px solid rgba(0, 255, 0, 0.25)' }}>
                  <h4 style={{ color: '#00ff00', margin: '0 0 6px 0', fontSize: '15px', letterSpacing: '0.04em' }}>
                    {(safeT as any)?.adminLogosPdfTitle || 'Logos nos documentos PDF'}
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                    {(safeT as any)?.adminLogosPdfDesc || 'Adicione imagens à biblioteca uma vez; em cada fase escolha o logo e veja a pré-visualização. «Logo principal» = imagem da barra lateral (vídeo não entra em PDF).'}
                  </p>
                  <div style={{ marginBottom: '16px', padding: '14px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid rgba(255, 180, 0, 0.35)' }}>
                    <strong style={{ fontSize: '13px', color: '#fff', display: 'block', marginBottom: '10px' }}>
                      {(safeT as any)?.pdfLogosModoTitulo || 'Modo dos logos nos PDFs'}
                    </strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'rgba(255,255,255,0.95)' }}>
                        <input
                          type="radio"
                          name="pdf-logos-modo-ns"
                          checked={pdfLogosModoUnificado}
                          onChange={() => {
                            if (pdfLogosModoUnificado) return
                            setPdfLogosModoUnificado(true)
                            saveData('nonato-pdf-logos-unificado', true)
                            aplicarLogoUnificadoTodosPdfs(logoRelatorioSelecionadoId || '')
                          }}
                          style={{ width: '18px', height: '18px', accentColor: '#00ff00', marginTop: '2px', flexShrink: 0 }}
                        />
                        <span>{(safeT as any)?.pdfLogosModoUnificadoLabel || 'Um único logo para todos os documentos PDF (relatórios, fechamentos, orçamentos, protocolos)'}</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'rgba(255,255,255,0.95)' }}>
                        <input
                          type="radio"
                          name="pdf-logos-modo-ns"
                          checked={!pdfLogosModoUnificado}
                          onChange={() => {
                            if (!pdfLogosModoUnificado) return
                            setPdfLogosModoUnificado(false)
                            saveData('nonato-pdf-logos-unificado', false)
                          }}
                          style={{ width: '18px', height: '18px', accentColor: '#00ff00', marginTop: '2px', flexShrink: 0 }}
                        />
                        <span>{(safeT as any)?.pdfLogosModoPorTipoLabel || 'Logo diferente em cada tipo de documento'}</span>
                      </label>
                    </div>
                    <p style={{ margin: '12px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 }}>
                      {(safeT as any)?.pdfLogosModoAjuda || 'Use um logo comum para manter a identidade igual em tudo; ou defina imagens distintas quando precisar (por exemplo marca em relatórios e outra em orçamentos). A biblioteca de imagens é partilhada nos dois modos.'}
                    </p>
                  </div>
                  <div style={{ marginBottom: '18px', padding: '14px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid rgba(0, 255, 0, 0.2)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <strong style={{ fontSize: '13px', color: '#fff' }}>{safeT?.logosDisponiveisRelatorios || 'Biblioteca de imagens para PDFs'}</strong>
                      <label className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', fontSize: '14px', fontWeight: 700 }}>
                        <span aria-hidden="true">📎</span>
                        {(safeT as any)?.adicionarLogoRelatorios || 'Anexar logo (PNG/JPG)'}
                        <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/*" style={{ display: 'none' }} onChange={(e) => administradorAddBibliotecaLogo(e)} />
                      </label>
                    </div>
                    {adminBibliotecaLogoDraft ? (
                      <div
                        style={{
                          marginBottom: '12px',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,180,0,0.45)',
                          backgroundColor: 'rgba(255,160,0,0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffb74d', letterSpacing: '0.08em' }}>
                          {(safeT as any)?.adminLogoRascunhoBadge || 'Rascunho'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <div
                            style={{
                              width: '72px',
                              height: '52px',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#0d0d0d',
                              borderRadius: '6px',
                            }}
                          >
                            <img
                              src={adminBibliotecaLogoDraft.previewUrl}
                              alt=""
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          </div>
                          <div style={{ minWidth: 0, flex: '1 1 160px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', wordBreak: 'break-word' }}>
                              {adminBibliotecaLogoDraft.fileName}
                            </div>
                            <p style={{ fontSize: '11px', color: 'rgba(255,200,140,0.95)', margin: '6px 0 0', lineHeight: 1.45 }}>
                              {(safeT as any)?.adminLogoSalvarParaAplicar ||
                                'Ainda não gravado — use «Guardar na biblioteca» ou «Descartar rascunho».'}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={adminBibliotecaLogoSaving}
                            onClick={() => void commitAdminBibliotecaLogoDraft()}
                            style={{ padding: '8px 14px', fontSize: '13px' }}
                          >
                            {(safeT as any)?.adminBibliotecaSalvarNaBiblioteca || 'Guardar na biblioteca'}
                          </button>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={adminBibliotecaLogoSaving}
                            onClick={discardAdminBibliotecaLogoDraft}
                            style={{
                              padding: '8px 14px',
                              fontSize: '13px',
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
                    {logosRelatorios.length === 0 && !adminBibliotecaLogoDraft ? (
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>{safeT?.nenhumLogoRelatorio || 'Nenhum logo adicional. Adicione imagens para além do logo principal.'}</p>
                    ) : logosRelatorios.length > 0 ? (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                          gap: '10px',
                        }}
                      >
                        {logosRelatorios.map((l) => (
                          <div
                            key={l.id}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: '#222',
                              borderRadius: '8px',
                              border: '1px solid rgba(0, 255, 0, 0.2)',
                              display: 'grid',
                              gridTemplateColumns: '56px minmax(0, 1fr) auto',
                              gap: '10px',
                              alignItems: 'center',
                              minWidth: 0,
                              maxWidth: '100%',
                              boxSizing: 'border-box',
                            }}
                          >
                            <div style={{ width: '56px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d', borderRadius: '4px', overflow: 'hidden' }}>
                              {l.type === 'image' && l.data ? (
                                <img src={l.data} alt={l.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                              ) : null}
                            </div>
                            <span style={{ fontSize: '12px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.name || l.id}>{l.name || l.id}</span>
                            <button
                              type="button"
                              className="btn-danger btn-danger--inline"
                              style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', justifySelf: 'end' }}
                              onClick={() => {
                                const next = logosRelatorios.filter((x) => x.id !== l.id)
                                setLogosRelatorios(next)
                                saveData('nonato-logos-relatorios', next)
                                if (logoRelatorioSelecionadoId === l.id) {
                                  setLogoRelatorioSelecionadoId('')
                                  saveData('nonato-relatorios-logo-id', '')
                                }
                                if (logoFechamentoSelecionadoId === l.id) {
                                  setLogoFechamentoSelecionadoId('')
                                  saveData('nonato-fechamentos-logo-id', '')
                                }
                                if (logoOrcamentoSelecionadoId === l.id) {
                                  setLogoOrcamentoSelecionadoId('')
                                  saveData('nonato-orcamento-logo-id', '')
                                }
                                if (logoProtocoloServicoSelecionadoId === l.id) {
                                  setLogoProtocoloServicoSelecionadoId('')
                                  saveData('nonato-protocolo-servico-logo-id', '')
                                }
                              }}
                            >
                              {safeT?.removeLogo || 'Remover'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {pdfLogosModoUnificado ? (
                  <div style={{ padding: '16px', backgroundColor: '#1a1a1a', borderRadius: '10px', border: '2px solid rgba(0, 180, 90, 0.45)', marginBottom: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#00ff00', letterSpacing: '0.12em' }}>PDF · ÚNICO</span>
                    <strong style={{ fontSize: '15px', color: '#fff' }}>{(safeT as any)?.pdfLogosUnificadoCabecalho || 'Logo único para todos os PDFs'}</strong>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{(safeT as any)?.pdfLogosUnificadoSub || 'Relatórios de serviço, fechamentos de despesas, orçamentos e protocolos usam o mesmo cabeçalho de imagem.'}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                        <input
                          type="checkbox"
                          checked={incluirLogoNosRelatorios}
                          onChange={(e) => {
                            const v = e.target.checked
                            setIncluirLogoNosRelatorios(v)
                            saveData('nonato-relatorios-incluir-logo', v)
                          }}
                          style={{ width: '16px', height: '16px', accentColor: '#00ff00' }}
                        />
                        {safeT?.incluirLogoNosRelatorios || 'Incluir nos PDF'}
                        <span style={{ color: '#888', fontSize: '11px' }}>· {safeT?.escolherLogoRelatorios || 'Relatórios'}</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                        <input
                          type="checkbox"
                          checked={incluirLogoFechamentosDespesas}
                          onChange={(e) => {
                            const v = e.target.checked
                            setIncluirLogoFechamentosDespesas(v)
                            saveData('nonato-fechamentos-incluir-logo', v)
                          }}
                          style={{ width: '16px', height: '16px', accentColor: '#00ff00' }}
                        />
                        {(safeT as any)?.incluirLogoFechamentosDespesasShort || 'Incluir nos PDF'}
                        <span style={{ color: '#888', fontSize: '11px' }}>· {(safeT as any)?.escolherLogoFechamentos || 'Fechamentos'}</span>
                      </label>
                    </div>
                    <div style={{ minHeight: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d', borderRadius: '8px', border: '1px dashed rgba(0,255,0,0.35)', padding: '8px' }}>
                      {adminBibliotecaLogoDraft?.previewUrl ? (
                        <img src={adminBibliotecaLogoDraft.previewUrl} alt="" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                      ) : administradorPreviewPdfLogo(logoRelatorioSelecionadoId) ? (
                        <img src={administradorPreviewPdfLogo(logoRelatorioSelecionadoId) || ''} alt="" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{(safeT as any)?.adminSemLogoPdf || 'Nenhum logo visível — anexe uma imagem PNG ou JPG na biblioteca acima.'}</span>
                      )}
                    </div>
                    <select
                      value={logoRelatorioSelecionadoId}
                      onChange={(e) => aplicarLogoUnificadoTodosPdfs(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '6px', fontSize: '13px' }}
                    >
                      <option value="">{safeT?.logoPrincipal || 'Logo principal (barra lateral)'}</option>
                      {logosRelatorios.filter((l) => l.type === 'image').map((l) => (
                        <option key={l.id} value={l.id}>{l.name || l.id}</option>
                      ))}
                    </select>
                  </div>
                  ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    {/* Fase PDF 1 — Relatórios */}
                    <div style={{ padding: '14px', backgroundColor: '#1a1a1a', borderRadius: '10px', border: '1px solid rgba(0, 255, 0, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#00ff00', letterSpacing: '0.12em' }}>PDF · 01</span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                          <input
                            type="checkbox"
                            checked={incluirLogoNosRelatorios}
                            onChange={(e) => {
                              const v = e.target.checked
                              setIncluirLogoNosRelatorios(v)
                              saveData('nonato-relatorios-incluir-logo', v)
                            }}
                            style={{ width: '16px', height: '16px', accentColor: '#00ff00' }}
                          />
                          {safeT?.incluirLogoNosRelatorios || 'Incluir nos PDF'}
                        </label>
                      </div>
                      <strong style={{ fontSize: '14px', color: '#fff' }}>{safeT?.escolherLogoRelatorios || 'Relatórios de serviço'}</strong>
                      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{safeT?.escolherLogoRelatoriosDesc || 'Cabeçalho dos relatórios de serviço exportados em PDF.'}</p>
                      <div style={{ minHeight: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d', borderRadius: '8px', border: '1px solid rgba(0,255,0,0.2)', padding: '8px' }}>
                        {administradorPreviewPdfLogo(logoRelatorioSelecionadoId) ? (
                          <img src={administradorPreviewPdfLogo(logoRelatorioSelecionadoId) || ''} alt="" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{(safeT as any)?.adminSemLogoPdf || 'Sem imagem (logo principal em vídeo ou inexistente)'}</span>
                        )}
                      </div>
                      <select
                        value={logoRelatorioSelecionadoId}
                        onChange={(e) => {
                          const v = e.target.value
                          setLogoRelatorioSelecionadoId(v)
                          saveData('nonato-relatorios-logo-id', v)
                          try {
                            localStorage.setItem('nonato-relatorios-logo-id', v)
                          } catch { /* ignorar */ }
                        }}
                        style={{ width: '100%', padding: '8px 10px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '6px', fontSize: '13px' }}
                      >
                        <option value="">{safeT?.logoPrincipal || 'Logo principal (barra lateral)'}</option>
                        {logosRelatorios.filter((l) => l.type === 'image').map((l) => (
                          <option key={l.id} value={l.id}>{l.name || l.id}</option>
                        ))}
                      </select>
                    </div>
                    {/* Fase PDF 2 — Fechamentos */}
                    <div style={{ padding: '14px', backgroundColor: '#1a1a1a', borderRadius: '10px', border: '1px solid rgba(0, 255, 0, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#00ff00', letterSpacing: '0.12em' }}>PDF · 02</span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                          <input
                            type="checkbox"
                            checked={incluirLogoFechamentosDespesas}
                            onChange={(e) => {
                              const v = e.target.checked
                              setIncluirLogoFechamentosDespesas(v)
                              saveData('nonato-fechamentos-incluir-logo', v)
                            }}
                            style={{ width: '16px', height: '16px', accentColor: '#00ff00' }}
                          />
                          {(safeT as any)?.incluirLogoFechamentosDespesasShort || 'Incluir nos PDF'}
                        </label>
                      </div>
                      <strong style={{ fontSize: '14px', color: '#fff' }}>{(safeT as any)?.escolherLogoFechamentos || 'Fechamentos de despesas'}</strong>
                      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{(safeT as any)?.escolherLogoFechamentosDesc || 'PDF de fechamento de despesas dos relatórios.'}</p>
                      <div style={{ minHeight: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d', borderRadius: '8px', border: '1px solid rgba(0,255,0,0.2)', padding: '8px' }}>
                        {administradorPreviewPdfLogo(logoFechamentoSelecionadoId) ? (
                          <img src={administradorPreviewPdfLogo(logoFechamentoSelecionadoId) || ''} alt="" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{(safeT as any)?.adminSemLogoPdf || 'Sem imagem (logo principal em vídeo ou inexistente)'}</span>
                        )}
                      </div>
                      <select
                        value={logoFechamentoSelecionadoId}
                        onChange={(e) => {
                          const v = e.target.value
                          setLogoFechamentoSelecionadoId(v)
                          saveData('nonato-fechamentos-logo-id', v)
                          try { localStorage.setItem('nonato-fechamentos-logo-id', v) } catch { /* ignorar */ }
                        }}
                        style={{ width: '100%', padding: '8px 10px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '6px', fontSize: '13px' }}
                      >
                        <option value="">{safeT?.logoPrincipal || 'Logo principal (barra lateral)'}</option>
                        {logosRelatorios.filter((l) => l.type === 'image').map((l) => (
                          <option key={l.id} value={l.id}>{l.name || l.id}</option>
                        ))}
                      </select>
                    </div>
                    {/* Fase PDF 3 — Orçamento */}
                    <div style={{ padding: '14px', backgroundColor: '#1a1a1a', borderRadius: '10px', border: '1px solid rgba(0, 255, 0, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#00ff00', letterSpacing: '0.12em' }}>PDF · 03</span>
                      <strong style={{ fontSize: '14px', color: '#fff' }}>{(safeT as any)?.escolherLogoOrcamento || 'Orçamentos'}</strong>
                      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{(safeT as any)?.escolherLogoOrcamentoDesc || 'Cabeçalho do PDF de orçamentos.'}</p>
                      <div style={{ minHeight: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d', borderRadius: '8px', border: '1px solid rgba(0,255,0,0.2)', padding: '8px' }}>
                        {administradorPreviewPdfLogo(logoOrcamentoSelecionadoId) ? (
                          <img src={administradorPreviewPdfLogo(logoOrcamentoSelecionadoId) || ''} alt="" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{(safeT as any)?.adminSemLogoPdf || 'Sem imagem (logo principal em vídeo ou inexistente)'}</span>
                        )}
                      </div>
                      <select
                        value={logoOrcamentoSelecionadoId}
                        onChange={(e) => {
                          const v = e.target.value
                          setLogoOrcamentoSelecionadoId(v)
                          saveData('nonato-orcamento-logo-id', v)
                          try { localStorage.setItem('nonato-orcamento-logo-id', v) } catch { /* ignorar */ }
                        }}
                        style={{ width: '100%', padding: '8px 10px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '6px', fontSize: '13px' }}
                      >
                        <option value="">{safeT?.logoPrincipal || 'Logo principal (barra lateral)'}</option>
                        {logosRelatorios.filter((l) => l.type === 'image').map((l) => (
                          <option key={l.id} value={l.id}>{l.name || l.id}</option>
                        ))}
                      </select>
                    </div>
                    {/* Fase PDF 4 — Protocolos */}
                    <div style={{ padding: '14px', backgroundColor: '#1a1a1a', borderRadius: '10px', border: '1px solid rgba(0, 255, 0, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#00ff00', letterSpacing: '0.12em' }}>PDF · 04</span>
                      <strong style={{ fontSize: '14px', color: '#fff' }}>{(safeT as any)?.escolherLogoProtocoloServico || 'Protocolos de serviço'}</strong>
                      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{(safeT as any)?.escolherLogoProtocoloServicoDesc || 'Cabeçalho do PDF dos protocolos.'}</p>
                      <div style={{ minHeight: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d', borderRadius: '8px', border: '1px solid rgba(0,255,0,0.2)', padding: '8px' }}>
                        {administradorPreviewPdfLogo(logoProtocoloServicoSelecionadoId) ? (
                          <img src={administradorPreviewPdfLogo(logoProtocoloServicoSelecionadoId) || ''} alt="" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{(safeT as any)?.adminSemLogoPdf || 'Sem imagem (logo principal em vídeo ou inexistente)'}</span>
                        )}
                      </div>
                      <select
                        value={logoProtocoloServicoSelecionadoId}
                        onChange={(e) => {
                          const v = e.target.value
                          setLogoProtocoloServicoSelecionadoId(v)
                          saveData('nonato-protocolo-servico-logo-id', v)
                          try { localStorage.setItem('nonato-protocolo-servico-logo-id', v) } catch { /* ignorar */ }
                        }}
                        style={{ width: '100%', padding: '8px 10px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '6px', fontSize: '13px' }}
                      >
                        <option value="">{safeT?.logoPrincipal || 'Logo principal (barra lateral)'}</option>
                        {logosRelatorios.filter((l) => l.type === 'image').map((l) => (
                          <option key={l.id} value={l.id}>{l.name || l.id}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  )}
                </div>
            </div>
  )
}

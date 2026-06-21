'use client'

import React from 'react'
import type { AutoBackup, CodeBackup, SafeT } from './adminTypes'

export type AdminBackupSectionProps = {
  variant?: 'full' | 'compact'
  safeT: SafeT
  isDemoMode: boolean
  selectedLanguage: string
  localeDatetimeGeneral: (lang: string) => string
  autoBackupEnabled: boolean
  autoBackupInterval: number
  setAutoBackupEnabled: (v: boolean) => void
  setAutoBackupInterval: (v: number) => void
  codeBackups: CodeBackup[]
  codeBackupsFolder: string
  loadingBackups: boolean
  restoringFromZip: boolean
  restoreFromZipInputRef: React.RefObject<HTMLInputElement>
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
  handleCreateBackup: () => void
  handleRestoreBackup: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleBackupCodigo: () => void
  handleDownloadBackupZip: () => void
  handleRestoreCodigo: (path: string) => void
  handleRestoreFromZip: (e: React.ChangeEvent<HTMLInputElement>) => void
  loadCodeBackups: () => void
  getAutoBackups: () => AutoBackup[]
  restoreAutoBackup: (b: AutoBackup) => void | Promise<void>
}

export function AdminBackupSection({
  variant = 'full',
  safeT,
  isDemoMode,
  selectedLanguage,
  localeDatetimeGeneral,
  autoBackupEnabled,
  autoBackupInterval,
  setAutoBackupEnabled,
  setAutoBackupInterval,
  codeBackups,
  codeBackupsFolder,
  loadingBackups,
  restoringFromZip,
  restoreFromZipInputRef,
  saveData,
  handleCreateBackup,
  handleRestoreBackup,
  handleBackupCodigo,
  handleDownloadBackupZip,
  handleRestoreCodigo,
  handleRestoreFromZip,
  loadCodeBackups,
  getAutoBackups,
  restoreAutoBackup,
}: AdminBackupSectionProps) {
  if (variant === 'compact') {
    return (
            <div className="admin-section admin-section--emerald" style={{ marginBottom: '24px' }}>
              <h3 className="admin-section-title">
                {safeT?.backupRestore || 'BACKUP E SEGURANÇA'}
              </h3>
              {!isDemoMode && (
                <p style={{ padding: '10px 12px', marginBottom: '15px', backgroundColor: 'rgba(0, 150, 0, 0.12)', border: '1px solid rgba(0, 200, 83, 0.35)', borderRadius: '6px', color: '#90ee90', fontSize: '12px' }}>
                  <strong>Para não perder o código:</strong> use «Descarregar backup (ZIP)» e guarde no seu PC.
                </p>
              )}
              {isDemoMode && (
                <p style={{ padding: '12px', marginBottom: '15px', backgroundColor: 'rgba(255, 165, 0, 0.15)', border: '1px solid rgba(255, 165, 0, 0.4)', borderRadius: '6px', color: '#ffa500', fontSize: '13px' }}>
                  Em modo demonstração o backup está desativado.
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', opacity: isDemoMode ? 0.7 : 1, pointerEvents: isDemoMode ? 'none' : 'auto' }}>
                <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid rgba(0, 200, 83, 0.1)' }}>
                  <strong style={{ display: 'block', marginBottom: '8px' }}>{safeT?.backupTitle || 'Backup Completo do Sistema'}</strong>
                  <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '10px', lineHeight: 1.45 }}>
                    {safeT?.backupDescription || 'Crie um backup completo de todos os dados do sistema'} O JSON inclui relatórios (dias de trabalho), clientes, peças, agenda e fechamentos — guarde fora deste PC.
                  </p>
                  <p style={{ fontSize: '11px', opacity: 0.65, marginBottom: '12px' }}>
                    Cópias automáticas periódicas e restauro pormenorizado: abra a aba <strong>Administrador</strong> e expanda <strong>Backup e segurança</strong>.
                  </p>
                  <button className="btn-primary" onClick={handleCreateBackup} style={{ padding: '8px 15px' }} disabled={isDemoMode}>
                    {safeT?.createBackup || 'Criar Backup'}
                  </button>
                </div>

                <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid rgba(100, 180, 255, 0.35)' }}>
                  <strong style={{ display: 'block', marginBottom: '8px', color: '#8ecaff' }}>{safeT?.restoreTitle || 'Restaurar Backup'}</strong>
                  <p style={{ fontSize: '12px', opacity: 0.78, marginBottom: '12px', lineHeight: 1.45 }}>
                    Escolha o ficheiro <strong>.json</strong> que descarregou com «Criar Backup» (ex.: backup-nonato-service-2026-06-05.json).
                  </p>
                  <label
                    style={{
                      display: 'inline-block',
                      padding: '8px 15px',
                      backgroundColor: '#0066cc',
                      color: '#fff',
                      borderRadius: '6px',
                      cursor: isDemoMode ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      opacity: isDemoMode ? 0.5 : 1,
                    }}
                  >
                    {safeT?.restoreBackup || 'Restaurar Backup'} (.json)
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleRestoreBackup}
                      disabled={isDemoMode}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid rgba(0, 200, 83, 0.1)' }}>
                  <strong style={{ display: 'block', marginBottom: '8px' }}>{safeT?.backupCodigoTitle || 'Backup do Código do Programa'}</strong>
                  <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '12px' }}>{safeT?.backupCodigoDescription || 'Faça backup de TODOS os arquivos do código fonte do programa'}</p>
                  <p style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.8 }}><strong>Pasta dos backups:</strong> {codeBackupsFolder || (isDemoMode ? '—' : 'Atualize a lista.')}</p>
                  <button className="btn-primary" onClick={handleBackupCodigo} style={{ padding: '8px 15px', marginRight: '8px', marginBottom: '8px' }} disabled={isDemoMode}>
                    {safeT?.backupCodigoButton || 'Fazer Backup do Código'}
                  </button>
                  <button type="button" onClick={handleDownloadBackupZip} disabled={isDemoMode} style={{ padding: '8px 15px', marginBottom: '8px', background: 'rgba(0, 150, 255, 0.25)', border: '1px solid rgba(0, 150, 255, 0.6)', color: '#66b3ff', borderRadius: '6px', cursor: isDemoMode ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
                    📥 Descarregar backup (ZIP) para o PC
                  </button>
                </div>
              </div>
            </div>
    )
  }
  return (
            <div className="admin-section admin-section--emerald">
              {!isDemoMode && (
                <p style={{ padding: '10px 12px', marginBottom: '15px', backgroundColor: 'rgba(0, 150, 0, 0.12)', border: '1px solid rgba(0, 200, 83, 0.35)', borderRadius: '6px', color: '#90ee90', fontSize: '12px' }}>
                  <strong>Para não perder o código:</strong> use «Descarregar backup (ZIP)» e guarde o ficheiro no seu PC. Assim o código fica seguro mesmo que o servidor seja reinstalado.
                </p>
              )}
              {isDemoMode && (
                <p style={{ padding: '12px', marginBottom: '15px', backgroundColor: 'rgba(255, 165, 0, 0.15)', border: '1px solid rgba(255, 165, 0, 0.4)', borderRadius: '6px', color: '#ffa500', fontSize: '13px' }}>
                  Em modo demonstração o backup e restauração do código estão desativados. Para usar backup, abra a aplicação fora do link de demonstração.
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', opacity: isDemoMode ? 0.7 : 1, pointerEvents: isDemoMode ? 'none' : 'auto' }}>
                <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid rgba(0, 200, 83, 0.1)' }}>
                  <strong style={{ display: 'block', marginBottom: '8px' }}>{safeT?.backupTitle || 'Backup Completo do Sistema'}</strong>
                  <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '10px', lineHeight: 1.45 }}>
                    {safeT?.backupDescription || 'Crie um backup completo de todos os dados do sistema'} O ficheiro JSON inclui relatórios de serviço (dias de trabalho), clientes, equipamentos, fornecedores, peças, categorias, agenda e fechamentos — guarde cópias fora deste PC (pen ou nuvem).
                  </p>
                  <p style={{ fontSize: '11px', opacity: 0.62, marginBottom: '12px', lineHeight: 1.45, padding: '8px 10px', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid rgba(0,200,83,0.12)' }}>
                    <strong style={{ color: '#9be7ff' }}>Dupla proteção recomendada:</strong> (1) dados em JSON com «Criar Backup» + cópias automáticas abaixo; (2) código da aplicação com «Descarregar backup (ZIP)» / backup no servidor — são coisas diferentes; use as duas.
                  </p>
                  <button className="btn-primary" onClick={handleCreateBackup} style={{ padding: '8px 15px' }} disabled={isDemoMode}>
                    {safeT?.createBackup || 'Criar Backup'}
                  </button>
                </div>

                <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid rgba(100, 180, 255, 0.35)' }}>
                  <strong style={{ display: 'block', marginBottom: '8px', color: '#8ecaff' }}>{safeT?.restoreTitle || 'Restaurar Backup'}</strong>
                  <p style={{ fontSize: '12px', opacity: 0.78, marginBottom: '12px', lineHeight: 1.45 }}>
                    {safeT?.restoreDescription || 'Restaure todos os dados a partir de um arquivo de backup'} Se fez «Criar Backup» e guardou o ficheiro <strong>.json</strong> no PC (ex.: ontem), use o botão abaixo para o escolher. Repõe relatórios, clientes, peças, agenda e fechamentos no servidor e neste aparelho.
                  </p>
                  <label
                    style={{
                      display: 'inline-block',
                      padding: '8px 15px',
                      backgroundColor: '#0066cc',
                      color: '#fff',
                      borderRadius: '6px',
                      cursor: isDemoMode ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      opacity: isDemoMode ? 0.5 : 1,
                    }}
                  >
                    {safeT?.restoreBackup || 'Restaurar Backup'} (.json)
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleRestoreBackup}
                      disabled={isDemoMode}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid rgba(100, 180, 255, 0.28)' }}>
                  <strong style={{ display: 'block', marginBottom: '8px', color: '#8ecaff' }}>Cópias automáticas periódicas (navegador)</strong>
                  <p style={{ fontSize: '12px', opacity: 0.78, marginBottom: '12px', lineHeight: 1.45 }}>
                    Além do instantâneo ao abrir a página e após guardar relatórios, pode gravar até seis instantâneos <strong>de X em X minutos</strong> neste computador. Não substitui o JSON descarregado para a pen, mas ajuda a recuperar erros recentes.
                  </p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#ccc', marginBottom: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoBackupEnabled}
                      disabled={isDemoMode}
                      onChange={(e) => {
                        const v = e.target.checked
                        setAutoBackupEnabled(v)
                        void saveData('nonato-auto-backup-enabled', v ? 'true' : 'false')
                      }}
                    />
                    Ativar cópias automáticas periódicas
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#ccc' }}>
                    <span style={{ opacity: 0.85 }}>Intervalo:</span>
                    <select
                      value={autoBackupInterval}
                      disabled={isDemoMode}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10)
                        setAutoBackupInterval(n)
                        void saveData('nonato-auto-backup-interval', String(n))
                      }}
                      style={{ padding: '6px 10px', backgroundColor: '#141414', color: '#fff', border: '1px solid rgba(0, 200, 83, 0.3)', borderRadius: '6px' }}
                    >
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={60}>60 minutos</option>
                      <option value={120}>2 horas</option>
                      <option value={360}>6 horas</option>
                    </select>
                  </div>
                </div>

                <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid rgba(100, 180, 255, 0.35)' }}>
                  <strong style={{ display: 'block', marginBottom: '8px', color: '#8ecaff' }}>Recuperar dados — cópias automáticas recentes</strong>
                  <p style={{ fontSize: '12px', opacity: 0.78, marginBottom: '12px', lineHeight: 1.45 }}>
                    O sistema guarda até seis instantâneos no navegador (inclui relatórios de serviço e clientes). Se perdeu linhas de dias de trabalho, experimente uma data <strong>anterior</strong> ao problema. A restauração repõe também no <strong>servidor</strong> (precisa de ligação).
                  </p>
                  {getAutoBackups().length === 0 ? (
                    <p style={{ fontSize: '12px', opacity: 0.55, margin: 0 }}>Ainda não há cópias automáticas neste navegador — voltará a haver após guardar relatórios ou ao reiniciar a página.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                      {getAutoBackups().map((b: { timestamp: number; data?: { date?: string } }) => (
                        <div
                          key={b.timestamp}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            flexWrap: 'wrap',
                            padding: '10px 12px',
                            backgroundColor: '#141414',
                            borderRadius: '6px',
                            border: '1px solid rgba(100, 180, 255, 0.25)',
                          }}
                        >
                          <span style={{ fontSize: '12px', color: '#ccc' }}>
                            {new Date(b.timestamp).toLocaleString(localeDatetimeGeneral(selectedLanguage))}
                            {b.data?.date ? <span style={{ opacity: 0.65 }}> · bundle {String(b.data.date).slice(0, 19)}</span> : null}
                          </span>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={isDemoMode}
                            onClick={() => {
                              if (
                                !window.confirm(
                                  'Restaurar esta cópia automática? Substitui dados no servidor e neste PC (inclui relatórios e clientes deste instantâneo). A página recarrega em seguida.'
                                )
                              ) {
                                return
                              }
                              void restoreAutoBackup(b)
                            }}
                            style={{ padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                          >
                            Restaurar esta cópia
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid rgba(0, 200, 83, 0.1)', borderLeft: '4px solid #00c853' }}>
                  <strong style={{ display: 'block', marginBottom: '8px' }}>{safeT?.backupCodigoTitle || 'Backup do Código do Programa'}</strong>
                  <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '12px' }}>{safeT?.backupCodigoDescription || 'Faça backup de TODOS os arquivos do código fonte do programa'}</p>
                  <button className="btn-primary" onClick={handleBackupCodigo} style={{ padding: '8px 15px', marginRight: '8px', marginBottom: '8px' }} disabled={isDemoMode}>
                    {safeT?.backupCodigoButton || 'Fazer Backup do Código'}
                  </button>
                  <button type="button" onClick={handleDownloadBackupZip} disabled={isDemoMode} style={{ padding: '8px 15px', marginBottom: '8px', background: 'rgba(0, 150, 255, 0.25)', border: '1px solid rgba(0, 150, 255, 0.6)', color: '#66b3ff', borderRadius: '6px', cursor: isDemoMode ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
                    📥 Descarregar backup (ZIP) para o PC
                  </button>
                </div>

                <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid rgba(255, 165, 0, 0.3)' }}>
                  <strong style={{ display: 'block', marginBottom: '8px', color: '#ffa500' }}>{safeT?.restoreCodeTitle || '⚠️ RESTAURAR CÓDIGO DO PROGRAMA'}</strong>
                  <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '12px' }}>
                    {safeT?.restoreCodeDescription || 'Restaure o código do programa a partir de um backup anterior. Esta operação substituirá TODOS os arquivos atuais pelos arquivos do backup selecionado.'}
                  </p>
                  <p style={{ fontSize: '12px', marginBottom: '12px', padding: '8px 10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px', border: '1px solid rgba(255,165,0,0.2)' }}>
                    <strong style={{ color: '#ffa500' }}>Pasta onde os backups estão guardados:</strong>
                    <br />
                    <span style={{ wordBreak: 'break-all', opacity: 0.95 }}>{codeBackupsFolder || (isDemoMode ? 'Em modo demonstração o backup está desativado.' : (loadingBackups ? 'A carregar…' : 'Clique em «Atualizar Lista» para ver o caminho.'))}</span>
                  </p>
                  {loadingBackups ? (
                    <p style={{ fontSize: '12px', opacity: 0.7, padding: '10px', textAlign: 'center' }}>{safeT?.loadingBackups || 'Carregando backups...'}</p>
                  ) : codeBackups.length === 0 ? (
                    <p style={{ fontSize: '12px', opacity: 0.6, padding: '10px', textAlign: 'center' }}>{safeT?.noCodeBackups || 'Nenhum backup de código encontrado.'}</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', marginBottom: '10px' }}>
                      {codeBackups.map((backup, index) => (
                        <div 
                          key={index}
                          style={{ 
                            padding: '12px', 
                            backgroundColor: '#141414', 
                            borderRadius: '4px', 
                            border: '1px solid rgba(255, 165, 0, 0.2)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>
                              {(safeT?.backupNumber || 'Backup {number}').replace('{number}', String(index + 1))}
                            </strong>
                            <span style={{ fontSize: '11px', opacity: 0.7, display: 'block' }}>
                              {new Date(backup.timestamp).toLocaleString(localeDatetimeGeneral(selectedLanguage))}
                            </span>
                            <span style={{ fontSize: '11px', opacity: 0.6, display: 'block', marginTop: '2px' }}>
                              {(safeT?.filesCount || '{count} arquivos').replace('{count}', String(backup.filesCount || 'N/A'))} • {backup.path || (safeT?.locationNotSpecified || 'Local não especificado')}
                            </span>
                          </div>
                          <button
                            className="btn-primary"
                            onClick={() => handleRestoreCodigo(backup.path)}
                            disabled={isDemoMode}
                            style={{ 
                              padding: '8px 16px', 
                              fontSize: '12px', 
                              whiteSpace: 'nowrap',
                              backgroundColor: '#ffa500',
                              borderColor: '#ffa500',
                              color: '#000'
                            }}
                          >
                            {safeT?.restoreButton || '🔄 Restaurar'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button 
                    className="btn-primary" 
                    onClick={loadCodeBackups} 
                    style={{ padding: '6px 12px', fontSize: '11px', opacity: 0.8 }}
                    disabled={isDemoMode}
                  >
                    {safeT?.updateListButton || '🔄 Atualizar Lista'}
                  </button>

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,165,0,0.2)' }}>
                    <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px' }}>Restaurar a partir de um ficheiro ZIP (backup que descarregou para o PC):</p>
                    <input
                      ref={restoreFromZipInputRef}
                      type="file"
                      accept=".zip"
                      onChange={handleRestoreFromZip}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => restoreFromZipInputRef.current?.click()}
                      disabled={isDemoMode || restoringFromZip}
                      style={{ padding: '8px 14px', fontSize: '12px', background: 'rgba(255, 165, 0, 0.2)', border: '1px solid rgba(255, 165, 0, 0.5)', color: '#ffa500', borderRadius: '6px', cursor: isDemoMode || restoringFromZip ? 'not-allowed' : 'pointer', fontWeight: '600' }}
                    >
                      {restoringFromZip ? 'A restaurar…' : '📂 Restaurar a partir de ficheiro ZIP'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
  )
}

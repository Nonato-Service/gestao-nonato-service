'use client'

import React from 'react'
import type { SafeT, SyncPendingRemote } from './adminTypes'

export type AdminSyncSectionProps = {
  safeT: SafeT
  syncPendingRemote: SyncPendingRemote | null
  syncPushLoading: boolean
  setSyncDecisionModalOpen: (open: boolean) => void
  setLastAcceptedRevision: (rev: number) => void
  pendingFullServerReplaceKey: string
  enviarEsteAparelhoParaServidor: () => void | Promise<void>
}

export function AdminSyncSection({
  safeT,
  syncPendingRemote,
  syncPushLoading,
  setSyncDecisionModalOpen,
  setLastAcceptedRevision,
  pendingFullServerReplaceKey,
  enviarEsteAparelhoParaServidor,
}: AdminSyncSectionProps) {
  return (
                <div id="admin-sync-multi" className="admin-sync-card" style={{ marginBottom: 0 }}>
                  {syncPendingRemote ? (
                    <>
                      <p style={{ fontSize: '12px', color: '#ddaa66', margin: '0 0 8px', padding: '8px 10px', background: 'rgba(255,170,0,0.08)', borderRadius: '6px', border: '1px solid rgba(255,170,0,0.25)' }}>
                        {(safeT as any)?.syncAdminPendingNote || 'Há dados no servidor mais recentes do que os que este aparelho aceitou.'}{' '}
                        <span style={{ opacity: 0.9 }}>
                          ({(safeT as any)?.syncRevisionLabel || 'revisão'} {syncPendingRemote.revision})
                        </span>
                      </p>
                      <ul style={{ fontSize: '11px', color: '#bbb', margin: '0 0 12px', paddingLeft: '18px', lineHeight: 1.45, maxHeight: '160px', overflowY: 'auto' }}>
                        {syncPendingRemote.summaryLines.map((line, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{line.startsWith('•') ? line.slice(1).trim() : line}</li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          setSyncDecisionModalOpen(true)
                        }}
                        style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600 }}
                      >
                        {(safeT as any)?.syncReopenModal || 'Abrir aviso de sincronização'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px' }}>
                        {(safeT as any)?.syncAdminNoPending || 'Neste momento não há diferença de revisão pendente de decisão.'}
                      </p>
                      <p style={{ fontSize: '11px', color: '#999', margin: '0 0 10px', lineHeight: 1.45 }}>
                        {(safeT as any)?.syncAdminManualPullHint ||
                          'Se o PC tem os dados certos mas aqui parece desatualizado (revisão local «à frente» do servidor), use primeiro o botão abaixo — não use «Enviar tudo» a partir de um aparelho vazio ou velho.'}
                      </p>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{
                          padding: '8px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          marginBottom: '12px',
                          borderColor: 'rgba(255, 170, 80, 0.55)',
                          backgroundColor: 'rgba(255, 140, 40, 0.18)',
                          color: '#ffddaa',
                        }}
                        onClick={() => {
                          const msg =
                            (safeT as any)?.syncAdminManualPullConfirm ||
                            'Recarregar a partir do servidor como no aviso laranja? A revisão local é reposta e a página recarrega (rascunhos seguros mantêm-se conforme o sistema já fazia).'
                          if (!window.confirm(msg)) return
                          setLastAcceptedRevision(0)
                          try {
                            localStorage.setItem('nonato-sync-last-accepted-revision', '0')
                          } catch {
                            /* ignorar */
                          }
                          try {
                            sessionStorage.setItem('nonato-sync-full-server-apply', '1')
                            localStorage.setItem(pendingFullServerReplaceKey, '1')
                          } catch {
                            /* ignorar */
                          }
                          window.location.reload()
                        }}
                      >
                        {(safeT as any)?.syncLoadFromServer || 'Carregar do servidor'}
                        {' — '}
                        {(safeT as any)?.syncAdminManualPullShort || 'forçar alinhamento'}
                      </button>
                    </>
                  )}
                  <div
                    className="admin-sync-force-block"
                    style={{
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(100, 180, 100, 0.25)',
                    }}
                  >
                    <p style={{ fontSize: '12px', color: '#7cb87c', margin: '0 0 6px' }}>
                      {(safeT as any)?.syncAdminForcePushIntro ||
                        'Só use isto se o dado certo está NESTE aparelho e o servidor não recebeu (rede). Se o dado certo está no PC, não envie a partir do telemóvel vazio — use «Carregar do servidor» acima.'}
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={syncPushLoading}
                      onClick={() => {
                        void enviarEsteAparelhoParaServidor()
                      }}
                      style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600 }}
                    >
                      {syncPushLoading
                        ? (safeT as any)?.syncPushSending || 'A enviar…'
                        : (safeT as any)?.syncAdminForcePush || 'Enviar tudo o que está neste aparelho para o servidor'}
                    </button>
                    <p style={{ fontSize: '10px', color: '#666', margin: '8px 0 0', lineHeight: 1.45 }}>
                      {(safeT as any)?.syncAdminForcePushHint ||
                        'Confirmação pedida. Se o outro aparelho tem o que o servidor ainda não tem, faça o envio a partir desse aparelho, não a partir de um vazio (senão piora a divergência).'}
                    </p>
                  </div>
                </div>
  )
}

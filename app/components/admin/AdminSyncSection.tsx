'use client'

import React, { useState } from 'react'
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

function tr(safeT: SafeT, key: string, fallback: string): string {
  return (safeT as Record<string, string | undefined>)[key] || fallback
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
  const [confirmPush, setConfirmPush] = useState(false)
  const pending = Boolean(syncPendingRemote)
  const revision = syncPendingRemote?.revision ?? 0

  const handleManualPull = () => {
    const msg =
      tr(
        safeT,
        'syncAdminManualPullConfirm',
        'Recarregar a partir do servidor? A revisão local é reposta e a página recarrega.'
      )
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
  }

  return (
    <section className="admin-sync-hub">
      <header className="admin-sync-hub__hero">
        <div className="admin-sync-hub__hero-glow" aria-hidden="true" />
        <div className="admin-sync-hub__hero-content">
          <div className="admin-sync-hub__hero-icon" aria-hidden="true">
            ⟳
          </div>
          <div>
            <h3 className="admin-sync-hub__hero-title">{tr(safeT, 'adminSyncHubTitle', 'Centro de Sincronização')}</h3>
            <p className="admin-sync-hub__hero-desc">
              {tr(
                safeT,
                'adminSyncHubDesc',
                'Mantenha PC, tablet e telemóvel alinhados com o servidor. A decisão é manual — carregue ou envie quando fizer sentido.'
              )}
            </p>
          </div>
        </div>
        <ol className="admin-sync-hub__steps">
          <li>{tr(safeT, 'adminSyncHubStep1', '1. Detete diferenças')}</li>
          <li>{tr(safeT, 'adminSyncHubStep2', '2. Carregue do servidor')}</li>
          <li>{tr(safeT, 'adminSyncHubStep3', '3. Ou envie deste aparelho')}</li>
        </ol>
      </header>

      <div className="admin-sync-hub__stats">
        <div className={`admin-sync-hub__stat${pending ? ' admin-sync-hub__stat--warn' : ' admin-sync-hub__stat--ok'}`}>
          <span>{tr(safeT, 'adminSyncHubKpiStatus', 'Estado')}</span>
          <strong>
            {pending
              ? tr(safeT, 'adminSyncHubKpiStatusPending', 'Pendente')
              : tr(safeT, 'adminSyncHubKpiStatusOk', 'Sincronizado')}
          </strong>
        </div>
        <div className="admin-sync-hub__stat">
          <span>{tr(safeT, 'adminSyncHubKpiRevision', 'Revisão')}</span>
          <strong>{revision > 0 ? revision : '—'}</strong>
        </div>
        <div className="admin-sync-hub__stat admin-sync-hub__stat--note">
          <span>{tr(safeT, 'adminSyncHubKpiDevice', 'Aparelho')}</span>
          <strong>{tr(safeT, 'adminSyncHubKpiDeviceManual', 'Decisão manual')}</strong>
        </div>
      </div>

      <div className={`admin-sync-hub__status${pending ? ' admin-sync-hub__status--pending' : ' admin-sync-hub__status--ok'}`}>
        <div className="admin-sync-hub__status-head">
          <span className="admin-sync-hub__status-icon" aria-hidden="true">
            {pending ? '⚠' : '✓'}
          </span>
          <div>
            <p className="admin-sync-hub__status-title">
              {pending
                ? tr(safeT, 'adminSyncHubPanelPending', 'Diferença detectada no servidor')
                : tr(safeT, 'adminSyncHubPanelOk', 'Sem diferenças pendentes')}
            </p>
            <p className="admin-sync-hub__status-desc">
              {pending
                ? tr(safeT, 'syncAdminPendingNote', 'O servidor tem uma versão mais recente do que a que este aparelho aceitou.')
                : tr(safeT, 'syncAdminNoPending', 'Neste momento não há diferença de revisão pendente de decisão.')}
            </p>
          </div>
        </div>

        {pending && syncPendingRemote ? (
          <>
            {syncPendingRemote.summaryLines.length > 0 ? (
              <div className="admin-sync-hub__summary">
                <p className="admin-sync-hub__summary-label">{tr(safeT, 'adminSyncHubSummaryTitle', 'Resumo das alterações')}</p>
                <ul>
                  {syncPendingRemote.summaryLines.map((line, i) => (
                    <li key={i}>{line.startsWith('•') ? line.slice(1).trim() : line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button type="button" className="admin-sync-hub-btn admin-sync-hub-btn--primary" onClick={() => setSyncDecisionModalOpen(true)}>
              {tr(safeT, 'syncReopenModal', 'Abrir aviso de sincronização')}
            </button>
          </>
        ) : (
          <p className="admin-sync-hub__hint">
            {tr(
              safeT,
              'syncAdminManualPullHint',
              'Se o PC tem os dados certos mas aqui parece desatualizado, use primeiro «Carregar do servidor» — não envie a partir de um aparelho vazio.'
            )}
          </p>
        )}
      </div>

      <div className="admin-sync-hub__actions">
        <article className="admin-sync-hub__action admin-sync-hub__action--pull">
          <div className="admin-sync-hub__action-icon" aria-hidden="true">
            ↓
          </div>
          <div className="admin-sync-hub__action-body">
            <h4>{tr(safeT, 'adminSyncHubActionPullTitle', 'Atualizar este aparelho')}</h4>
            <p>{tr(safeT, 'adminSyncHubActionPullDesc', 'Trazer a cópia mais recente do servidor para aqui')}</p>
          </div>
          <button type="button" className="admin-sync-hub-btn admin-sync-hub-btn--pull" onClick={handleManualPull}>
            {tr(safeT, 'syncLoadFromServer', 'Carregar do servidor')}
            <span className="admin-sync-hub-btn__sub">{tr(safeT, 'syncAdminManualPullShort', 'forçar alinhamento')}</span>
          </button>
        </article>

        <article className="admin-sync-hub__action admin-sync-hub__action--push">
          <div className="admin-sync-hub__action-icon" aria-hidden="true">
            ↑
          </div>
          <div className="admin-sync-hub__action-body">
            <h4>{tr(safeT, 'adminSyncHubActionPushTitle', 'Enviar para o servidor')}</h4>
            <p>
              {tr(
                safeT,
                'syncAdminForcePushIntro',
                'Só use se o dado certo está NESTE aparelho e o servidor não recebeu (rede).'
              )}
            </p>
          </div>
          {!confirmPush ? (
            <button type="button" className="admin-sync-hub-btn admin-sync-hub-btn--ghost" onClick={() => setConfirmPush(true)} disabled={syncPushLoading}>
              {tr(safeT, 'adminSyncHubActionPushPrepare', 'Preparar envio')}
            </button>
          ) : (
            <div className="admin-sync-hub__confirm">
              <p>{tr(safeT, 'syncAdminForcePushHint', 'Confirme apenas se este aparelho tem os dados corretos.')}</p>
              <div className="admin-sync-hub__confirm-actions">
                <button type="button" className="admin-sync-hub-btn admin-sync-hub-btn--ghost" onClick={() => setConfirmPush(false)} disabled={syncPushLoading}>
                  {tr(safeT, 'cancel', 'Cancelar')}
                </button>
                <button
                  type="button"
                  className="admin-sync-hub-btn admin-sync-hub-btn--push"
                  disabled={syncPushLoading}
                  onClick={() => {
                    setConfirmPush(false)
                    void enviarEsteAparelhoParaServidor()
                  }}
                >
                  {syncPushLoading
                    ? tr(safeT, 'syncPushSending', 'A enviar…')
                    : tr(safeT, 'syncAdminForcePush', 'Enviar tudo deste aparelho')}
                </button>
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

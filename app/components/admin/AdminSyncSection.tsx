'use client'

import React, { useEffect, useState } from 'react'
import { AdminSyncBatteryProgress } from './AdminSyncBatteryProgress'
import type { SafeT, SyncPendingRemote } from './adminTypes'

export type AdminSyncSectionProps = {
  safeT: SafeT
  syncPendingRemote: SyncPendingRemote | null
  syncPushLoading: boolean
  /** Progresso 0–100 do envio (pai); se omitido, a secção estima localmente. */
  syncOperationPercent?: number
  setSyncDecisionModalOpen: (open: boolean) => void
  setLastAcceptedRevision: (rev: number) => void
  pendingFullServerReplaceKey: string
  enviarEsteAparelhoParaServidor: () => void | Promise<void>
}

function tr(safeT: SafeT, key: string, fallback: string): string {
  return (safeT as Record<string, string | undefined>)[key] || fallback
}

function labelWithPercent(template: string, n: number): string {
  return template.replace(/\{n\}/g, String(Math.max(0, Math.min(100, Math.round(n)))))
}

export function AdminSyncSection({
  safeT,
  syncPendingRemote,
  syncPushLoading,
  syncOperationPercent = 0,
  setSyncDecisionModalOpen,
  setLastAcceptedRevision,
  pendingFullServerReplaceKey,
  enviarEsteAparelhoParaServidor,
}: AdminSyncSectionProps) {
  const [confirmPush, setConfirmPush] = useState(false)
  const [pushDoneFlash, setPushDoneFlash] = useState(false)
  const [pullLoading, setPullLoading] = useState(false)
  const [pullPercent, setPullPercent] = useState(0)
  const [pullDone, setPullDone] = useState(false)
  const pending = Boolean(syncPendingRemote)
  const revision = syncPendingRemote?.revision ?? 0

  const pushPercent = syncPushLoading
    ? Math.max(1, Math.min(99, Math.round(syncOperationPercent || 1)))
    : pushDoneFlash
      ? 100
      : Math.max(0, Math.min(100, Math.round(syncOperationPercent || 0)))

  useEffect(() => {
    if (syncPushLoading) {
      setPushDoneFlash(false)
      return
    }
    if (syncOperationPercent >= 100) {
      setPushDoneFlash(true)
      const tid = window.setTimeout(() => setPushDoneFlash(false), 2200)
      return () => window.clearTimeout(tid)
    }
  }, [syncPushLoading, syncOperationPercent])

  const handleManualPull = () => {
    if (pullLoading) return
    const msg =
      tr(
        safeT,
        'syncAdminManualPullConfirm',
        'Recarregar a partir do servidor? A revisão local é reposta e a página recarrega.'
      )
    if (!window.confirm(msg)) return

    setPullLoading(true)
    setPullDone(false)
    setPullPercent(8)

    const climb = window.setInterval(() => {
      setPullPercent((prev) => {
        if (prev >= 88) return prev
        return Math.min(88, prev + Math.max(2, Math.round((88 - prev) * 0.12)))
      })
    }, 160)

    window.setTimeout(() => {
      window.clearInterval(climb)
      setPullPercent(100)
      setPullDone(true)
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
      window.setTimeout(() => {
        window.location.reload()
      }, 280)
    }, 900)
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
          <button
            type="button"
            className="admin-sync-hub-btn admin-sync-hub-btn--pull"
            onClick={handleManualPull}
            disabled={pullLoading || syncPushLoading}
          >
            {pullLoading
              ? tr(safeT, 'syncPullChecking', 'A atualizar do servidor')
              : tr(safeT, 'syncLoadFromServer', 'Carregar do servidor')}
            <span className="admin-sync-hub-btn__sub">{tr(safeT, 'syncAdminManualPullShort', 'forçar alinhamento')}</span>
          </button>
          {(pullLoading || pullDone) && (
            <AdminSyncBatteryProgress
              percent={pullPercent}
              active={pullLoading && !pullDone}
              done={pullDone}
              label={
                pullDone
                  ? tr(safeT, 'syncConcluido', 'Concluído')
                  : labelWithPercent(
                      tr(safeT, 'carregandoPercentagem', 'A carregar… {n}%'),
                      pullPercent
                    )
              }
            />
          )}
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
            <button
              type="button"
              className="admin-sync-hub-btn admin-sync-hub-btn--ghost"
              onClick={() => setConfirmPush(true)}
              disabled={syncPushLoading || pullLoading}
            >
              {tr(safeT, 'adminSyncHubActionPushPrepare', 'Preparar envio')}
            </button>
          ) : (
            <div className="admin-sync-hub__confirm">
              <p>{tr(safeT, 'syncAdminForcePushHint', 'Confirme apenas se este aparelho tem os dados corretos.')}</p>
              <div className="admin-sync-hub__confirm-actions">
                <button
                  type="button"
                  className="admin-sync-hub-btn admin-sync-hub-btn--ghost"
                  onClick={() => setConfirmPush(false)}
                  disabled={syncPushLoading}
                >
                  {tr(safeT, 'cancel', 'Cancelar')}
                </button>
                <button
                  type="button"
                  className="admin-sync-hub-btn admin-sync-hub-btn--push"
                  disabled={syncPushLoading || pullLoading}
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
          {(syncPushLoading || pushDoneFlash || (pushPercent > 0 && pushPercent < 100 && syncPushLoading)) && (
            <AdminSyncBatteryProgress
              percent={pushPercent}
              active={syncPushLoading && pushPercent < 100}
              done={pushDoneFlash || (!syncPushLoading && pushPercent >= 100)}
              label={
                pushDoneFlash || pushPercent >= 100
                  ? tr(safeT, 'syncConcluido', 'Concluído')
                  : labelWithPercent(
                      tr(safeT, 'enviandoPercentagem', 'A enviar… {n}%'),
                      pushPercent
                    )
              }
            />
          )}
        </article>
      </div>
    </section>
  )
}

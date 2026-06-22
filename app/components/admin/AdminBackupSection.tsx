'use client'

import React, { useMemo, useState } from 'react'
import { formatBackupBytes, MAX_BACKUP_HISTORY } from '../../lib/adminBackupRegistry'
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
  deleteAutoBackup: (timestamp: number) => boolean
  getManualDataBackups: () => AutoBackup[]
  restoreManualDataBackup: (b: AutoBackup) => void | Promise<void>
  deleteManualDataBackup: (timestamp: number) => boolean
  downloadStoredBackupJson: (backup: AutoBackup, prefix: string) => void
  getZipHistory: () => Array<{ timestamp: number; fileName: string; sizeBytes?: number }>
}

function tr(safeT: SafeT, key: string, fallback: string): string {
  return (safeT as Record<string, string | undefined>)[key] || fallback
}

function formatWhen(ts: number, locale: string): string {
  try {
    return new Date(ts).toLocaleString(locale)
  } catch {
    return new Date(ts).toLocaleString()
  }
}

type ConfirmState = { kind: 'restore-auto' | 'restore-manual' | 'restore-code' | 'delete-auto' | 'delete-manual'; id: number | string } | null

export function AdminBackupSection(props: AdminBackupSectionProps) {
  const {
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
    deleteAutoBackup,
    getManualDataBackups,
    restoreManualDataBackup,
    deleteManualDataBackup,
    downloadStoredBackupJson,
    getZipHistory,
  } = props

  const [tick, setTick] = useState(0)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const locale = localeDatetimeGeneral(selectedLanguage)

  const autoBackups = useMemo(() => getAutoBackups().slice(0, MAX_BACKUP_HISTORY), [getAutoBackups, tick])
  const manualBackups = useMemo(() => getManualDataBackups().slice(0, MAX_BACKUP_HISTORY), [getManualDataBackups, tick])
  const codeList = useMemo(() => codeBackups.slice(0, MAX_BACKUP_HISTORY), [codeBackups])
  const zipHistory = useMemo(() => getZipHistory().slice(0, MAX_BACKUP_HISTORY), [getZipHistory, tick])

  const bump = () => setTick((n) => n + 1)

  const renderSlots = (filled: number, label: string) => (
    <div className="admin-backup-hub-slots" aria-label={label}>
      {Array.from({ length: MAX_BACKUP_HISTORY }).map((_, i) => (
        <span key={i} className={`admin-backup-hub-slot${i < filled ? ' admin-backup-hub-slot--filled' : ''}`} title={`${i + 1}/${MAX_BACKUP_HISTORY}`} />
      ))}
    </div>
  )

  const runConfirm = async () => {
    if (!confirm) return
    const c = confirm
    setConfirm(null)
    if (c.kind === 'restore-auto') {
      await restoreAutoBackup(autoBackups.find((b) => b.timestamp === c.id) || { timestamp: c.id as number })
      return
    }
    if (c.kind === 'restore-manual') {
      await restoreManualDataBackup(manualBackups.find((b) => b.timestamp === c.id) || { timestamp: c.id as number })
      return
    }
    if (c.kind === 'restore-code') {
      handleRestoreCodigo(String(c.id))
      return
    }
    if (c.kind === 'delete-auto') {
      deleteAutoBackup(c.id as number)
      bump()
      return
    }
    if (c.kind === 'delete-manual') {
      deleteManualDataBackup(c.id as number)
      bump()
    }
  }

  if (variant === 'compact') {
    return (
      <div className="admin-section admin-section--emerald">
        <p className="admin-backup-hub__compact-note">
          {tr(safeT, 'adminBackupHubCompactNote', 'Abra a aba Administrador → Backup e segurança para o centro completo com os 5 últimos de cada tipo.')}
        </p>
        <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--primary" onClick={handleCreateBackup} disabled={isDemoMode}>
          {safeT?.createBackup || 'Criar Backup'}
        </button>
      </div>
    )
  }

  return (
    <section className={`admin-backup-hub${isDemoMode ? ' admin-backup-hub--demo' : ''}`}>
      <header className="admin-backup-hub__hero">
        <div className="admin-backup-hub__hero-glow" aria-hidden="true" />
        <div className="admin-backup-hub__hero-content">
          <div className="admin-backup-hub__hero-icon" aria-hidden="true">
            🛡️
          </div>
          <div>
            <h3 className="admin-backup-hub__hero-title">{tr(safeT, 'adminBackupHubTitle', 'Centro de Backup e Segurança')}</h3>
            <p className="admin-backup-hub__hero-desc">
              {tr(
                safeT,
                'adminBackupHubDesc',
                'Quatro camadas de proteção: dados do sistema, JSON manual, código no servidor e ZIP no PC. Mantém sempre os 5 mais recentes de cada tipo, com restauro individual.'
              )}
            </p>
          </div>
        </div>
        <ol className="admin-backup-hub__steps">
          <li>{tr(safeT, 'adminBackupHubStep1', '1. Ative cópias automáticas')}</li>
          <li>{tr(safeT, 'adminBackupHubStep2', '2. Crie JSON + código + ZIP')}</li>
          <li>{tr(safeT, 'adminBackupHubStep3', '3. Restaure só o que precisar')}</li>
        </ol>
      </header>

      {isDemoMode ? (
        <p className="admin-backup-hub__demo-warn">{tr(safeT, 'adminBackupHubDemoWarn', 'Modo demonstração: backup e restauro desativados.')}</p>
      ) : (
        <p className="admin-backup-hub__safe-note">
          {tr(
            safeT,
            'adminBackupHubSafeNote',
            'Dupla proteção: dados (JSON) e código (pasta/ZIP) são coisas diferentes — use ambos regularmente.'
          )}
        </p>
      )}

      <div className="admin-backup-hub__auto-panel">
        <header>
          <h4>{tr(safeT, 'adminBackupHubAutoTitle', 'Cópia automática periódica')}</h4>
          <p>{tr(safeT, 'adminBackupHubAutoDesc', 'Instantâneos no navegador — até 5 registos, restauro individual abaixo.')}</p>
        </header>
        <div className="admin-backup-hub__auto-controls">
          <label className="admin-backup-hub-toggle">
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
            <span>{tr(safeT, 'adminBackupHubAutoEnable', 'Ativar cópias automáticas')}</span>
          </label>
          <label className="admin-backup-hub-interval">
            <span>{tr(safeT, 'adminBackupHubAutoInterval', 'Intervalo')}</span>
            <select
              value={autoBackupInterval}
              disabled={isDemoMode}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                setAutoBackupInterval(n)
                void saveData('nonato-auto-backup-interval', String(n))
              }}
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
              <option value={120}>2 h</option>
              <option value={360}>6 h</option>
            </select>
          </label>
          <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--primary" onClick={handleCreateBackup} disabled={isDemoMode}>
            + {tr(safeT, 'adminBackupHubCreateJsonNow', 'Criar JSON agora')}
          </button>
        </div>
      </div>

      <div className="admin-backup-hub-grid">
        {/* Sistema automático */}
        <article className="admin-backup-hub-card admin-backup-hub-card--system">
          <header>
            <span className="admin-backup-hub-card__icon" aria-hidden="true">
              🔄
            </span>
            <div>
              <h4>{tr(safeT, 'adminBackupHubSystemTitle', '5 últimos — Sistema (auto)')}</h4>
              <p>{tr(safeT, 'adminBackupHubSystemDesc', 'Instantâneos automáticos no navegador com dados do sistema.')}</p>
            </div>
          </header>
          {renderSlots(autoBackups.length, 'Sistema')}
          {autoBackups.length === 0 ? (
            <p className="admin-backup-hub-empty">{tr(safeT, 'adminBackupHubSystemEmpty', 'Ainda sem cópias — ative o automático ou guarde relatórios.')}</p>
          ) : (
            <ul className="admin-backup-hub-list">
              {autoBackups.map((b, index) => (
                <li key={b.timestamp}>
                  <div>
                    <strong>#{index + 1}</strong>
                    <span>{formatWhen(b.timestamp, locale)}</span>
                  </div>
                  <div className="admin-backup-hub-list__actions">
                    <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--ghost" disabled={isDemoMode} onClick={() => downloadStoredBackupJson(b, 'backup-auto')}>
                      {tr(safeT, 'adminBackupHubDownloadJson', 'JSON')}
                    </button>
                    {confirm?.kind === 'restore-auto' && confirm.id === b.timestamp ? (
                      <>
                        <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--danger" disabled={isDemoMode} onClick={() => void runConfirm()}>
                          {tr(safeT, 'adminBackupHubConfirmRestore', 'Restaurar')}
                        </button>
                        <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--ghost" onClick={() => setConfirm(null)}>
                          {safeT?.cancel || 'Cancelar'}
                        </button>
                      </>
                    ) : (
                      <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--primary" disabled={isDemoMode} onClick={() => setConfirm({ kind: 'restore-auto', id: b.timestamp })}>
                        {tr(safeT, 'adminBackupHubRestoreOne', 'Restaurar')}
                      </button>
                    )}
                    {confirm?.kind === 'delete-auto' && confirm.id === b.timestamp ? (
                      <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--danger-outline" disabled={isDemoMode} onClick={() => void runConfirm()}>
                        {tr(safeT, 'adminBackupHubConfirmDelete', 'Eliminar')}
                      </button>
                    ) : (
                      <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--ghost" disabled={isDemoMode} onClick={() => setConfirm({ kind: 'delete-auto', id: b.timestamp })}>
                        {safeT?.delete || 'Excluir'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* JSON manual */}
        <article className="admin-backup-hub-card admin-backup-hub-card--json">
          <header>
            <span className="admin-backup-hub-card__icon" aria-hidden="true">
              📄
            </span>
            <div>
              <h4>{tr(safeT, 'adminBackupHubJsonTitle', '5 últimos — JSON manual')}</h4>
              <p>{tr(safeT, 'adminBackupHubJsonDesc', 'Cópias criadas com «Criar JSON agora» — também descarregadas para o PC.')}</p>
            </div>
          </header>
          {renderSlots(manualBackups.length, 'JSON')}
          <label className="admin-backup-hub-file">
            {tr(safeT, 'adminBackupHubImportJson', 'Importar JSON externo')}
            <input type="file" accept=".json,application/json" onChange={handleRestoreBackup} disabled={isDemoMode} />
          </label>
          {manualBackups.length === 0 ? (
            <p className="admin-backup-hub-empty">{tr(safeT, 'adminBackupHubJsonEmpty', 'Crie o primeiro backup JSON acima.')}</p>
          ) : (
            <ul className="admin-backup-hub-list">
              {manualBackups.map((b, index) => (
                <li key={b.timestamp}>
                  <div>
                    <strong>#{index + 1}</strong>
                    <span>{formatWhen(b.timestamp, locale)}</span>
                  </div>
                  <div className="admin-backup-hub-list__actions">
                    <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--ghost" disabled={isDemoMode} onClick={() => downloadStoredBackupJson(b, 'backup-manual')}>
                      {tr(safeT, 'adminBackupHubDownloadJson', 'JSON')}
                    </button>
                    {confirm?.kind === 'restore-manual' && confirm.id === b.timestamp ? (
                      <>
                        <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--danger" disabled={isDemoMode} onClick={() => void runConfirm()}>
                          {tr(safeT, 'adminBackupHubConfirmRestore', 'Restaurar')}
                        </button>
                        <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--ghost" onClick={() => setConfirm(null)}>
                          {safeT?.cancel || 'Cancelar'}
                        </button>
                      </>
                    ) : (
                      <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--primary" disabled={isDemoMode} onClick={() => setConfirm({ kind: 'restore-manual', id: b.timestamp })}>
                        {tr(safeT, 'adminBackupHubRestoreOne', 'Restaurar')}
                      </button>
                    )}
                    {confirm?.kind === 'delete-manual' && confirm.id === b.timestamp ? (
                      <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--danger-outline" disabled={isDemoMode} onClick={() => void runConfirm()}>
                        {tr(safeT, 'adminBackupHubConfirmDelete', 'Eliminar')}
                      </button>
                    ) : (
                      <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--ghost" disabled={isDemoMode} onClick={() => setConfirm({ kind: 'delete-manual', id: b.timestamp })}>
                        {safeT?.delete || 'Excluir'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* Código servidor */}
        <article className="admin-backup-hub-card admin-backup-hub-card--code">
          <header>
            <span className="admin-backup-hub-card__icon" aria-hidden="true">
              💾
            </span>
            <div>
              <h4>{tr(safeT, 'adminBackupHubCodeTitle', '5 últimos — Código (servidor)')}</h4>
              <p>{tr(safeT, 'adminBackupHubCodeDesc', 'Pastas code-backup-* na pasta backups do projeto.')}</p>
            </div>
          </header>
          {renderSlots(codeList.length, 'Código')}
          <div className="admin-backup-hub-code-actions">
            <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--secondary" disabled={isDemoMode} onClick={handleBackupCodigo}>
              {safeT?.backupCodigoButton || 'Backup do código'}
            </button>
            <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--ghost admin-backup-hub-btn--sm" disabled={isDemoMode} onClick={loadCodeBackups}>
              {safeT?.updateListButton || 'Atualizar lista'}
            </button>
          </div>
          <p className="admin-backup-hub-folder">
            <span>{tr(safeT, 'adminBackupHubCodeFolder', 'Pasta')}</span>
            <code>{codeBackupsFolder || (loadingBackups ? '…' : '—')}</code>
          </p>
          {loadingBackups ? (
            <p className="admin-backup-hub-empty">{safeT?.loadingBackups || 'Carregando…'}</p>
          ) : codeList.length === 0 ? (
            <p className="admin-backup-hub-empty">{safeT?.noCodeBackups || 'Nenhum backup de código.'}</p>
          ) : (
            <ul className="admin-backup-hub-list">
              {codeList.map((backup, index) => (
                <li key={backup.path || index}>
                  <div>
                    <strong>#{index + 1}</strong>
                    <span>{formatWhen(new Date(backup.timestamp).getTime(), locale)}</span>
                    <small>{(safeT?.filesCount || '{count} ficheiros').replace('{count}', String(backup.filesCount || '—'))}</small>
                  </div>
                  <div className="admin-backup-hub-list__actions">
                    {confirm?.kind === 'restore-code' && confirm.id === backup.path ? (
                      <>
                        <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--danger" disabled={isDemoMode} onClick={() => void runConfirm()}>
                          {tr(safeT, 'adminBackupHubConfirmRestore', 'Restaurar')}
                        </button>
                        <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--ghost" onClick={() => setConfirm(null)}>
                          {safeT?.cancel || 'Cancelar'}
                        </button>
                      </>
                    ) : (
                      <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--primary" disabled={isDemoMode} onClick={() => setConfirm({ kind: 'restore-code', id: backup.path })}>
                        {safeT?.restoreButton || 'Restaurar'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* ZIP */}
        <article className="admin-backup-hub-card admin-backup-hub-card--zip">
          <header>
            <span className="admin-backup-hub-card__icon" aria-hidden="true">
              📦
            </span>
            <div>
              <h4>{tr(safeT, 'adminBackupHubZipTitle', '5 últimos — ZIP descarregados')}</h4>
              <p>{tr(safeT, 'adminBackupHubZipDesc', 'Histórico de ZIP guardados no PC + restauro a partir de ficheiro.')}</p>
            </div>
          </header>
          {renderSlots(zipHistory.length, 'ZIP')}
          <div className="admin-backup-hub-code-actions">
            <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--secondary" disabled={isDemoMode} onClick={handleDownloadBackupZip}>
              {tr(safeT, 'adminBackupHubDownloadZip', 'Descarregar ZIP agora')}
            </button>
            <input ref={restoreFromZipInputRef} type="file" accept=".zip" onChange={handleRestoreFromZip} hidden />
            <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--ghost" disabled={isDemoMode || restoringFromZip} onClick={() => restoreFromZipInputRef.current?.click()}>
              {restoringFromZip ? tr(safeT, 'adminBackupHubRestoringZip', 'A restaurar…') : tr(safeT, 'adminBackupHubRestoreZipFile', 'Restaurar de ZIP')}
            </button>
          </div>
          {zipHistory.length === 0 ? (
            <p className="admin-backup-hub-empty">{tr(safeT, 'adminBackupHubZipEmpty', 'Ainda não descarregou ZIP — faça o primeiro acima.')}</p>
          ) : (
            <ul className="admin-backup-hub-list admin-backup-hub-list--meta">
              {zipHistory.map((entry, index) => (
                <li key={entry.timestamp}>
                  <div>
                    <strong>#{index + 1}</strong>
                    <span>{formatWhen(entry.timestamp, locale)}</span>
                    <small>
                      {entry.fileName} · {formatBackupBytes(entry.sizeBytes)}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  )
}

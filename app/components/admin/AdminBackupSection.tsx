'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  handleDownloadDataZip: () => void
  handleRestoreBackup: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleBackupCodigo: () => void
  handleDownloadBackupZip: () => void
  handleRestoreCodigo: (path: string) => void
  handleRestoreFromZip: (e: React.ChangeEvent<HTMLInputElement>) => void
  loadCodeBackups: (opts?: { silent?: boolean }) => void
  getAutoBackups: () => AutoBackup[]
  restoreAutoBackup: (b: AutoBackup) => void | Promise<void>
  deleteAutoBackup: (timestamp: number) => boolean
  getManualDataBackups: () => AutoBackup[]
  restoreManualDataBackup: (b: AutoBackup) => void | Promise<void>
  deleteManualDataBackup: (timestamp: number) => boolean
  downloadStoredBackupJson: (backup: AutoBackup, prefix: string) => void
  getZipHistory: () => Array<{ timestamp: number; fileName: string; sizeBytes?: number }>
}

type DiskJsonFile = { name: string; sizeBytes: number; modified: string }

type BackupStatus = {
  projectRoot?: string
  backupsFolder?: string
  jsonFolder?: string
  codigoFolder?: string
  dataFolder?: string
  dataFileCount?: number
  backupsCount?: number
  jsonCount?: number
  zipCount?: number
  projectRootValid?: boolean
  writable?: boolean
  onRailway?: boolean
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

type ConfirmState =
  | { kind: 'restore-auto' | 'restore-manual' | 'restore-code' | 'delete-auto' | 'delete-manual'; id: number | string }
  | null

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
    handleDownloadDataZip,
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
  const [status, setStatus] = useState<BackupStatus | null>(null)
  const [diskJsonFiles, setDiskJsonFiles] = useState<DiskJsonFile[]>([])
  const [statusLoading, setStatusLoading] = useState(false)
  const [codeListLoaded, setCodeListLoaded] = useState(false)
  const [isLocalHost, setIsLocalHost] = useState(true)
  const loadCodeBackupsRef = useRef(loadCodeBackups)
  const locale = localeDatetimeGeneral(selectedLanguage)

  loadCodeBackupsRef.current = loadCodeBackups

  useEffect(() => {
    if (typeof window === 'undefined') return
    const h = window.location.hostname
    setIsLocalHost(h === 'localhost' || h === '127.0.0.1')
  }, [])

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true)
    try {
      const [statusRes, jsonRes] = await Promise.all([
        fetch('/api/backup-code/status'),
        fetch('/api/backup-data/save'),
      ])
      if (statusRes.ok) setStatus(await statusRes.json())
      if (jsonRes.ok) {
        const jsonData = await jsonRes.json()
        setDiskJsonFiles(Array.isArray(jsonData.files) ? jsonData.files.slice(0, 8) : [])
      }
    } catch {
      setStatus(null)
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshStatus()
    loadCodeBackupsRef.current()
  }, [refreshStatus])

  useEffect(() => {
    if (!loadingBackups) setCodeListLoaded(true)
  }, [loadingBackups])

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

  const findBackup = (list: AutoBackup[], id: number | string) => list.find((b) => b.timestamp === id)

  const runConfirm = async () => {
    if (!confirm) return
    const c = confirm
    setConfirm(null)
    if (c.kind === 'restore-auto') {
      const b = findBackup(autoBackups, c.id)
      if (!b) {
        alert(tr(safeT, 'adminBackupHubInvalidBackup', 'Backup inválido ou corrompido — não contém dados.'))
        return
      }
      await restoreAutoBackup(b)
      return
    }
    if (c.kind === 'restore-manual') {
      const b = findBackup(manualBackups, c.id)
      if (!b?.data) {
        alert(tr(safeT, 'adminBackupHubInvalidBackup', 'Backup inválido ou corrompido — não contém dados.'))
        return
      }
      await restoreManualDataBackup(b)
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

  const renderBackupList = (
    backups: AutoBackup[],
    restoreKind: 'restore-auto' | 'restore-manual',
    deleteKind: 'delete-auto' | 'delete-manual',
    prefix: string,
    allowIdbOnly = false
  ) => (
    <ul className="admin-backup-hub-list">
      {backups.map((b, index) => {
        const hasData = Boolean(b.data) || (allowIdbOnly && (b as { storedInIdb?: boolean }).storedInIdb)
        return (
        <li key={b.timestamp}>
          <div>
            <strong>#{index + 1}</strong>
            <span>{formatWhen(b.timestamp, locale)}</span>
            {(b as { keyCount?: number }).keyCount ? (
              <small>{(b as { keyCount?: number }).keyCount} chaves</small>
            ) : null}
          </div>
          <div className="admin-backup-hub-list__actions">
            <button
              type="button"
              className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--ghost"
              disabled={isDemoMode || !hasData}
              onClick={() => downloadStoredBackupJson(b, prefix)}
            >
              {tr(safeT, 'adminBackupHubDownloadJson', 'JSON')}
            </button>
            {confirm?.kind === restoreKind && confirm.id === b.timestamp ? (
              <>
                <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--danger" disabled={isDemoMode} onClick={() => void runConfirm()}>
                  {tr(safeT, 'adminBackupHubConfirmRestore', 'Confirmar')}
                </button>
                <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--ghost" onClick={() => setConfirm(null)}>
                  {safeT?.cancel || 'Cancelar'}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--primary"
                disabled={isDemoMode || !hasData}
                onClick={() => setConfirm({ kind: restoreKind, id: b.timestamp })}
              >
                {tr(safeT, 'adminBackupHubRestoreOne', 'Restaurar')}
              </button>
            )}
            {confirm?.kind === deleteKind && confirm.id === b.timestamp ? (
              <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--danger-outline" disabled={isDemoMode} onClick={() => void runConfirm()}>
                {tr(safeT, 'adminBackupHubConfirmDelete', 'Eliminar')}
              </button>
            ) : (
              <button
                type="button"
                className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--ghost"
                disabled={isDemoMode}
                onClick={() => setConfirm({ kind: deleteKind, id: b.timestamp })}
              >
                {safeT?.delete || 'Excluir'}
              </button>
            )}
          </div>
        </li>
      )})}
    </ul>
  )

  if (variant === 'compact') {
    return (
      <div className="admin-section admin-section--emerald">
        <p className="admin-backup-hub__compact-note">
          {tr(safeT, 'adminBackupHubCompactNote', 'Abra a aba Administrador → Backup e segurança para o centro completo.')}
        </p>
        <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--primary" onClick={handleCreateBackup} disabled={isDemoMode}>
          {safeT?.createBackup || 'Criar Backup JSON'}
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
            <h3 className="admin-backup-hub__hero-title">{tr(safeT, 'adminBackupHubTitle', 'Centro de Backup e Restauro')}</h3>
            <p className="admin-backup-hub__hero-desc">
              {tr(
                safeT,
                'adminBackupHubDesc',
                'Separe bem: JSON = dados do sistema (clientes, relatórios, peças). Código = pastas app/ e configs. Use ambos regularmente.'
              )}
            </p>
          </div>
        </div>
      </header>

      <div className="admin-backup-hub__status">
        <div className="admin-backup-hub__status-head">
          <strong>{tr(safeT, 'adminBackupHubStatusTitle', 'Diagnóstico do servidor')}</strong>
          <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--ghost" onClick={() => { void refreshStatus(); loadCodeBackupsRef.current({ silent: codeListLoaded }) }} disabled={statusLoading}>
            {statusLoading ? '…' : tr(safeT, 'updateListButton', 'Atualizar')}
          </button>
        </div>
        <div className="admin-backup-hub__status-grid">
          <div className={`admin-backup-hub__status-pill${status?.projectRootValid ? ' ok' : ' warn'}`}>
            <span>{tr(safeT, 'adminBackupHubStatusRoot', 'Raiz do projeto')}</span>
            <code>{status?.projectRoot || '—'}</code>
          </div>
          <div className={`admin-backup-hub__status-pill${status?.writable ? ' ok' : ' warn'}`}>
            <span>{tr(safeT, 'adminBackupHubStatusJsonFolder', 'Pasta JSON (dados)')}</span>
            <code>{status?.jsonFolder || '—'}</code>
          </div>
          <div className={`admin-backup-hub__status-pill${status?.writable ? ' ok' : ' warn'}`}>
            <span>{tr(safeT, 'adminBackupHubStatusCodigoFolder', 'Pasta CÓDIGO (ZIP)')}</span>
            <code>{status?.codigoFolder || codeBackupsFolder || '—'}</code>
          </div>
          <div className="admin-backup-hub__status-pill">
            <span>{tr(safeT, 'adminBackupHubStatusJsonCount', 'Ficheiros JSON')}</span>
            <strong>{status?.jsonCount ?? '—'}</strong>
          </div>
          <div className="admin-backup-hub__status-pill">
            <span>{tr(safeT, 'adminBackupHubStatusZipCount', 'Ficheiros ZIP')}</span>
            <strong>{status?.zipCount ?? '—'}</strong>
          </div>
          <div className="admin-backup-hub__status-pill">
            <span>{tr(safeT, 'adminBackupHubStatusDataCount', 'Ficheiros data/')}</span>
            <strong>{status?.dataFileCount ?? '—'}</strong>
          </div>
          <div className="admin-backup-hub__status-pill">
            <span>{tr(safeT, 'adminBackupHubStatusCount', 'Pastas código')}</span>
            <strong>{status?.backupsCount ?? codeList.length}</strong>
          </div>
          <div className={`admin-backup-hub__status-pill${status?.onRailway ? ' warn' : ' ok'}`}>
            <span>{tr(safeT, 'adminBackupHubStatusEnv', 'Ambiente')}</span>
            <strong>
              {status?.onRailway
                ? tr(safeT, 'adminBackupHubStatusEnvRailway', 'Railway / Cloud')
                : tr(safeT, 'adminBackupHubStatusEnvLocal', 'Local')}
            </strong>
          </div>
        </div>
        <p className="admin-backup-hub__status-hint">
          {tr(
            safeT,
            'adminBackupHubFoldersHint',
            'Os backups ficam em backups/json/ (dados) e backups/codigo/ (ZIP + pastas). Abra no Explorador de Ficheiros do Windows.'
          )}
        </p>
        {!isLocalHost ? (
          <p className="admin-backup-hub__demo-warn">
            {tr(
              safeT,
              'adminBackupHubNotLocalWarn',
              'Está a usar o site na internet (Railway). Os ficheiros NÃO vão para o PC — só para Descargas do browser. Para guardar na pasta do projeto, use http://localhost:3000 no mesmo PC onde corre npm run dev.'
            )}
          </p>
        ) : (
          <p className="admin-backup-hub__safe-note">
            {tr(
              safeT,
              'adminBackupHubLocalOpenHint',
              'No PC: duplo clique em ABRI-PASTAS-BACKUP.bat na pasta do projeto (ou SINCRONIZAR-BACKUPS-DESCARGAS.bat se só vir ficheiros em Descargas).'
            )}
          </p>
        )}
      </div>

      {isDemoMode ? (
        <p className="admin-backup-hub__demo-warn">{tr(safeT, 'adminBackupHubDemoWarn', 'Modo demonstração: backup e restauro desativados.')}</p>
      ) : null}

      <div className="admin-backup-hub-zones">
        {/* ZONA DADOS JSON */}
        <div className="admin-backup-hub-zone admin-backup-hub-zone--data">
          <h4 className="admin-backup-hub-zone__title">📊 {tr(safeT, 'adminBackupHubZoneData', 'Dados do sistema (JSON)')}</h4>
          <p className="admin-backup-hub-zone__desc">
            {tr(
              safeT,
              'adminBackupHubZoneDataDesc',
              'Restaura clientes, relatórios, peças, fotos e configurações — inclui browser + servidor. Cada backup guarda ficheiro em backups/json/ com data no nome.'
            )}
          </p>
          <p className="admin-backup-hub__safe-note">
            {tr(
              safeT,
              'adminBackupHubCompleteHint',
              'Para não perder nada: use «Criar JSON agora» + «Descarregar ZIP de dados» semanalmente. Copie a pasta backups/ para pen USB.'
            )}
          </p>

          <div className="admin-backup-hub__auto-panel">
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
                <span>{tr(safeT, 'adminBackupHubAutoEnable', 'Cópias automáticas periódicas')}</span>
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
              <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--secondary" onClick={handleDownloadDataZip} disabled={isDemoMode}>
                {isLocalHost
                  ? tr(safeT, 'adminBackupHubSaveDataZip', 'Guardar ZIP de dados em backups/json')
                  : tr(safeT, 'adminBackupHubDownloadDataZip', 'Descarregar ZIP de dados')}
              </button>
            </div>
          </div>

          {diskJsonFiles.length > 0 ? (
            <article className="admin-backup-hub-card admin-backup-hub-card--disk">
              <header>
                <h5>{tr(safeT, 'adminBackupHubDiskJsonTitle', 'JSON guardados no disco (servidor)')}</h5>
              </header>
              <ul className="admin-backup-hub-list admin-backup-hub-list--meta">
                {diskJsonFiles.map((f, index) => (
                  <li key={f.name}>
                    <div>
                      <strong>#{index + 1}</strong>
                      <span>{f.name}</span>
                      <small>
                        {formatBackupBytes(f.sizeBytes)} · {formatWhen(new Date(f.modified).getTime(), locale)}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          <div className="admin-backup-hub-grid admin-backup-hub-grid--inner">
            <article className="admin-backup-hub-card admin-backup-hub-card--system">
              <header>
                <h5>{tr(safeT, 'adminBackupHubSystemTitle', 'Automático (5 últimos)')}</h5>
              </header>
              {renderSlots(autoBackups.length, 'Sistema')}
              {autoBackups.length === 0 ? (
                <p className="admin-backup-hub-empty">{tr(safeT, 'adminBackupHubSystemEmpty', 'Sem cópias automáticas ainda.')}</p>
              ) : (
                renderBackupList(autoBackups, 'restore-auto', 'delete-auto', 'backup-auto', true)
              )}
            </article>

            <article className="admin-backup-hub-card admin-backup-hub-card--json">
              <header>
                <h5>{tr(safeT, 'adminBackupHubJsonTitle', 'Manual (5 últimos)')}</h5>
              </header>
              {renderSlots(manualBackups.length, 'JSON')}
              <label className="admin-backup-hub-file">
                {tr(safeT, 'adminBackupHubImportJson', 'Importar ficheiro JSON externo')}
                <input type="file" accept=".json,application/json" onChange={handleRestoreBackup} disabled={isDemoMode} />
              </label>
              {manualBackups.length === 0 ? (
                <p className="admin-backup-hub-empty">{tr(safeT, 'adminBackupHubJsonEmpty', 'Crie o primeiro backup JSON acima.')}</p>
              ) : (
                renderBackupList(manualBackups, 'restore-manual', 'delete-manual', 'backup-manual')
              )}
            </article>
          </div>
        </div>

        {/* ZONA CÓDIGO */}
        <div className="admin-backup-hub-zone admin-backup-hub-zone--code">
          <h4 className="admin-backup-hub-zone__title">💻 {tr(safeT, 'adminBackupHubZoneCode', 'Código-fonte (app + configs)')}</h4>
          <p className="admin-backup-hub-zone__desc">
            {tr(
              safeT,
              'adminBackupHubZoneCodeDesc',
              'Substitui app/, public/, middleware.ts e configs. ZIP guardado em backups/codigo/backup-codigo-DATA.zip'
            )}
          </p>

          <div className="admin-backup-hub-code-actions admin-backup-hub-code-actions--row">
            <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--secondary" disabled={isDemoMode} onClick={handleBackupCodigo}>
              {safeT?.backupCodigoButton || 'Criar backup no servidor'}
            </button>
            <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--secondary" disabled={isDemoMode} onClick={handleDownloadBackupZip}>
              {isLocalHost
                ? tr(safeT, 'adminBackupHubSaveCodeZip', 'Guardar ZIP em backups/codigo')
                : tr(safeT, 'adminBackupHubDownloadZip', 'Descarregar ZIP')}
            </button>
            <input ref={restoreFromZipInputRef} type="file" accept=".zip,application/zip" onChange={handleRestoreFromZip} hidden />
            <button
              type="button"
              className="admin-backup-hub-btn admin-backup-hub-btn--primary"
              disabled={isDemoMode || restoringFromZip}
              onClick={() => restoreFromZipInputRef.current?.click()}
            >
              {restoringFromZip ? tr(safeT, 'adminBackupHubRestoringZip', 'A restaurar ZIP…') : tr(safeT, 'adminBackupHubRestoreZipFile', 'Restaurar de ZIP')}
            </button>
          </div>

          <article className="admin-backup-hub-card admin-backup-hub-card--code">
            <header>
              <h5>{tr(safeT, 'adminBackupHubCodeTitle', 'Backups no servidor (5 últimos)')}</h5>
            </header>
            {renderSlots(codeList.length, 'Código')}
            {loadingBackups && !codeListLoaded ? (
              <p className="admin-backup-hub-empty admin-backup-hub-empty--reserved">{safeT?.loadingBackups || 'Carregando…'}</p>
            ) : codeList.length === 0 ? (
              <p className="admin-backup-hub-empty">{safeT?.noCodeBackups || 'Nenhum backup de código — crie o primeiro acima.'}</p>
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
                            {tr(safeT, 'adminBackupHubConfirmRestoreCode', 'Confirmar restauro')}
                          </button>
                          <button type="button" className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--ghost" onClick={() => setConfirm(null)}>
                            {safeT?.cancel || 'Cancelar'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="admin-backup-hub-btn admin-backup-hub-btn--xs admin-backup-hub-btn--primary"
                          disabled={isDemoMode}
                          onClick={() => setConfirm({ kind: 'restore-code', id: backup.path })}
                        >
                          {safeT?.restoreButton || 'Restaurar'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-backup-hub-card admin-backup-hub-card--zip">
            <header>
              <h5>{tr(safeT, 'adminBackupHubZipTitle', 'Histórico de ZIP descarregados')}</h5>
            </header>
            {zipHistory.length === 0 ? (
              <p className="admin-backup-hub-empty">
                {isLocalHost
                  ? tr(safeT, 'adminBackupHubZipEmptyLocal', 'Guarde um ZIP acima — fica em backups/codigo/ dentro do projeto.')
                  : tr(safeT, 'adminBackupHubZipEmpty', 'Descarregue um ZIP para guardar cópia no PC.')}
              </p>
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
      </div>
    </section>
  )
}

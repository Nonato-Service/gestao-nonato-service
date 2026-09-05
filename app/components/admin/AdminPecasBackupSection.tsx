'use client'

import React, { useMemo, useRef, useState } from 'react'
import type { CategoriaPeca, PecaBiblioteca, SubcategoriaPeca } from '../../modules/biblioteca/pecaTipos'
import {
  applyPecasBackupImport,
  buildPecasBackupPayload,
  countPecasComImagemBase64,
  downloadJsonBlob,
  enrichPecasParaBackup,
  parsePecasBackupJson,
  pecasBackupFileName,
  CATEGORIAS_PECAS_STORAGE_KEY,
  PECAS_BIBLIOTECA_STORAGE_KEY,
  SUBCATEGORIAS_PECAS_STORAGE_KEY,
  type ApplyPecasBackupMode,
} from '../../modules/biblioteca/pecasBackup'
import type { SafeT } from './adminTypes'

export type AdminPecasBackupSectionProps = {
  safeT: SafeT
  isDemoMode?: boolean
  pecasBiblioteca: PecaBiblioteca[]
  categoriasPecas: CategoriaPeca[]
  subcategoriasPecas: SubcategoriaPeca[]
  setPecasBiblioteca: (next: PecaBiblioteca[]) => void
  setCategoriasPecas: (next: CategoriaPeca[]) => void
  setSubcategoriasPecas: (next: SubcategoriaPeca[]) => void
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
  loadData: (key: string) => Promise<unknown>
}

function tr(safeT: SafeT, key: string, fallback: string): string {
  return (safeT as Record<string, string | undefined>)[key] || fallback
}

export function AdminPecasBackupSection({
  safeT,
  isDemoMode = false,
  pecasBiblioteca,
  categoriasPecas,
  subcategoriasPecas,
  setPecasBiblioteca,
  setCategoriasPecas,
  setSubcategoriasPecas,
  saveData,
  loadData,
}: AdminPecasBackupSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'export' | 'import' | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [pendingImport, setPendingImport] = useState<{
    mode: ApplyPecasBackupMode
    fileName: string
    pecas: PecaBiblioteca[]
    categorias: CategoriaPeca[]
    subcategorias: SubcategoriaPeca[]
  } | null>(null)

  const memoryImages = useMemo(
    () => countPecasComImagemBase64(pecasBiblioteca),
    [pecasBiblioteca]
  )

  const runExport = async () => {
    if (isDemoMode || busy) return
    setBusy('export')
    setStatusMsg('')
    try {
      let fromStorage: unknown = null
      try {
        fromStorage = await loadData(PECAS_BIBLIOTECA_STORAGE_KEY)
      } catch {
        fromStorage = null
      }
      const pecas = enrichPecasParaBackup(pecasBiblioteca, fromStorage)
      if (pecas.length === 0) {
        alert(tr(safeT, 'adminPecasBackupExportEmpty', 'Não há peças para exportar.'))
        return
      }
      let categorias = categoriasPecas
      let subcategorias = subcategoriasPecas
      try {
        const cats = await loadData(CATEGORIAS_PECAS_STORAGE_KEY)
        if (Array.isArray(cats) && cats.length > 0) categorias = cats as CategoriaPeca[]
      } catch {
        /* manter memória */
      }
      try {
        const subs = await loadData(SUBCATEGORIAS_PECAS_STORAGE_KEY)
        if (Array.isArray(subs) && subs.length > 0) subcategorias = subs as SubcategoriaPeca[]
      } catch {
        /* manter memória */
      }

      const payload = buildPecasBackupPayload({ pecas, categorias, subcategorias })
      downloadJsonBlob(pecasBackupFileName(), payload)
      setStatusMsg(
        tr(safeT, 'adminPecasBackupExportOk', 'Backup das peças descarregado ({n} peças, {img} com imagem).')
          .replace('{n}', String(payload.stats.pecas))
          .replace('{img}', String(payload.stats.comImagemBase64))
      )
    } catch (err) {
      console.error('[AdminPecasBackup] export failed', err)
      alert(tr(safeT, 'adminPecasBackupExportFail', 'Falha ao exportar o JSON das peças.'))
    } finally {
      setBusy(null)
    }
  }

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || isDemoMode || busy) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''))
        const backup = parsePecasBackupJson(parsed)
        if (!backup || backup.pecas.length === 0) {
          alert(
            tr(
              safeT,
              'adminPecasBackupImportInvalid',
              'Ficheiro inválido ou sem peças. Esperado JSON da biblioteca de peças.'
            )
          )
          return
        }
        setPendingImport({
          mode: 'merge',
          fileName: file.name,
          pecas: backup.pecas,
          categorias: backup.categorias,
          subcategorias: backup.subcategorias,
        })
        setStatusMsg('')
      } catch {
        alert(tr(safeT, 'adminPecasBackupImportInvalid', 'Ficheiro inválido ou sem peças. Esperado JSON da biblioteca de peças.'))
      }
    }
    reader.readAsText(file)
  }

  const confirmImport = async () => {
    if (!pendingImport || isDemoMode || busy) return
    if (pendingImport.pecas.length === 0) {
      alert(tr(safeT, 'adminPecasBackupImportEmpty', 'Importação bloqueada: o ficheiro não tem peças.'))
      setPendingImport(null)
      return
    }
    if (pendingImport.mode === 'replace') {
      const ok = window.confirm(
        tr(
          safeT,
          'adminPecasBackupReplaceConfirm',
          'SUBSTITUIR a biblioteca actual por este ficheiro? As peças que não estiverem no JSON serão removidas deste aparelho. Esta ação exige confirmação explícita.'
        )
      )
      if (!ok) return
    } else {
      const ok = window.confirm(
        tr(
          safeT,
          'adminPecasBackupMergeConfirm',
          'Fundir (merge) este backup com a biblioteca actual? Peças existentes são actualizadas por id/código; nada é apagado sem estar no ficheiro.'
        )
      )
      if (!ok) return
    }

    setBusy('import')
    try {
      const applied = applyPecasBackupImport({
        mode: pendingImport.mode,
        currentPecas: pecasBiblioteca,
        currentCategorias: categoriasPecas,
        currentSubcategorias: subcategoriasPecas,
        incoming: {
          pecas: pendingImport.pecas,
          categorias: pendingImport.categorias,
          subcategorias: pendingImport.subcategorias,
        },
      })
      if (!applied || applied.pecas.length === 0) {
        alert(tr(safeT, 'adminPecasBackupImportEmpty', 'Importação bloqueada: o ficheiro não tem peças.'))
        return
      }

      setPecasBiblioteca(applied.pecas)
      setCategoriasPecas(applied.categorias)
      setSubcategoriasPecas(applied.subcategorias)

      const okPecas = await saveData(PECAS_BIBLIOTECA_STORAGE_KEY, applied.pecas, true, true)
      if (applied.categorias.length > 0) {
        await saveData(CATEGORIAS_PECAS_STORAGE_KEY, applied.categorias, true, true)
      }
      if (applied.subcategorias.length > 0) {
        await saveData(SUBCATEGORIAS_PECAS_STORAGE_KEY, applied.subcategorias, true, true)
      }

      if (!okPecas) {
        alert(tr(safeT, 'adminPecasBackupImportSaveWarn', 'Peças actualizadas na memória; o envio ao servidor pode ter falhado — verifique a ligação.'))
      }

      setStatusMsg(
        tr(safeT, 'adminPecasBackupImportOk', 'Importação concluída: {n} peças ({mode}).')
          .replace('{n}', String(applied.pecas.length))
          .replace(
            '{mode}',
            pendingImport.mode === 'replace'
              ? tr(safeT, 'adminPecasBackupReplace', 'Substituir')
              : tr(safeT, 'adminPecasBackupMerge', 'Fundir')
          )
      )
      setPendingImport(null)
    } catch (err) {
      console.error('[AdminPecasBackup] import failed', err)
      alert(tr(safeT, 'adminPecasBackupImportFail', 'Falha ao importar o JSON das peças.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className={`admin-pecas-backup${isDemoMode ? ' admin-pecas-backup--demo' : ''}`}>
      <header className="admin-pecas-backup__hero">
        <div className="admin-pecas-backup__hero-icon" aria-hidden="true">
          🧩
        </div>
        <div>
          <h3 className="admin-pecas-backup__title">
            {tr(safeT, 'adminPecasBackupTitle', 'Backup / cópia de segurança das peças')}
          </h3>
          <p className="admin-pecas-backup__desc">
            {tr(
              safeT,
              'adminPecasBackupHint',
              'Descarrega ou restaura só a biblioteca de peças (códigos, descrições, preços, categorias e imagens). Não mistura com «Enviar tudo ao servidor».'
            )}
          </p>
        </div>
      </header>

      {isDemoMode ? (
        <p className="admin-pecas-backup__warn">
          {tr(safeT, 'adminPecasBackupDemoBlocked', 'Modo demonstração: exportação/importação de peças desactivada.')}
        </p>
      ) : null}

      <div className="admin-pecas-backup__stats">
        <div className="admin-pecas-backup__stat">
          <span>{tr(safeT, 'adminPecasBackupCountLabel', 'Peças na memória')}</span>
          <strong>{pecasBiblioteca.length}</strong>
        </div>
        <div className="admin-pecas-backup__stat">
          <span>{tr(safeT, 'adminPecasBackupImagesLabel', 'Com imagem (base64)')}</span>
          <strong>{memoryImages}</strong>
        </div>
        <div className="admin-pecas-backup__stat">
          <span>{tr(safeT, 'adminPecasBackupCatsLabel', 'Categorias')}</span>
          <strong>{categoriasPecas.length}</strong>
        </div>
      </div>

      <div className="admin-pecas-backup__actions">
        <button
          type="button"
          className="admin-pecas-backup-btn admin-pecas-backup-btn--primary"
          disabled={isDemoMode || busy !== null || pecasBiblioteca.length === 0}
          onClick={() => void runExport()}
        >
          {busy === 'export'
            ? tr(safeT, 'adminPecasBackupExporting', 'A preparar JSON…')
            : tr(safeT, 'adminPecasBackupExport', 'Exportar / Descarregar JSON')}
        </button>
        <button
          type="button"
          className="admin-pecas-backup-btn admin-pecas-backup-btn--ghost"
          disabled={isDemoMode || busy !== null}
          onClick={() => fileInputRef.current?.click()}
        >
          {tr(safeT, 'adminPecasBackupImport', 'Importar JSON')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={onPickFile}
        />
      </div>

      {pendingImport ? (
        <div className="admin-pecas-backup__pending">
          <p>
            {tr(safeT, 'adminPecasBackupPendingFile', 'Ficheiro')}: <strong>{pendingImport.fileName}</strong>
            {' — '}
            {pendingImport.pecas.length} {tr(safeT, 'adminPecasBackupPendingPecas', 'peças')}
            {', '}
            {countPecasComImagemBase64(pendingImport.pecas)}{' '}
            {tr(safeT, 'adminPecasBackupPendingImages', 'com imagem')}
          </p>
          <div className="admin-pecas-backup__mode">
            <label>
              <input
                type="radio"
                name="pecas-backup-mode"
                checked={pendingImport.mode === 'merge'}
                onChange={() => setPendingImport({ ...pendingImport, mode: 'merge' })}
              />
              {tr(safeT, 'adminPecasBackupMerge', 'Fundir (recomendado)')}
            </label>
            <label>
              <input
                type="radio"
                name="pecas-backup-mode"
                checked={pendingImport.mode === 'replace'}
                onChange={() => setPendingImport({ ...pendingImport, mode: 'replace' })}
              />
              {tr(safeT, 'adminPecasBackupReplace', 'Substituir (requer confirmação)')}
            </label>
          </div>
          <div className="admin-pecas-backup__pending-actions">
            <button
              type="button"
              className="admin-pecas-backup-btn admin-pecas-backup-btn--primary"
              disabled={busy !== null}
              onClick={() => void confirmImport()}
            >
              {busy === 'import'
                ? tr(safeT, 'adminPecasBackupImporting', 'A importar…')
                : tr(safeT, 'adminPecasBackupConfirmImport', 'Confirmar importação')}
            </button>
            <button
              type="button"
              className="admin-pecas-backup-btn admin-pecas-backup-btn--ghost"
              disabled={busy !== null}
              onClick={() => setPendingImport(null)}
            >
              {safeT?.cancel || tr(safeT, 'adminPecasBackupCancel', 'Cancelar')}
            </button>
          </div>
        </div>
      ) : null}

      {statusMsg ? <p className="admin-pecas-backup__status">{statusMsg}</p> : null}
    </section>
  )
}

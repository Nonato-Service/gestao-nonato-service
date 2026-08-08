/**
 * Backup e restauro completos — todas as chaves nonato-* + IndexedDB + servidor.
 * Compatível com backups antigos (v1.0.0 com campos nomeados).
 */

import { NONATO_CRITICAL_CADASTRO_KEYS } from '../lib/criticalCadastroKeys'
import { mergeArraysByIdDeferServerLocal } from '../lib/mergeArraysById'
import { collectAllLocalNonatoDataForSync, loadAllFromServer, saveAllToServer, saveData } from './dataStorage'
import {
  collectAllNonatoKvFromIdb,
  getKv,
  saveManuaisFamiliasGruposToIdb,
  saveKv,
} from './manuaisIndexedDb'

export const BACKUP_VERSION = '2.1.0'
export const AUTO_BACKUP_STORAGE_KEY = 'nonato-auto-backups'
export const AUTO_BACKUP_IDB_MIRROR_KEY = 'nonato-auto-backups-idb-mirror'
export const MAX_AUTO_BACKUPS = 5
export const MAX_MANUAL_DATA_BACKUPS = 5
export const MANUAL_DATA_BACKUP_STORAGE_KEY = 'nonato-manual-data-backups'

const SKIP_BACKUP_KEYS = new Set([
  'nonato-auto-backups',
  'nonato-auto-backups-idb-mirror',
  'nonato-code-backups',
  'nonato-sync-queue',
  'nonato-pending-full-server-replace',
  'nonato-manual-data-backups',
  'nonato-zip-download-history',
  'nonato-relatorios-servico-backup-v1',
  'nonato-auto-backup-enabled',
  'nonato-auto-backup-interval',
])

/** Mapa v1 (campos nomeados) → chaves localStorage */
const LEGACY_FIELD_TO_KEY: Record<string, string> = {
  logo: 'nonato-logo',
  logoType: 'nonato-logo-type',
  language: 'nonato-language',
  users: 'nonato-users',
  gestores: 'nonato-gestores',
  tecnicos: 'nonato-tecnicos',
  conhecimentoTecnicos: 'nonato-conhecimento-tecnicos',
  equipamentos: 'nonato-equipamentos',
  clientes: 'nonato-clientes',
  clientePrioritario: 'nonato-cliente-prioritario',
  fornecedores: 'nonato-fornecedores',
  relatoriosServico: 'nonato-relatorios-servico',
  pecasBiblioteca: 'nonato-pecas-biblioteca',
  categoriasPecas: 'nonato-categorias-pecas',
  subcategoriasPecas: 'nonato-subcategorias-pecas',
  agendamentos: 'nonato-agendamentos',
  fechamentosRelatorios: 'nonato-fechamentos-relatorios',
  fechamentosFluxoFinanceiro: 'nonato-fechamentos-fluxo-financeiro',
  fechamentosGuardadosBiblioteca: 'nonato-fechamentos-guardados-biblioteca',
  despesasDocumentos: 'nonato-despesas-documentos',
  cartoesEmpresaDespesas: 'nonato-cartoes-empresa-despesas',
  comprovantesDespesas: 'nonato-comprovantes-despesas',
  sidebarButtons: 'nonato-sidebar-buttons',
  manuaisFamiliasGrupos: 'nonato-manuais-familias-grupos',
  servicos: 'nonato-servicos',
  servicoGrupos: 'nonato-servicos-grupos',
  servicosGrupos: 'nonato-servicos-grupos',
  fichaCadastral: 'nonato-ficha-cadastral',
  biblia: 'nonato-biblia-nonato-service',
}

function parseRawValue(raw: unknown): any | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'string') {
    const s = raw.trim()
    if (!s) return null
    try {
      return JSON.parse(s)
    } catch {
      return s
    }
  }
  return raw
}

function serializeSize(value: any): number {
  try {
    return JSON.stringify(value).length
  } catch {
    return 0
  }
}

function isEmptyValue(value: unknown): boolean {
  if (value == null || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value as object).length === 0
  return false
}

/** Junta dados do servidor para não perder nada que só exista no PC/servidor. */
export async function mergeServerIntoBackup(local: Record<string, any>): Promise<Record<string, any>> {
  const out = { ...local }
  try {
    const { data: server, ok } = await loadAllFromServer()
    if (!ok || !server || typeof server !== 'object') return out

    for (const [key, serverVal] of Object.entries(server)) {
      if (!key.startsWith('nonato-') || SKIP_BACKUP_KEYS.has(key)) continue
      if (serverVal == null) continue

      const localVal = out[key]
      if (isEmptyValue(localVal)) {
        out[key] = serverVal
        continue
      }

      if (Array.isArray(localVal) && Array.isArray(serverVal)) {
        out[key] = mergeArraysByIdDeferServerLocal(serverVal, localVal)
        continue
      }

      if (typeof localVal === 'object' && typeof serverVal === 'object' && !Array.isArray(localVal)) {
        out[key] = { ...(serverVal as object), ...(localVal as object) }
      }
    }
  } catch (e) {
    console.warn('[backup] merge servidor ignorado:', e)
  }
  return out
}

/** Junta localStorage + spillover IndexedDB (exceto meta-backups). */
export async function collectFullBackupData(opts?: {
  includeServer?: boolean
}): Promise<Record<string, any>> {
  let out = await collectAllLocalNonatoDataForSync()

  try {
    const idb = await collectAllNonatoKvFromIdb()
    for (const [key, value] of Object.entries(idb)) {
      if (value == null || SKIP_BACKUP_KEYS.has(key)) continue
      if (out[key] == null) {
        out[key] = value
      } else if (Array.isArray(out[key]) && Array.isArray(value)) {
        out[key] = mergeArraysByIdDeferServerLocal(value, out[key])
      }
    }
  } catch {
    /* ignorar IDB */
  }

  for (const k of SKIP_BACKUP_KEYS) delete out[k]

  if (opts?.includeServer) {
    out = await mergeServerIntoBackup(out)
  }

  return out
}

export function buildBackupEnvelope(data: Record<string, any>, timestamp?: number) {
  const keys = Object.keys(data).sort()
  const sizes: Record<string, number> = {}
  for (const k of keys) {
    sizes[k] = serializeSize(data[k])
  }
  return {
    version: BACKUP_VERSION,
    format: 'full-keys',
    date: new Date().toISOString(),
    timestamp: timestamp ?? Date.now(),
    meta: {
      keyCount: keys.length,
      keys,
      sizes,
      app: 'gestao-tecnica-nonato-service',
      complete: true,
    },
    data,
  }
}

/** Converte ficheiro JSON (v1, v2 ou chaves flat) para mapa chave → valor. */
export function normalizeBackupFile(parsed: unknown): Record<string, any> {
  if (!parsed || typeof parsed !== 'object') throw new Error('Backup inválido')
  const root = parsed as Record<string, unknown>

  if (Object.keys(root).some((k) => k.startsWith('nonato-'))) {
    const flat: Record<string, any> = {}
    for (const [key, raw] of Object.entries(root)) {
      if (!key.startsWith('nonato-')) continue
      const v = parseRawValue(raw)
      if (v !== null) flat[key] = v
    }
    if (Object.keys(flat).length > 0) return flat
  }

  const inner = root.data
  if (!inner || typeof inner !== 'object') throw new Error('Estrutura de backup inválida')

  const data = inner as Record<string, unknown>

  if (root.format === 'full-keys' || Object.keys(data).some((k) => k.startsWith('nonato-'))) {
    const out: Record<string, any> = {}
    for (const [key, raw] of Object.entries(data)) {
      if (!key.startsWith('nonato-')) continue
      const v = parseRawValue(raw)
      if (v !== null) out[key] = v
    }
    return out
  }

  const out: Record<string, any> = {}
  for (const [field, key] of Object.entries(LEGACY_FIELD_TO_KEY)) {
    if (!(field in data)) continue
    const v = parseRawValue(data[field])
    if (v !== null) out[key] = v
  }
  return out
}

async function applyToLocalStorage(key: string, value: any): Promise<void> {
  if (typeof window === 'undefined') return
  if (key === 'nonato-manuais-familias-grupos') {
    const s = JSON.stringify(value)
    try {
      localStorage.setItem(key, s)
    } catch {
      try {
        localStorage.setItem(`${key}--idb`, '1')
      } catch {
        /* ignorar */
      }
    }
    await saveManuaisFamiliasGruposToIdb(value)
    return
  }
  const serialized = typeof value === 'string' ? value : JSON.stringify(value)
  try {
    localStorage.setItem(key, serialized)
  } catch {
    await saveData(key, value, true, false)
  }
}

export type RestoreResult = {
  ok: boolean
  keysRestored: number
  serverOk: boolean
  error?: string
}

/** Restaura backup completo: browser + servidor. */
export async function restoreFullBackup(keyMap: Record<string, any>): Promise<RestoreResult> {
  const keys = Object.keys(keyMap).filter((k) => k.startsWith('nonato-'))
  if (keys.length === 0) {
    return { ok: false, keysRestored: 0, serverOk: false, error: 'Nenhuma chave nonato-* no backup.' }
  }

  for (const key of keys) {
    await applyToLocalStorage(key, keyMap[key])
  }

  let serverOk = false
  try {
    serverOk = await saveAllToServer(keyMap, { timeoutMs: 240000 })
  } catch (e) {
    console.error('[restoreFullBackup] saveAllToServer', e)
  }

  if (!serverOk) {
    let savedAny = false
    for (const key of keys) {
      try {
        const ok = await saveData(key, keyMap[key], false, true)
        if (ok) savedAny = true
      } catch {
        /* continuar */
      }
    }
    serverOk = savedAny
  }

  return { ok: true, keysRestored: keys.length, serverOk }
}

export type StoredBackupEntry = { timestamp: number; data: unknown; keyCount?: number; storedInIdb?: boolean }

let autoBackupListCache: StoredBackupEntry[] = []

export function getAutoBackupListCached(): StoredBackupEntry[] {
  return autoBackupListCache
}

/** Lê backups automáticos — IndexedDB (completo) com fallback localStorage. */
export async function refreshAutoBackupListCache(): Promise<StoredBackupEntry[]> {
  if (typeof window === 'undefined') {
    autoBackupListCache = []
    return []
  }
  try {
    const idb = await getKv(AUTO_BACKUP_IDB_MIRROR_KEY)
    if (Array.isArray(idb) && idb.length > 0) {
      autoBackupListCache = (idb as StoredBackupEntry[]).sort((a, b) => b.timestamp - a.timestamp)
      return autoBackupListCache
    }
  } catch {
    /* fallback LS */
  }
  autoBackupListCache = readStoredBackupList(AUTO_BACKUP_STORAGE_KEY)
  return autoBackupListCache
}

export function tryPersistAutoBackups(backups: StoredBackupEntry[]): { ok: boolean; kept: number } {
  if (typeof window === 'undefined') return { ok: false, kept: 0 }

  const lightweight = backups.map((b) => {
    const env = b.data as { meta?: { keyCount?: number } } | null
    return {
      timestamp: b.timestamp,
      keyCount: env?.meta?.keyCount ?? b.keyCount ?? 0,
      storedInIdb: true,
      data: null,
    }
  })

  let working = lightweight.slice()
  while (working.length > 0) {
    try {
      localStorage.setItem(AUTO_BACKUP_STORAGE_KEY, JSON.stringify(working))
      return { ok: true, kept: working.length }
    } catch (e: unknown) {
      const msg = String((e as Error)?.message || e)
      if ((e as { name?: string })?.name === 'QuotaExceededError' || msg.toLowerCase().includes('quota')) {
        working = working.slice(0, Math.max(0, working.length - 1))
        continue
      }
      throw e
    }
  }
  try {
    localStorage.removeItem(AUTO_BACKUP_STORAGE_KEY)
  } catch {
    /* ignorar */
  }
  return { ok: false, kept: 0 }
}

async function resolveBackupEntryData(entry: StoredBackupEntry): Promise<unknown> {
  if (entry.data) return entry.data
  const list = await refreshAutoBackupListCache()
  const found = list.find((b) => b.timestamp === entry.timestamp)
  return found?.data ?? null
}

/** Guarda backup automático no disco (localhost) — silencioso se falhar. */
async function persistAutoBackupToDisk(envelope: ReturnType<typeof buildBackupEnvelope>): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await fetch('/api/backup-data/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    })
  } catch {
    /* offline ou Railway — ignorar */
  }
}

export async function createAutoBackupEntry(): Promise<boolean> {
  const data = await collectFullBackupData({ includeServer: true })
  const envelope = buildBackupEnvelope(data)

  let backups: StoredBackupEntry[] = []
  try {
    const idb = await getKv(AUTO_BACKUP_IDB_MIRROR_KEY)
    if (Array.isArray(idb)) backups = idb as StoredBackupEntry[]
  } catch {
    backups = readStoredBackupList(AUTO_BACKUP_STORAGE_KEY)
  }

  backups.push({ timestamp: envelope.timestamp, data: envelope, keyCount: envelope.meta.keyCount })
  backups.sort((a, b) => b.timestamp - a.timestamp)
  if (backups.length > MAX_AUTO_BACKUPS) backups = backups.slice(0, MAX_AUTO_BACKUPS)

  let idbOk = false
  try {
    await saveKv(AUTO_BACKUP_IDB_MIRROR_KEY, backups)
    idbOk = true
  } catch (e) {
    console.error('[auto-backup] IndexedDB falhou:', e)
  }

  const persisted = tryPersistAutoBackups(backups)
  autoBackupListCache = backups
  void persistAutoBackupToDisk(envelope)

  return idbOk || persisted.ok || backups.length > 0
}

export function readStoredBackupList(storageKey: string): StoredBackupEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.sort((a: StoredBackupEntry, b: StoredBackupEntry) => b.timestamp - a.timestamp)
  } catch {
    return []
  }
}

export function tryPersistStoredBackups(
  storageKey: string,
  backups: StoredBackupEntry[],
  max: number
): { ok: boolean; kept: number } {
  if (typeof window === 'undefined') return { ok: false, kept: 0 }
  let working = backups.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, max)
  while (working.length > 0) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(working))
      return { ok: true, kept: working.length }
    } catch (e: unknown) {
      const msg = String((e as Error)?.message || e)
      if ((e as { name?: string })?.name === 'QuotaExceededError' || msg.toLowerCase().includes('quota')) {
        working = working.slice(0, Math.max(0, working.length - 1))
        continue
      }
      throw e
    }
  }
  try {
    localStorage.removeItem(storageKey)
  } catch {
    /* ignorar */
  }
  return { ok: false, kept: 0 }
}

export async function pushManualDataBackupEntry(): Promise<{ ok: boolean; timestamp: number }> {
  const data = await collectFullBackupData({ includeServer: true })
  const envelope = buildBackupEnvelope(data)
  return pushManualDataBackupFromEnvelope(envelope)
}

export function pushManualDataBackupFromEnvelope(envelope: ReturnType<typeof buildBackupEnvelope>): { ok: boolean; timestamp: number } {
  const existing = readStoredBackupList(MANUAL_DATA_BACKUP_STORAGE_KEY)
  const next = [{ timestamp: envelope.timestamp, data: envelope }, ...existing.filter((b) => b.timestamp !== envelope.timestamp)]
  const persisted = tryPersistStoredBackups(MANUAL_DATA_BACKUP_STORAGE_KEY, next, MAX_MANUAL_DATA_BACKUPS)
  return { ok: persisted.ok, timestamp: envelope.timestamp }
}

export function deleteStoredBackupEntry(storageKey: string, timestamp: number): boolean {
  const list = readStoredBackupList(storageKey).filter((b) => b.timestamp !== timestamp)
  try {
    if (list.length === 0) {
      localStorage.removeItem(storageKey)
    } else {
      localStorage.setItem(storageKey, JSON.stringify(list))
    }
    return true
  } catch {
    return false
  }
}

export async function deleteAutoBackupEntry(timestamp: number): Promise<boolean> {
  let backups = autoBackupListCache.length ? autoBackupListCache : await refreshAutoBackupListCache()
  backups = backups.filter((b) => b.timestamp !== timestamp)
  try {
    await saveKv(AUTO_BACKUP_IDB_MIRROR_KEY, backups)
  } catch {
    /* ignorar */
  }
  tryPersistAutoBackups(backups)
  autoBackupListCache = backups
  return true
}

export async function restoreAutoBackupEntry(backup: StoredBackupEntry): Promise<unknown> {
  const data = await resolveBackupEntryData(backup)
  if (!data) throw new Error('Backup automático não encontrado — dados podem estar corrompidos.')
  return data
}

export function downloadBackupJson(envelope: unknown, fileName: string): void {
  const jsonStr = JSON.stringify(envelope, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Resumo do backup para mostrar na UI. */
export function summarizeBackupEnvelope(envelope: unknown): { keyCount: number; totalBytes: number; criticalMissing: string[] } {
  const root = envelope as { data?: Record<string, unknown>; meta?: { keys?: string[] } }
  const data = root?.data && typeof root.data === 'object' ? root.data : {}
  const keys = Object.keys(data)
  let totalBytes = 0
  for (const k of keys) {
    totalBytes += serializeSize(data[k])
  }
  const criticalMissing = NONATO_CRITICAL_CADASTRO_KEYS.filter((k) => isEmptyValue(data[k]))
  return { keyCount: keys.length, totalBytes, criticalMissing: [...criticalMissing] }
}

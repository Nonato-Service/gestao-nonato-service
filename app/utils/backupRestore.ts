/**
 * Backup e restauro completos — todas as chaves nonato-* + IndexedDB.
 * Compatível com backups antigos (v1.0.0 com campos nomeados).
 */

import { collectAllLocalNonatoDataForSync, saveAllToServer, saveData } from './dataStorage'
import {
  collectAllNonatoKvFromIdb,
  saveManuaisFamiliasGruposToIdb,
} from './manuaisIndexedDb'

export const BACKUP_VERSION = '2.0.0'
export const AUTO_BACKUP_STORAGE_KEY = 'nonato-auto-backups'
export const MAX_AUTO_BACKUPS = 5
export const MAX_MANUAL_DATA_BACKUPS = 5
export const MANUAL_DATA_BACKUP_STORAGE_KEY = 'nonato-manual-data-backups'
const MAX_AUTO_VALUE_CHARS = 250_000

const SKIP_BACKUP_KEYS = new Set([
  'nonato-auto-backups',
  'nonato-code-backups',
  'nonato-sync-queue',
  'nonato-pending-full-server-replace',
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
  fechamentosGuardadosBiblioteca: 'nonato-fechamentos-guardados-biblioteca',
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

function stripPhotosFromPeople(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === 'object' && 'photo' in item) {
        const { photo, ...rest } = item as Record<string, unknown>
        return rest
      }
      return item
    })
  }
  if (value && typeof value === 'object' && 'photo' in value) {
    const { photo, ...rest } = value as Record<string, unknown>
    return rest
  }
  return value
}

function isProbablyBase64Blob(value: unknown): boolean {
  return typeof value === 'string' && (value.startsWith('data:image/') || value.startsWith('data:video/'))
}

function serializeSize(value: any): number {
  try {
    return JSON.stringify(value).length
  } catch {
    return 0
  }
}

/** Junta localStorage + spillover IndexedDB (exceto meta-backups). */
export async function collectFullBackupData(opts?: {
  forAuto?: boolean
  stripPhotos?: boolean
}): Promise<Record<string, any>> {
  const out = await collectAllLocalNonatoDataForSync()

  try {
    const idb = await collectAllNonatoKvFromIdb()
    for (const [key, value] of Object.entries(idb)) {
      if (value == null || SKIP_BACKUP_KEYS.has(key)) continue
      if (out[key] == null) out[key] = value
    }
  } catch {
    /* ignorar IDB */
  }

  for (const k of SKIP_BACKUP_KEYS) delete out[k]

  if (!opts?.forAuto && !opts?.stripPhotos) return out

  const trimmed: Record<string, any> = {}
  for (const [key, value] of Object.entries(out)) {
    if (value == null) continue
    if (isProbablyBase64Blob(value)) continue
    let v = value
    if (opts?.stripPhotos && (key === 'nonato-gestores' || key === 'nonato-tecnicos')) {
      v = stripPhotosFromPeople(v)
    }
    if (opts?.forAuto && serializeSize(v) > MAX_AUTO_VALUE_CHARS) continue
    trimmed[key] = v
  }
  return trimmed
}

export function buildBackupEnvelope(data: Record<string, any>, timestamp?: number) {
  const keys = Object.keys(data).sort()
  return {
    version: BACKUP_VERSION,
    format: 'full-keys',
    date: new Date().toISOString(),
    timestamp: timestamp ?? Date.now(),
    meta: {
      keyCount: keys.length,
      keys,
      app: 'gestao-tecnica-nonato-service',
    },
    data,
  }
}

/** Converte ficheiro JSON (v1 ou v2) para mapa chave → valor. */
export function normalizeBackupFile(parsed: unknown): Record<string, any> {
  if (!parsed || typeof parsed !== 'object') throw new Error('Backup inválido')
  const root = parsed as Record<string, unknown>
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
    for (const key of keys) {
      try {
        await saveData(key, keyMap[key], false, true)
      } catch {
        /* continuar */
      }
    }
    serverOk = true
  }

  return { ok: true, keysRestored: keys.length, serverOk }
}

export function tryPersistAutoBackups(backups: Array<{ timestamp: number; data: unknown }>): { ok: boolean; kept: number } {
  if (typeof window === 'undefined') return { ok: false, kept: 0 }
  let working = backups.slice()
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

export async function createAutoBackupEntry(): Promise<boolean> {
  const data = await collectFullBackupData({ forAuto: true, stripPhotos: true })
  const envelope = buildBackupEnvelope(data)
  const existingRaw = localStorage.getItem(AUTO_BACKUP_STORAGE_KEY)
  let backups: Array<{ timestamp: number; data: unknown }> = []
  if (existingRaw) {
    try {
      backups = JSON.parse(existingRaw)
      if (!Array.isArray(backups)) backups = []
    } catch {
      backups = []
    }
  }
  backups.push({ timestamp: envelope.timestamp, data: envelope })
  backups.sort((a, b) => b.timestamp - a.timestamp)
  if (backups.length > MAX_AUTO_BACKUPS) backups = backups.slice(0, MAX_AUTO_BACKUPS)
  const persisted = tryPersistAutoBackups(backups)
  return persisted.ok
}

export type StoredBackupEntry = { timestamp: number; data: unknown }

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
  const data = await collectFullBackupData()
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

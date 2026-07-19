/**
 * Proteção de cadastros críticos — backup antes do arranque e recuperação se algo apagar dados por engano.
 */
import {
  NONATO_CRITICAL_CADASTRO_KEYS,
  localStorageKeyHasMeaningfulCadastro,
  serverKeyHasMeaningfulData,
  serverCadastroBundleIsEmpty,
} from '../lib/criticalCadastroKeys'
import { mergePecasBibliotecaArrays } from '../lib/mergePecasBiblioteca'
import { getKv, saveKv } from './manuaisIndexedDb'

const BACKUP_KEY = 'nonato-cadastro-safety-backup'
const RESTORED_FLAG = 'nonato-cadastro-safety-restored-count'
const PECAS_BIBLIOTECA_KEY = 'nonato-pecas-biblioteca'
const CATEGORIAS_PECAS_KEY = 'nonato-categorias-pecas'

function countPecasInRaw(raw: string | null | undefined): number {
  if (!raw?.trim()) return 0
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

function countCategoriasPecasLocal(): number {
  if (typeof window === 'undefined') return 0
  return countPecasInRaw(localStorage.getItem(CATEGORIAS_PECAS_KEY))
}

/** Cópia parcial (ex.: 2 peças com dezenas de categorias) — não usar como backup de segurança. */
function isPecasBibliotecaBackupSuspeito(raw: string | null | undefined): boolean {
  const n = countPecasInRaw(raw)
  if (n === 0) return false
  const catN = countCategoriasPecasLocal()
  if (catN < 10) return false
  return n < Math.max(15, Math.min(catN, 80))
}

export function hasMeaningfulCadastroInLocalStorage(): boolean {
  if (typeof window === 'undefined') return false
  return NONATO_CRITICAL_CADASTRO_KEYS.some((key) =>
    localStorageKeyHasMeaningfulCadastro(localStorage.getItem(key))
  )
}

export function countMeaningfulCadastroInRecord(data: Record<string, unknown>): number {
  return NONATO_CRITICAL_CADASTRO_KEYS.filter((key) => serverKeyHasMeaningfulData(data[key])).length
}

/** Lê peças da biblioteca para backup — localStorage ou IndexedDB (--idb). */
async function readPecasBibliotecaRawForBackup(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const fromLs = localStorage.getItem(PECAS_BIBLIOTECA_KEY)
  if (fromLs && !isPecasBibliotecaBackupSuspeito(fromLs)) return fromLs
  try {
    const fromIdb = (await getKv(PECAS_BIBLIOTECA_KEY)) as unknown
    if (Array.isArray(fromIdb) && fromIdb.length > 0) {
      const serialized = JSON.stringify(fromIdb)
      if (!isPecasBibliotecaBackupSuspeito(serialized)) return serialized
    }
  } catch {
    /* ignorar */
  }
  return fromLs && !isPecasBibliotecaBackupSuspeito(fromLs) ? fromLs : null
}

/** Guarda cópia de segurança no IndexedDB antes de qualquer arranque / wipe / deploy. */
export async function backupCriticalCadastroToIdb(): Promise<void> {
  if (typeof window === 'undefined') return
  const backup: Record<string, string> = {}
  for (const key of NONATO_CRITICAL_CADASTRO_KEYS) {
    if (key === PECAS_BIBLIOTECA_KEY) {
      const raw = await readPecasBibliotecaRawForBackup()
      if (raw && localStorageKeyHasMeaningfulCadastro(raw)) backup[key] = raw
      continue
    }
    const raw = localStorage.getItem(key)
    if (localStorageKeyHasMeaningfulCadastro(raw)) {
      backup[key] = raw!
    }
  }
  if (Object.keys(backup).length === 0) return
  try {
    await saveKv(BACKUP_KEY, backup)
  } catch {
    /* ignorar */
  }
}

/**
 * Repõe chaves críticas vazias a partir do backup de segurança.
 * @returns quantidade de chaves repostas
 */
export async function restoreCriticalCadastroFromIdbIfNeeded(): Promise<number> {
  if (typeof window === 'undefined') return 0
  let backup: Record<string, string> | null = null
  try {
    backup = (await getKv(BACKUP_KEY)) as Record<string, string> | null
  } catch {
    return 0
  }
  if (!backup || typeof backup !== 'object') return 0

  let restored = 0
  for (const key of NONATO_CRITICAL_CADASTRO_KEYS) {
    const current = localStorage.getItem(key)
    if (key === PECAS_BIBLIOTECA_KEY && isPecasBibliotecaBackupSuspeito(current)) {
      /* cópia parcial — não bloquear reparo posterior */
    } else if (localStorageKeyHasMeaningfulCadastro(current)) {
      continue
    }
    const fromBackup = backup[key]
    if (key === PECAS_BIBLIOTECA_KEY && isPecasBibliotecaBackupSuspeito(fromBackup)) continue
    if (!localStorageKeyHasMeaningfulCadastro(fromBackup)) continue
    try {
      localStorage.setItem(key, fromBackup)
      restored++
    } catch {
      /* ignorar quota */
    }
  }

  if (restored > 0) {
    try {
      sessionStorage.setItem(RESTORED_FLAG, String(restored))
    } catch {
      /* ignorar */
    }
  }
  return restored
}

/** Lê quantas chaves foram repostas nesta sessão (para aviso ao utilizador). */
export function consumeCadastroRestoredNoticeCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = sessionStorage.getItem(RESTORED_FLAG)
    sessionStorage.removeItem(RESTORED_FLAG)
    const n = raw ? parseInt(raw, 10) : 0
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

/** Funde backup de segurança num bundle de servidor vazio ou incompleto. */
export async function mergeSafetyBackupIntoServerData(
  serverData: Record<string, any>
): Promise<Record<string, any>> {
  if (!serverCadastroBundleIsEmpty(serverData as Record<string, unknown>)) {
    return serverData
  }
  let backup: Record<string, string> | null = null
  try {
    backup = (await getKv(BACKUP_KEY)) as Record<string, string> | null
  } catch {
    return serverData
  }
  if (!backup || typeof backup !== 'object') return serverData

  const merged = { ...serverData }
  let restored = 0
  for (const key of NONATO_CRITICAL_CADASTRO_KEYS) {
    if (serverKeyHasMeaningfulData(merged[key])) continue
    const fromBackup = backup[key]
    if (key === PECAS_BIBLIOTECA_KEY && isPecasBibliotecaBackupSuspeito(fromBackup)) continue
    if (!localStorageKeyHasMeaningfulCadastro(fromBackup)) continue
    try {
      merged[key] = JSON.parse(fromBackup)
      restored++
    } catch {
      merged[key] = fromBackup
      restored++
    }
  }
  if (restored > 0) {
    try {
      sessionStorage.setItem(RESTORED_FLAG, String(restored))
    } catch {
      /* ignorar */
    }
  }
  return merged
}

/** Nunca gravar snapshot offline mais vazio do que o que já existe. */
export async function safeMergeOfflineSnapshot(data: Record<string, any>): Promise<void> {
  if (typeof window === 'undefined' || Object.keys(data).length === 0) return
  if (serverCadastroBundleIsEmpty(data as Record<string, unknown>)) return

  const SNAPSHOT_KEY = 'nonato-offline-server-snapshot'
  let existing: Record<string, unknown> | null = null
  try {
    const raw = await getKv(SNAPSHOT_KEY)
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      existing = raw as Record<string, unknown>
    }
  } catch {
    /* ignorar */
  }

  const newCount = countMeaningfulCadastroInRecord(data as Record<string, unknown>)
  if (existing && !serverCadastroBundleIsEmpty(existing)) {
    const oldCount = countMeaningfulCadastroInRecord(existing)
    if (newCount < oldCount) return
  }

  let payload: Record<string, unknown> = existing ? { ...existing, ...data } : { ...data }
  const incomingPecas = data[PECAS_BIBLIOTECA_KEY]
  const existingPecas = existing?.[PECAS_BIBLIOTECA_KEY]
  if (
    Array.isArray(incomingPecas) &&
    Array.isArray(existingPecas) &&
    incomingPecas.length < existingPecas.length &&
    existingPecas.length >= 15
  ) {
    payload[PECAS_BIBLIOTECA_KEY] = mergePecasBibliotecaArrays(incomingPecas, existingPecas)
  }

  try {
    await saveKv(SNAPSHOT_KEY, payload)
  } catch (e) {
    console.warn('[Nonato] Falha ao guardar snapshot offline seguro:', e)
  }
}

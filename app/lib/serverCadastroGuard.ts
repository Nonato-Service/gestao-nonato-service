import fs from 'fs'
import {
  NONATO_PROTECTED_ARRAY_KEYS,
  NONATO_PROTECTED_OBJECT_KEYS,
  NONATO_TOMBSTONE_UNION_KEYS,
  serverKeyHasMeaningfulData,
} from './criticalCadastroKeys'
import {
  ALLOW_PROTECTED_SUBSET_SHRINK_KEYS,
  isIntentionalSubsetShrink,
} from './cadastroShrinkPolicy'

export type ServerCadastroGuardResult =
  | { allowed: true }
  | {
      allowed: false
      reason: 'empty_overwrite' | 'shrink_overwrite' | 'tombstone_shrink' | 'object_empty_overwrite' | 'object_shrink_overwrite'
      existingCount: number
      newCount: number
    }

export { ALLOW_PROTECTED_SUBSET_SHRINK_KEYS, isIntentionalSubsetShrink } from './cadastroShrinkPolicy'

function readExistingJsonArray(filePath: string): unknown[] | null {
  if (!fs.existsSync(filePath)) return null
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    if (!raw.trim()) return null
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function readExistingJsonValue(filePath: string): unknown | null {
  if (!fs.existsSync(filePath)) return null
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    if (!raw.trim()) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function countObjectKeys(value: unknown): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0
  return Object.keys(value as object).length
}

function asIdSet(value: unknown): Set<string> {
  if (!Array.isArray(value)) return new Set()
  return new Set(
    value
      .map((x) => String(x ?? '').trim())
      .filter(Boolean)
  )
}

/** Última barreira no disco: nunca gravar [] nem lista menor sobre cadastro existente. */
export function assessServerCadastroWrite(
  key: string,
  value: unknown,
  filePath: string
): ServerCadastroGuardResult {
  if (NONATO_PROTECTED_OBJECT_KEYS.has(key)) {
    if (Array.isArray(value)) {
      return { allowed: true }
    }
    const existing = readExistingJsonValue(filePath)
    const existingCount = countObjectKeys(existing)
    const newCount = countObjectKeys(value)
    if (existingCount > 0 && newCount === 0) {
      return { allowed: false, reason: 'object_empty_overwrite', existingCount, newCount }
    }
    if (existingCount > 0 && newCount < existingCount) {
      return { allowed: false, reason: 'object_shrink_overwrite', existingCount, newCount }
    }
    return { allowed: true }
  }

  if (NONATO_TOMBSTONE_UNION_KEYS.has(key) && Array.isArray(value)) {
    const existing = readExistingJsonArray(filePath) || []
    const oldSet = asIdSet(existing)
    const newSet = asIdSet(value)
    if (oldSet.size > 0 && newSet.size < oldSet.size) {
      let missing = 0
      for (const id of oldSet) {
        if (!newSet.has(id)) missing++
      }
      if (missing > 0) {
        return {
          allowed: false,
          reason: 'tombstone_shrink',
          existingCount: oldSet.size,
          newCount: newSet.size,
        }
      }
    }
    return { allowed: true }
  }

  if (!NONATO_PROTECTED_ARRAY_KEYS.has(key)) {
    return { allowed: true }
  }
  if (!Array.isArray(value)) {
    return { allowed: true }
  }

  const existing = readExistingJsonArray(filePath)
  const existingCount = existing?.length ?? 0
  const newCount = value.length

  if (existingCount > 0 && newCount === 0) {
    /** Wipe total com `[]` bloqueado — exclusões usam tombstones + lista restante (nunca vazia no servidor se ainda há histórico). */
    return { allowed: false, reason: 'empty_overwrite', existingCount, newCount }
  }
  if (existingCount > 0 && newCount < existingCount) {
    if (
      ALLOW_PROTECTED_SUBSET_SHRINK_KEYS.has(key) &&
      existing &&
      isIntentionalSubsetShrink(existing, value)
    ) {
      return { allowed: true }
    }
    return { allowed: false, reason: 'shrink_overwrite', existingCount, newCount }
  }
  return { allowed: true }
}

/** Guarda para save-text quando o payload JSON parseia para array protegido. */
export function assessServerCadastroTextWrite(
  key: string,
  textPayload: string,
  jsonFilePath: string
): ServerCadastroGuardResult {
  if (!NONATO_PROTECTED_ARRAY_KEYS.has(key)) {
    return { allowed: true }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(textPayload) as unknown
  } catch {
    return { allowed: true }
  }
  return assessServerCadastroWrite(key, parsed, jsonFilePath)
}

export function existingProtectedArrayCount(filePath: string): number {
  const existing = readExistingJsonArray(filePath)
  return existing?.length ?? 0
}

export function existingProtectedHasMeaningfulData(filePath: string): boolean {
  return serverKeyHasMeaningfulData(readExistingJsonValue(filePath))
}

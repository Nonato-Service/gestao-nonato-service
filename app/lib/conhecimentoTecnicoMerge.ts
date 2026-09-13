import {
  mergeBibliaIntoManuais as mergeBibliaIntoManuaisPure,
  manuaisToBibliaStore as manuaisToBibliaStorePure,
  buildBibliaConhecimentoFromSources as buildBibliaConhecimentoFromSourcesPure,
  buildConhecimentoTecnicoFromSources as buildConhecimentoTecnicoFromSourcesPure,
  CONHECIMENTO_TECNICO_STORAGE_KEY,
  type ManuaisFamiliasGruposPayload,
} from '../modules/manuais/conhecimentoMerge'
import { BIBLIA_NONATO_STORAGE_KEY, bibliaUid } from '../modules/manuais/bibliaTipos'

/** Re-export fino — fonte canónica em `app/modules/manuais/conhecimentoMerge`. */
export type { ManuaisFamiliasGruposPayload, ConhecimentoMergeIdFactory } from '../modules/manuais/conhecimentoMerge'
export {
  CONHECIMENTO_TECNICO_STORAGE_KEY,
  MANUAIS_STORAGE_KEY,
  DEFAULT_MARCA_NAME,
  mergeManuaisPayloads,
  buildManuaisFromSources,
} from '../modules/manuais/conhecimentoMerge'
export { BIBLIA_NONATO_STORAGE_KEY, BIBLIA_LEGACY_CATEGORIES_KEY } from '../modules/manuais/bibliaTipos'

function makeConhecimentoMergeId(prefix: 'ctg' | 'ctm'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Injeta crypto / Date.now() / Math.random() no merge canónico. */
export function mergeBibliaIntoManuais(
  bibliaRaw: unknown,
  manuais: ManuaisFamiliasGruposPayload
): ManuaisFamiliasGruposPayload {
  return mergeBibliaIntoManuaisPure(bibliaRaw, manuais, makeConhecimentoMergeId)
}

/** Injeta bibliaUid no mapper canónico. */
export function manuaisToBibliaStore(payload: ManuaisFamiliasGruposPayload) {
  return manuaisToBibliaStorePure(payload, bibliaUid)
}

export function buildBibliaConhecimentoFromSources(
  bibliaRaw: unknown,
  bibliaLegacyRaw?: unknown,
  idbBibliaRaw?: unknown
): ManuaisFamiliasGruposPayload {
  return buildBibliaConhecimentoFromSourcesPure(bibliaRaw, bibliaLegacyRaw, idbBibliaRaw, makeConhecimentoMergeId)
}

/** @deprecated Preferir buildManuaisFromSources + buildBibliaConhecimentoFromSources separados. */
export function buildConhecimentoTecnicoFromSources(
  manuaisRaw: unknown,
  bibliaRaw: unknown,
  idbManuaisRaw?: unknown,
  bibliaLegacyRaw?: unknown,
  unifiedRaw?: unknown
): ManuaisFamiliasGruposPayload {
  return buildConhecimentoTecnicoFromSourcesPure(
    manuaisRaw,
    bibliaRaw,
    idbManuaisRaw,
    bibliaLegacyRaw,
    unifiedRaw,
    makeConhecimentoMergeId
  )
}

export async function syncManuaisConhecimentoStores(
  payload: ManuaisFamiliasGruposPayload,
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
): Promise<void> {
  await saveData(CONHECIMENTO_TECNICO_STORAGE_KEY, payload, false).catch(() => {})
}

export async function syncBibliaConhecimentoStore(
  payload: ManuaisFamiliasGruposPayload,
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
): Promise<void> {
  const bibliaStore = manuaisToBibliaStore(payload)
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BIBLIA_NONATO_STORAGE_KEY, JSON.stringify(bibliaStore))
    }
  } catch {
    /* ignorar */
  }
  await saveData(BIBLIA_NONATO_STORAGE_KEY, bibliaStore, false).catch(() => {})
}

export async function syncConhecimentoTecnicoLegacyStores(
  payload: ManuaisFamiliasGruposPayload,
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
): Promise<void> {
  await syncManuaisConhecimentoStores(payload, saveData)
  await syncBibliaConhecimentoStore(payload, saveData)
}

/**
 * @deprecated Preferir `app/modules/relatorios-especiais` — reexport de compatibilidade.
 */
import {
  RELATORIOS_ESPECIAIS_DELETED_IDS_KEY,
  normalizeDeletedIds,
  mergeDeletedIds,
  filterByDeletedIds,
  readDeletedIdsFromLocalStorage as readDeletedIdsFromLocalStoragePure,
} from '../modules/relatorios-especiais/deleted'

export {
  RELATORIOS_ESPECIAIS_DELETED_IDS_KEY,
  normalizeDeletedIds,
  mergeDeletedIds,
  filterByDeletedIds,
}

/** Lê tombstones do localStorage (não usar getData do bootstrap — só existe dentro de loadAllData). */
export function readDeletedIdsFromLocalStorage(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return readDeletedIdsFromLocalStoragePure(localStorage.getItem(RELATORIOS_ESPECIAIS_DELETED_IDS_KEY))
  } catch {
    return []
  }
}

/** Re-export fino — fonte canónica em `app/modules/tradutor`. */
import {
  createTranslatorLibraryEntry as createTranslatorLibraryEntryPure,
  normalizeTranslatorLibrary as normalizeTranslatorLibraryPure,
} from '../modules/tradutor/library'
import type { TranslatorLibraryEntry } from '../modules/tradutor/tipos'

export type { TranslatorLibraryEntry } from '../modules/tradutor'
export {
  filterLibraryByLangPair,
  findLibraryMatch,
  libraryEntryExists,
} from '../modules/tradutor'

/** Injeta Date.now() nos ids em falta do payload persistido. */
export function normalizeTranslatorLibrary(raw: unknown): TranslatorLibraryEntry[] {
  return normalizeTranslatorLibraryPure(raw, { nowMs: Date.now() })
}

/** Injeta Date.now() e Math.random() no id quando o call-site não envia. */
export function createTranslatorLibraryEntry(input: {
  sourceLang: string
  sourceText: string
  targetLang: string
  targetText: string
  id?: string
}): TranslatorLibraryEntry {
  return createTranslatorLibraryEntryPure({ ...input, nowMs: Date.now(), random: Math.random })
}

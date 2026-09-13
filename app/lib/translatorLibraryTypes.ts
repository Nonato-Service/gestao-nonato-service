/** Re-export fino — fonte canónica em `app/modules/tradutor`. */
import { createTranslatorLibraryEntry as createTranslatorLibraryEntryPure } from '../modules/tradutor/library'
import type { TranslatorLibraryEntry } from '../modules/tradutor/tipos'

export type { TranslatorLibraryEntry } from '../modules/tradutor'
export {
  normalizeTranslatorLibrary,
  filterLibraryByLangPair,
  findLibraryMatch,
  libraryEntryExists,
} from '../modules/tradutor'

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

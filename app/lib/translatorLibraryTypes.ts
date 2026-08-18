/** Re-export fino — fonte canónica em `app/modules/tradutor`. */
export type { TranslatorLibraryEntry } from '../modules/tradutor'
export {
  normalizeTranslatorLibrary,
  filterLibraryByLangPair,
  findLibraryMatch,
  libraryEntryExists,
  createTranslatorLibraryEntry,
} from '../modules/tradutor'

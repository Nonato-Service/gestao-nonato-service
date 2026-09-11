/** Módulo tradutor — tipos e helpers da biblioteca por par de idiomas. */

export type { TranslatorLibraryEntry } from './tipos'

export {
  normalizeTranslatorLibrary,
  filterLibraryByLangPair,
  findLibraryMatch,
  libraryEntryExists,
  createTranslatorLibraryEntry,
} from './library'

export type {
  TranslatorLibraryFormPayload,
  CreateTranslatorLibraryFromFormOpts,
} from './fromForm'
export {
  isTranslatorLibraryFormValid,
  createTranslatorLibraryFromForm,
} from './fromForm'

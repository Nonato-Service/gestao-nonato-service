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

export type { WritingAssistLangOption } from './writingAssist'
export {
  findWritingAssistLang,
  writingAssistHasLang,
  resolveWritingAssistNativeLang,
  formatWritingAssistResultLabel,
} from './writingAssist'

export type { WritingAssistLabels } from './writingAssistLabels'
export {
  WRITING_ASSIST_NATIVE_LS_KEY,
  writingAssistIsSamePair,
  formatWritingAssistLangOption,
} from './writingAssistLabels'

export type { MyMemoryTranslationPlan } from './myMemory'
export {
  APP_TO_MYMEMORY_API,
  MYMEMORY_MAX_QUERY_CHARS,
  WRITING_ASSIST_FIELD_MAX_CHARS,
  mapAppLangToMyMemoryApi,
  isMyMemoryLimitError,
  splitTextForTranslation,
  planMyMemoryTranslation,
} from './myMemory'

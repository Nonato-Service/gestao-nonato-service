/**
 * I/O de relógio/aleatório — fromForm canónico em `app/modules/tradutor/fromForm`.
 */
import {
  createTranslatorLibraryFromForm as createTranslatorLibraryFromFormPure,
  type CreateTranslatorLibraryFromFormOpts,
  type TranslatorLibraryFormPayload,
} from '../modules/tradutor/fromForm'
import type { TranslatorLibraryEntry } from '../modules/tradutor/tipos'

/** Injeta Date.now() e Math.random() no id quando o call-site não envia. */
export function createTranslatorLibraryFromForm(
  form: TranslatorLibraryFormPayload,
  opts: Omit<CreateTranslatorLibraryFromFormOpts, 'nowMs' | 'random'> = {}
): TranslatorLibraryEntry {
  return createTranslatorLibraryFromFormPure(form, { ...opts, nowMs: Date.now(), random: Math.random })
}

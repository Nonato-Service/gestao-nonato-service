/** Validação e mapeamento puro da entrada da biblioteca do tradutor. */

import type { TranslatorLibraryEntry } from './tipos'

export type TranslatorLibraryFormPayload = {
  sourceLang: string
  sourceText: string
  targetLang: string
  targetText: string
}

export function isTranslatorLibraryFormValid(
  form: Pick<TranslatorLibraryFormPayload, 'sourceText' | 'targetText'>
): boolean {
  return Boolean(form.sourceText.trim() && form.targetText.trim())
}

export type CreateTranslatorLibraryFromFormOpts = {
  id?: string
  nowMs: number
  random: () => number
}

export function createTranslatorLibraryFromForm(
  form: TranslatorLibraryFormPayload,
  opts: CreateTranslatorLibraryFromFormOpts
): TranslatorLibraryEntry {
  return {
    id: opts.id ?? `${opts.nowMs}${opts.random().toString(36).slice(2)}`,
    sourceLang: form.sourceLang,
    sourceText: form.sourceText,
    targetLang: form.targetLang,
    targetText: form.targetText,
  }
}

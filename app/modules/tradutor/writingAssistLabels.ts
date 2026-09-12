/** Rótulos e helpers de par do assistente de escrita — sem I/O. */

import type { WritingAssistLangOption } from './writingAssist'

export const WRITING_ASSIST_NATIVE_LS_KEY = 'nonato-writing-native-lang'

export type WritingAssistLabels = {
  title: string
  subtitle: string
  yourText: string
  placeholder: string
  wroteIn: string
  alsoNeed: string
  uiHint: string
  sameLang: string
  generate: string
  translating: string
  resultBase: string
  resultTranslated: string
  rememberNative: string
  close: string
  copyToClipboard: string
  copiedToClipboard: string
  fabTitle: string
  shortcutHint: string
  applyOriginalInField: string
  applyTranslatedInField: string
  fieldModeHint: string
}

export function writingAssistIsSamePair(wroteIn: string, needIn: string): boolean {
  return wroteIn === needIn
}

export function formatWritingAssistLangOption(lang: WritingAssistLangOption): string {
  return `${lang.flag} ${lang.name}`
}

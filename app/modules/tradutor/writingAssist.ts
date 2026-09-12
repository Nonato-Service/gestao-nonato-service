/** Tipos e mappers do assistente de escrita (par de idiomas). */

export type WritingAssistLangOption = { code: string; name: string; flag: string }

export function findWritingAssistLang(
  options: WritingAssistLangOption[],
  code: string
): WritingAssistLangOption | undefined {
  return options.find((x) => x.code === code)
}

export function writingAssistHasLang(options: WritingAssistLangOption[], code: string): boolean {
  return options.some((o) => o.code === code)
}

export function resolveWritingAssistNativeLang(
  saved: string | null | undefined,
  options: WritingAssistLangOption[],
  fallback = 'pt-BR'
): string {
  if (saved && writingAssistHasLang(options, saved)) return saved
  return fallback
}

export function formatWritingAssistResultLabel(
  options: WritingAssistLangOption[],
  code: string,
  prefix: string
): string {
  const o = findWritingAssistLang(options, code)
  return `${prefix}${o ? ` (${o.flag} ${o.name})` : ''}`
}

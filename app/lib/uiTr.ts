import { translations, translationBundleKey } from '../translations'

export function uiTr(language: string, key: string): string {
  const primary = (translations[translationBundleKey(language)] || translations['pt-BR']) as Record<
    string,
    string | undefined
  >
  const en = translations.en as Record<string, string | undefined>
  const pt = translations['pt-BR'] as Record<string, string | undefined>
  return primary[key] ?? en[key] ?? pt[key] ?? key
}

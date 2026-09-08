// @ts-nocheck — loader de i18n: só o idioma activo entra no bundle inicial (pt-BR).
import ptBR from './i18n/messages/pt-BR.json'

export type TranslationBundleKey = 'pt-BR' | 'es' | 'fr' | 'it' | 'de' | 'en'
export type TranslationKey = keyof typeof ptBR

const BUNDLE_KEYS: TranslationBundleKey[] = ['pt-BR', 'es', 'fr', 'it', 'de', 'en']

const bundles: Partial<Record<TranslationBundleKey, Record<string, string>>> = {
  'pt-BR': ptBR as Record<string, string>,
}

const localeImporters: Record<
  Exclude<TranslationBundleKey, 'pt-BR'>,
  () => Promise<{ default: Record<string, string> }>
> = {
  es: () => import('./i18n/messages/es.json'),
  fr: () => import('./i18n/messages/fr.json'),
  it: () => import('./i18n/messages/it.json'),
  de: () => import('./i18n/messages/de.json'),
  en: () => import('./i18n/messages/en.json'),
}

/** Carrega o JSON do idioma (chunk à parte). pt-BR já está no bundle inicial. */
export async function ensureTranslationBundle(lang: string): Promise<void> {
  const key = translationBundleKey(lang)
  if (key === 'pt-BR' || bundles[key]) return
  const mod = await localeImporters[key]()
  bundles[key] = (mod.default || mod) as Record<string, string>
}

function bundleOrPt(key: TranslationBundleKey): Record<string, string> {
  return bundles[key] || (ptBR as Record<string, string>)
}

export const translations = new Proxy({} as Record<TranslationBundleKey, Record<string, string>>, {
  get(_t, prop: string) {
    if (BUNDLE_KEYS.includes(prop as TranslationBundleKey)) {
      return bundleOrPt(prop as TranslationBundleKey)
    }
    return undefined
  },
  has(_t, prop) {
    return BUNDLE_KEYS.includes(prop as TranslationBundleKey)
  },
  ownKeys() {
    return [...BUNDLE_KEYS]
  },
  getOwnPropertyDescriptor(_t, prop) {
    if (BUNDLE_KEYS.includes(String(prop) as TranslationBundleKey)) {
      return { enumerable: true, configurable: true, writable: false }
    }
    return undefined
  },
})

/** Código guardado (ex.: `en-US`) → chave existente em `translations` (`en` partilha o bundle UK). */
export function translationBundleKey(lang: string): TranslationBundleKey {
  if (lang === 'en-US') return 'en'
  if (BUNDLE_KEYS.includes(lang as TranslationBundleKey)) return lang as TranslationBundleKey
  return 'pt-BR'
}

export function isEnglishUi(lang: string): boolean {
  return lang === 'en' || lang === 'en-US'
}

/** `toLocaleString` em blocos longos (ex.: dados contabilidade): PT pt-PT; EN UK en-GB; EN US en-US. */
export function localeForLongDatetime(lang: string): string {
  if (lang === 'pt-BR') return 'pt-PT'
  if (lang === 'en-US') return 'en-US'
  if (lang === 'en') return 'en-GB'
  if (lang === 'es') return 'es-ES'
  if (lang === 'fr') return 'fr-FR'
  if (lang === 'it') return 'it-IT'
  if (lang === 'de') return 'de-DE'
  return 'pt-PT'
}

/** Datas curtas em listagens (comportamento anterior: inglês → en-US). */
export function localeDateShort(lang: string): string {
  if (lang === 'pt-BR') return 'pt-BR'
  if (isEnglishUi(lang)) return 'en-US'
  if (lang === 'es') return 'es-ES'
  if (lang === 'fr') return 'fr-FR'
  if (lang === 'it') return 'it-IT'
  if (lang === 'de') return 'de-DE'
  return 'pt-BR'
}

/** PDF protocolo: pt-PT; en en-GB; en-US en-US; resto = código do idioma. */
export function documentPdfDateLocale(lang: string): string {
  if (lang === 'pt-BR') return 'pt-PT'
  if (lang === 'en') return 'en-GB'
  if (lang === 'en-US') return 'en-US'
  return lang
}

/** `toLocaleString` onde o UI antigo usava pt-BR e «resto» = en-US (en UK e en US). */
export function localeDatetimeGeneral(lang: string): string {
  if (lang === 'pt-BR') return 'pt-BR'
  if (lang === 'es') return 'es-ES'
  if (lang === 'fr') return 'fr-FR'
  if (lang === 'it') return 'it-IT'
  if (lang === 'de') return 'de-DE'
  if (isEnglishUi(lang)) return 'en-US'
  return 'pt-BR'
}

export function getStoredUiString(key: string, fallback?: string): string {
  if (typeof window === 'undefined') return fallback ?? key
  try {
    const lang = localStorage.getItem('nonato-language') || 'pt-BR'
    const bundleKey = translationBundleKey(lang)
    const bundle = translations[bundleKey] as Record<string, string | undefined>
    return bundle[key] ?? fallback ?? key
  } catch {
    return fallback ?? key
  }
}

/** Códigos da interface → códigos da API MyMemory. */
export const APP_TO_MYMEMORY_API: Record<string, string> = {
  'pt-BR': 'pt',
  es: 'es',
  fr: 'fr',
  it: 'it',
  de: 'de',
  en: 'en',
  'en-US': 'en',
}

/** Limite gratuito da MyMemory por pedido (~500 caracteres). Usamos margem de segurança. */
export const MYMEMORY_MAX_QUERY_CHARS = 480

/** Limite máximo de texto nos campos com assistente de tradução (ex.: descrição do trabalho). */
export const WRITING_ASSIST_FIELD_MAX_CHARS = 5000

export type MyMemoryTranslationPlan =
  | { kind: 'empty' }
  | { kind: 'same'; text: string }
  | { kind: 'chunks'; fromCode: string; toCode: string; chunks: string[] }

export function mapAppLangToMyMemoryApi(appCode: string): string {
  return APP_TO_MYMEMORY_API[appCode] || appCode
}

export function isMyMemoryLimitError(text: string): boolean {
  const t = String(text ?? '').toUpperCase()
  return t.includes('QUERY LENGTH LIMIT') || t.includes('MAX ALLOWED QUERY')
}

export function splitTextForTranslation(text: string, maxLen = MYMEMORY_MAX_QUERY_CHARS): string[] {
  if (text.length <= maxLen) return [text]

  const chunks: string[] = []
  let remaining = text

  while (remaining.length > maxLen) {
    const slice = remaining.slice(0, maxLen)
    let splitAt = slice.lastIndexOf('\n\n')

    if (splitAt < maxLen * 0.25) {
      splitAt = Math.max(
        slice.lastIndexOf('. '),
        slice.lastIndexOf('! '),
        slice.lastIndexOf('? '),
        slice.lastIndexOf('.\n'),
        slice.lastIndexOf('!\n'),
        slice.lastIndexOf('?\n'),
        slice.lastIndexOf('\n')
      )
    }

    if (splitAt < maxLen * 0.25) {
      splitAt = slice.lastIndexOf(' ')
    }

    if (splitAt <= 0) {
      splitAt = maxLen
    } else {
      // Incluir o separador no bloco anterior (espaço/quebra) para manter fluidez
      if (remaining[splitAt] === ' ') splitAt += 1
      else if (remaining.slice(splitAt, splitAt + 2) === '\n\n') splitAt += 2
      else if (['. ', '! ', '? '].some((s) => remaining.slice(splitAt, splitAt + s.length) === s)) {
        splitAt += 2
      } else if (remaining[splitAt] === '\n') splitAt += 1
    }

    chunks.push(remaining.slice(0, splitAt))
    remaining = remaining.slice(splitAt)
  }

  if (remaining) chunks.push(remaining)
  return chunks.filter((c) => c.length > 0)
}

export function planMyMemoryTranslation(
  text: string,
  fromAppCode: string,
  toAppCode: string
): MyMemoryTranslationPlan {
  const q = text.trim().slice(0, WRITING_ASSIST_FIELD_MAX_CHARS)
  if (!q) return { kind: 'empty' }
  if (fromAppCode === toAppCode) return { kind: 'same', text: q }
  return {
    kind: 'chunks',
    fromCode: mapAppLangToMyMemoryApi(fromAppCode),
    toCode: mapAppLangToMyMemoryApi(toAppCode),
    chunks: splitTextForTranslation(q),
  }
}

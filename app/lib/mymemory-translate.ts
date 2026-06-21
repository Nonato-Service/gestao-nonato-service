/** Códigos da interface → códigos da API MyMemory (mesmo mapa que em `page.tsx`). */
const APP_TO_API: Record<string, string> = {
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

function isMyMemoryLimitError(text: string): boolean {
  const t = String(text ?? '').toUpperCase()
  return t.includes('QUERY LENGTH LIMIT') || t.includes('MAX ALLOWED QUERY')
}

function splitTextForTranslation(text: string, maxLen = MYMEMORY_MAX_QUERY_CHARS): string[] {
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

async function translateSingleChunk(
  text: string,
  fromCode: string,
  toCode: string
): Promise<{ ok: true; text: string } | { ok: false }> {
  const response = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromCode}|${toCode}`,
    { method: 'GET', headers: { Accept: 'application/json' } }
  )

  if (!response.ok) return { ok: false }

  const data = await response.json()
  const translated = String(data.responseData?.translatedText ?? '').trim()
  if (!translated || isMyMemoryLimitError(translated)) return { ok: false }
  return { ok: true, text: translated }
}

export async function translateWithMyMemory(
  text: string,
  fromAppCode: string,
  toAppCode: string,
  errorMessage: string
): Promise<string> {
  const q = text.trim().slice(0, WRITING_ASSIST_FIELD_MAX_CHARS)
  if (!q) return ''
  if (fromAppCode === toAppCode) return q

  const fromCode = APP_TO_API[fromAppCode] || fromAppCode
  const toCode = APP_TO_API[toAppCode] || toAppCode

  const chunks = splitTextForTranslation(q)
  const parts: string[] = []

  for (const chunk of chunks) {
    const result = await translateSingleChunk(chunk, fromCode, toCode)
    if (!result.ok) {
      return errorMessage
    }
    parts.push(result.text)
  }

  return parts.join('')
}

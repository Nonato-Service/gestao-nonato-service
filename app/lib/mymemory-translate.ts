import {
  isMyMemoryLimitError,
  planMyMemoryTranslation,
} from '../modules/tradutor/myMemory'

/** Re-export fino — fonte canónica em `app/modules/tradutor/myMemory`. */
export {
  APP_TO_MYMEMORY_API,
  MYMEMORY_MAX_QUERY_CHARS,
  WRITING_ASSIST_FIELD_MAX_CHARS,
  mapAppLangToMyMemoryApi,
  isMyMemoryLimitError,
  splitTextForTranslation,
  planMyMemoryTranslation,
} from '../modules/tradutor/myMemory'
export type { MyMemoryTranslationPlan } from '../modules/tradutor/myMemory'

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

/** Rede MyMemory — o plano de cortes/idioma vive no módulo tradutor. */
export async function translateWithMyMemory(
  text: string,
  fromAppCode: string,
  toAppCode: string,
  errorMessage: string
): Promise<string> {
  const plan = planMyMemoryTranslation(text, fromAppCode, toAppCode)
  if (plan.kind === 'empty') return ''
  if (plan.kind === 'same') return plan.text

  const parts: string[] = []
  for (const chunk of plan.chunks) {
    const result = await translateSingleChunk(chunk, plan.fromCode, plan.toCode)
    if (!result.ok) {
      return errorMessage
    }
    parts.push(result.text)
  }

  return parts.join('')
}

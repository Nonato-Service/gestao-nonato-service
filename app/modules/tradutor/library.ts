/** Helpers puros da biblioteca do tradutor (normalize / filtro / match / create). */

import type { TranslatorLibraryEntry } from './tipos'

function strOrEmpty(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

function normSourceKey(text: string): string {
  return text.trim().toLowerCase()
}

/** Normaliza payload persistido (localStorage / servidor) para lista de entradas. */
export function normalizeTranslatorLibrary(raw: unknown): TranslatorLibraryEntry[] {
  if (!Array.isArray(raw)) return []
  const out: TranslatorLibraryEntry[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const o = item as Record<string, unknown>
    const id = strOrEmpty(o.id)
    const sourceLang = strOrEmpty(o.sourceLang)
    const sourceText = strOrEmpty(o.sourceText)
    const targetLang = strOrEmpty(o.targetLang)
    const targetText = strOrEmpty(o.targetText)
    if (!id && !sourceText && !targetText) continue
    out.push({
      id: id || `${Date.now()}-${out.length}`,
      sourceLang,
      sourceText,
      targetLang,
      targetText,
    })
  }
  return out
}

/** Filtra entradas pelo par de idiomas (origem → destino). */
export function filterLibraryByLangPair(
  entries: TranslatorLibraryEntry[],
  sourceLang: string,
  targetLang: string
): TranslatorLibraryEntry[] {
  return entries.filter((e) => e.sourceLang === sourceLang && e.targetLang === targetLang)
}

/** Procura tradução exacta (texto origem normalizado) para o par de idiomas. */
export function findLibraryMatch(
  entries: TranslatorLibraryEntry[],
  sourceLang: string,
  targetLang: string,
  sourceText: string
): TranslatorLibraryEntry | undefined {
  const key = normSourceKey(sourceText)
  if (!key) return undefined
  return entries.find(
    (e) =>
      e.sourceLang === sourceLang &&
      e.targetLang === targetLang &&
      normSourceKey(e.sourceText) === key
  )
}

/** Indica se já existe entrada com o mesmo texto origem no par de idiomas. */
export function libraryEntryExists(
  entries: TranslatorLibraryEntry[],
  sourceLang: string,
  targetLang: string,
  sourceText: string
): boolean {
  return Boolean(findLibraryMatch(entries, sourceLang, targetLang, sourceText))
}

/** Cria nova entrada (id gerado se omitido). */
export function createTranslatorLibraryEntry(input: {
  sourceLang: string
  sourceText: string
  targetLang: string
  targetText: string
  id?: string
}): TranslatorLibraryEntry {
  return {
    id: input.id ?? `${Date.now()}${Math.random().toString(36).slice(2)}`,
    sourceLang: input.sourceLang,
    sourceText: input.sourceText,
    targetLang: input.targetLang,
    targetText: input.targetText,
  }
}

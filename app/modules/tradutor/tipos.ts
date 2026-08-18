/** Tipos da biblioteca do tradutor (entradas por par de idiomas). */

/** Entrada da biblioteca: texto origem → destino, filtrada por par de idiomas. */
export type TranslatorLibraryEntry = {
  id: string
  sourceLang: string
  sourceText: string
  targetLang: string
  targetText: string
}

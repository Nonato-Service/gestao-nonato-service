import { normalizePdfModelo, PDF_MODELO_PADRAO } from './pdfModelTypes'
import { PDF_STORAGE_KEYS } from '../modules/pdf/storageKeys'
import type { PdfStorageDomain } from '../modules/pdf/storageKeys'

/** Re-export fino — fonte canónica em `app/modules/pdf/storageKeys`. */
export { PDF_STORAGE_KEYS }
export type { PdfStorageDomain }

export function loadPdfModeloPadrao(
  domain: Exclude<PdfStorageDomain, 'relatoriosPorId'>,
  saveData?: (key: string, value: unknown) => Promise<unknown>
): string {
  if (typeof window === 'undefined') return PDF_MODELO_PADRAO
  try {
    const raw = localStorage.getItem(PDF_STORAGE_KEYS[domain])
    if (raw) return normalizePdfModelo(raw)
  } catch {
    /* ignorar */
  }
  return PDF_MODELO_PADRAO
}

export function persistPdfModeloPadrao(
  domain: Exclude<PdfStorageDomain, 'relatoriosPorId'>,
  model: string,
  saveData?: (key: string, value: unknown) => Promise<unknown>
): string {
  const normalized = normalizePdfModelo(model)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PDF_STORAGE_KEYS[domain], normalized)
    } catch {
      /* ignorar */
    }
  }
  if (saveData) void saveData(PDF_STORAGE_KEYS[domain], normalized)
  return normalized
}

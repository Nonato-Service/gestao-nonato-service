import { normalizePdfModelo, PDF_MODELO_PADRAO } from './pdfModelTypes'

export const PDF_STORAGE_KEYS = {
  relatorios: 'nonato-relatorios-pdf-modelo',
  relatoriosPorId: 'nonato-relatorios-pdf-modelo-por-id',
  orcamentos: 'nonato-orcamentos-pdf-modelo',
  pedidoAvulso: 'nonato-pedido-avulso-pdf-modelo',
  pecasEspeciais: 'nonato-pecas-especiais-pdf-modelo',
  fechamentoDespesas: 'nonato-fechamento-despesas-pdf-modelo',
  cadastroNonato: 'nonato-cadastro-nonato-pdf-modelo',
  pagamentosContador: 'nonato-pagamentos-contador-pdf-modelo',
} as const

export type PdfStorageDomain = keyof typeof PDF_STORAGE_KEYS

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

import { PDF_MODELO_ALL, PDF_MODELO_PADRAO } from '../../lib/pdfModelTypes'
import { PDF_STORAGE_KEYS } from '../../lib/pdfModelStorage'

/** Alias estável: mesmos ids que `PDF_MODELO_ALL` (SoT em pdfModelTypes). */
export const RELATORIO_SERVICO_PDF_MODELOS: ReadonlySet<string> = PDF_MODELO_ALL

export const PDF_MODEL_PADRAO_STORAGE_KEY = PDF_STORAGE_KEYS.relatorios
export const PDF_MODEL_POR_RELATORIO_STORAGE_KEY = PDF_STORAGE_KEYS.relatoriosPorId

export function isRelatorioServicoPdfModelo(model: string | undefined | null): boolean {
  return typeof model === 'string' && model.length > 0 && RELATORIO_SERVICO_PDF_MODELOS.has(model)
}

export function normalizePdfModeloPorRelatorioMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [id, model] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof id === 'string' && id && typeof model === 'string' && RELATORIO_SERVICO_PDF_MODELOS.has(model)) {
      out[id] = model
    }
  }
  return out
}

/**
 * Resolve o modelo PDF de um relatório: mapa (ref) → mapa (state) → padrão global → profissional.
 * Sem refs/React — o NMA passa os valores actuais.
 */
export function resolvePdfModeloForRelatorio(
  relatorioId: string,
  mapPorIdPrimary: Record<string, string> | undefined | null,
  mapPorIdSecondary: Record<string, string> | undefined | null,
  padrao: string | undefined | null
): string {
  const id = String(relatorioId || '').trim()
  if (id) {
    const a = mapPorIdPrimary?.[id]
    if (isRelatorioServicoPdfModelo(a)) return a as string
    const b = mapPorIdSecondary?.[id]
    if (isRelatorioServicoPdfModelo(b)) return b as string
  }
  if (isRelatorioServicoPdfModelo(padrao)) return padrao as string
  return PDF_MODELO_PADRAO
}

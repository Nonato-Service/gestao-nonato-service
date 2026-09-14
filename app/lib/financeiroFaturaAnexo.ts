/**
 * I/O de janela — anexo de fatura canónico em `app/modules/financeiro/faturaAnexo`.
 */
export { MAX_FATURA_ANEXO_BYTES, readFaturaAnexoFromFile } from '../modules/financeiro/faturaAnexo'
export type { FaturaAnexoPayload } from '../modules/financeiro/faturaAnexo'

export function abrirFaturaAnexoDataUrl(dataUrl: string): void {
  if (!dataUrl || typeof window === 'undefined') return
  try {
    window.open(dataUrl, '_blank', 'noopener,noreferrer')
  } catch {
    /* ignore */
  }
}

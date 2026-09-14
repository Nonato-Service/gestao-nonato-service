/**
 * @deprecated Preferir `app/modules/relatorios-especiais` — reexport de compatibilidade.
 */
import {
  imprimirRelatorioEspecialPdf as imprimirRelatorioEspecialPdfPure,
  type RelatorioEspecialPdfLabels,
  type RelatorioEspecialPdfOptions,
} from '../modules/relatorios-especiais/pdf'
import type { RelatorioEspecial } from '../modules/relatorios-especiais/tipos'

export type {
  RelatorioEspecialPdfLabels,
  RelatorioEspecialPdfOptions,
  RelatorioEspecialPdfSecaoId,
  RelatorioEspecialPdfSecoes,
} from '../modules/relatorios-especiais/pdf'
export {
  RELATORIO_ESPECIAL_PDF_SECAO_IDS,
  defaultRelatorioEspecialPdfSecoes,
  normalizeRelatorioEspecialPdfSecoes,
  temAlgumaSecaoPdfEspecial,
} from '../modules/relatorios-especiais/pdf'

/** Injeta Date.now() na data de geração do rodapé. */
export function imprimirRelatorioEspecialPdf(
  relatorio: RelatorioEspecial,
  labelsOrOptions?: RelatorioEspecialPdfLabels | RelatorioEspecialPdfOptions
): void {
  return imprimirRelatorioEspecialPdfPure(relatorio, labelsOrOptions, Date.now())
}

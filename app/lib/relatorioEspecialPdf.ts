/**
 * @deprecated Preferir `app/modules/relatorios-especiais` — reexport de compatibilidade.
 */
import {
  buildRelatorioEspecialPdfHtml,
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

/** Injeta Date.now() e abre a janela de impressão. */
export function imprimirRelatorioEspecialPdf(
  relatorio: RelatorioEspecial,
  labelsOrOptions?: RelatorioEspecialPdfLabels | RelatorioEspecialPdfOptions
): void {
  const html = buildRelatorioEspecialPdfHtml(relatorio, labelsOrOptions, Date.now())
  const options: RelatorioEspecialPdfOptions =
    labelsOrOptions &&
    ('logoHtml' in labelsOrOptions ||
      'empresaNome' in labelsOrOptions ||
      'lang' in labelsOrOptions ||
      'secoes' in labelsOrOptions)
      ? labelsOrOptions
      : { labels: labelsOrOptions as RelatorioEspecialPdfLabels | undefined }
  const msg =
    (options.labels && options.labels.relatorioEspecialPdfPopupBlocked) ||
    'Permita pop-ups para imprimir o PDF.'
  const w = window.open('', '_blank')
  if (!w) {
    alert(msg)
    return
  }
  w.document.write(html)
  w.document.close()
}

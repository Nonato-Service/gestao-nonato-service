/**
 * I/O de janela — etiquetas de armazém canónicas em `app/modules/equipamentos/etiquetas`.
 */
import {
  buildEtiquetasArmazemPrintHtml,
  type EquipamentoEtiquetaLike,
  type EtiquetasArmazemLabels,
} from '../modules/equipamentos/etiquetas'

export type { EquipamentoEtiquetaLike, EtiquetasArmazemLabels, ItemInclusoEtiqueta } from '../modules/equipamentos/etiquetas'
export { getSequenciaEtiquetasArmazem, buildEtiquetasArmazemPrintHtml } from '../modules/equipamentos/etiquetas'

/** Abre janela de impressão das etiquetas de volumes do armazém. */
export function openPrintEtiquetasArmazem(eq: EquipamentoEtiquetaLike, t: EtiquetasArmazemLabels): void {
  const html = buildEtiquetasArmazemPrintHtml(eq, t)
  if (typeof window === 'undefined') return
  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups para imprimir as etiquetas.')
    return
  }
  w.document.write(html)
  w.document.close()
}

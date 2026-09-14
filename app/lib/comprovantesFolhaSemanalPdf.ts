/**
 * @deprecated Preferir `app/modules/comprovantes` — reexport de compatibilidade.
 */
import {
  buildFolhaSemanalContadorHtml as buildFolhaSemanalContadorHtmlPure,
  type FolhaSemanalContadorParams,
} from '../modules/comprovantes/folhaSemanalPdf'

export type {
  ComprovanteFolhaItem,
  FolhaSemanalContadorLabels,
  FolhaSemanalContadorParams,
} from '../modules/comprovantes/folhaSemanalPdf'

/** Injeta Date.now() na data de geração e na referência do documento. */
export function buildFolhaSemanalContadorHtml(
  params: Omit<FolhaSemanalContadorParams, 'nowMs'> & { nowMs?: number }
): string {
  return buildFolhaSemanalContadorHtmlPure({ ...params, nowMs: params.nowMs ?? Date.now() })
}

/** Abre janela de impressão com a folha semanal (Ctrl+P → Guardar como PDF). */
export function abrirFolhaSemanalContadorPdf(html: string): boolean {
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(html)
  w.document.close()
  return true
}

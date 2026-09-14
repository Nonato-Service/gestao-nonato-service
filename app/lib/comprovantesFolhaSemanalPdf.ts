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
export { abrirFolhaSemanalContadorPdf } from '../modules/comprovantes/folhaSemanalPdf'

/** Injeta Date.now() na data de geração e na referência do documento. */
export function buildFolhaSemanalContadorHtml(
  params: Omit<FolhaSemanalContadorParams, 'nowMs'> & { nowMs?: number }
): string {
  return buildFolhaSemanalContadorHtmlPure({ ...params, nowMs: params.nowMs ?? Date.now() })
}

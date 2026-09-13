/** I/O do PDF de confirmação de orçamento — injeta Date.now(). */

import {
  buildOrcamentoConfirmacaoPdfHtml as buildOrcamentoConfirmacaoPdfHtmlPure,
  type BuildOrcamentoConfirmacaoPdfHtmlOpts,
} from '../modules/orcamentos/confirmacaoPdf'

export type {
  OrcamentoConfirmacaoKind,
  OrcamentoConfirmacaoLabels,
  OrcamentoConfirmacaoData,
  BuildOrcamentoConfirmacaoPdfHtmlOpts,
} from '../modules/orcamentos/confirmacaoPdf'

export function buildOrcamentoConfirmacaoPdfHtml(options: BuildOrcamentoConfirmacaoPdfHtmlOpts): string {
  return buildOrcamentoConfirmacaoPdfHtmlPure(options, Date.now())
}

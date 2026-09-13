/** Re-exports + relógio — fonte canónica em `app/modules/orcamentos` / `equipamentos`. */

import { fmtDataPdf as fmtDataPdfPure } from '../modules/orcamentos/fmtDataPdf'

export { escapePdfHtml, buildPdfDocumentFooterHtml } from './pdfDocumentLayout'
export type { EquipamentoPdfNumeroLike } from '../modules/equipamentos/pdfNumero'
export { resolverNumeroEquipamentoPdf, resolverSerieEquipamentoPdf } from '../modules/equipamentos/pdfNumero'
export type {
  OrcamentoPdfEmpresa,
  ClienteEmpresaPdfOrigem,
  FichaCadastralEmpresaPdfOrigem,
} from '../modules/orcamentos/empresaPdf'
export {
  EMPRESA_NONATO_DEFAULT,
  buildEmpresaBlockHtml,
  clienteParaEmpresaPdf,
  fichaCadastralParaEmpresaPdf,
  resolverEmpresaPedidoOrcamentoPdf,
} from '../modules/orcamentos/empresaPdf'
export { ORCAMENTO_PDF_PRO_CSS, buildOrcamentoPdfShell } from '../modules/orcamentos/pdfProShell'

/** Data de documento no PDF — injeta Date.now() se a data vier vazia. */
export function fmtDataPdf(iso?: string): string {
  return fmtDataPdfPure(iso, Date.now())
}

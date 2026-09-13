/** Re-exports + relógio — fonte canónica em `app/modules/orcamentos` / `equipamentos`. */

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

/** Data de documento no PDF — usa relógio só se a data vier vazia. */
export function fmtDataPdf(iso?: string): string {
  if (!iso) return new Date().toLocaleDateString('pt-PT')
  try {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
    return d.toLocaleDateString('pt-PT')
  } catch {
    return iso
  }
}

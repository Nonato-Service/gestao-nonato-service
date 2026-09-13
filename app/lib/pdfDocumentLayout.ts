/** Re-export fino — fonte canónica em `app/modules/pdf/documentLayout`. */

export type { PdfDocumentHeaderVariant, PdfMetaField } from '../modules/pdf/documentLayout'
export {
  escapePdfHtml,
  PDF_TABLE_CELL_BORDER,
  PDF_TABLE_GRID_BORDER,
  buildPdfDocumentHeaderHtml,
  buildPdfMetaSectionHtml,
  buildPdfDocumentFooterHtml,
  PDF_DOCUMENT_LAYOUT_CSS,
} from '../modules/pdf/documentLayout'

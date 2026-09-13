/** Re-export fino — fonte canónica em `app/modules/pdf/documentShell`. */

export type { PdfDocTheme, PdfDataCardRow } from '../modules/pdf/documentShell'
export {
  escapePdfHtml,
  buildPdfDocumentFooterHtml,
  buildPdfMetaSectionHtml,
  resolvePdfHeaderVariant,
  buildPdfLogoContent,
  buildPdfPrintToolbarHtml,
  buildPdfDataCardSectionHtml,
  buildPdfNoticeHtml,
  buildPdfSummaryCardsHtml,
  buildPdfSectionTitleHtml,
  buildPdfInstructionsBoxHtml,
  wrapPdfTableHtml,
  PDF_SHELL_EXTRA_CSS,
  buildPdfHtmlDocument,
  buildPdfHeaderForDoc,
  buildPdfMetaFieldsHtml,
} from '../modules/pdf/documentShell'

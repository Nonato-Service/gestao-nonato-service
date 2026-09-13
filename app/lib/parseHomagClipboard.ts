/** Re-export fino — fonte canónica em `app/modules/biblioteca/homagClipboard`. */

export type { HomagClipboardItem } from '../modules/biblioteca/homagClipboard'
export {
  HOMAG_CODE_STRICT_RE,
  HOMAG_CODE_LOOSE_RE,
  HOMAG_CODE_R_VARIANT_RE,
  isHomagUiNoiseLine,
  countHomagCodesInText,
  looksLikeHomagClipboard,
  extractHomagCatalogSection,
  matchHomagCodeLine,
  parseHomagPlainTextCatalog,
  mergeHomagClipboardItems,
} from '../modules/biblioteca/homagClipboard'

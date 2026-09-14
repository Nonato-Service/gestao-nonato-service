/** Re-export fino — fonte canónica em `app/modules/manuais`. */
export type {
  BibliaSecao,
  BibliaAnexo,
  BibliaModelo,
  BibliaLinha,
  BibliaFamilia,
  BibliaStore,
} from '../modules/manuais'

export {
  BIBLIA_NONATO_STORAGE_KEY,
  BIBLIA_LEGACY_CATEGORIES_KEY,
  BIBLIA_ANEXO_MAX_BYTES,
  BIBLIA_ANEXO_MAX_PER_MODEL,
  inferBibliaSecaoFromName,
  normalizeBibliaSecao,
  resolveBibliaSecao,
  buildInformacoesText,
  countBibliaStats,
  moveItem,
  normalizeSearch,
  bibliaMatchesSearch,
} from '../modules/manuais'

export {
  bibliaUid,
  normalizeBibliaImport,
  serializeBibliaForServer,
  seedBibliaExample,
} from '../lib/manuaisBiblia'

/** Módulo Manuais — tipos (famílias/grupos/modelos/documentos + Bíblia). */

export type {
  ManuaisGrupo,
  ManuaisDocumento,
  ManuaisImagem,
  ManuaisModelo,
  EquipamentoManuaisRef,
} from './tipos'

export type {
  BibliaSecao,
  BibliaAnexo,
  BibliaModelo,
  BibliaLinha,
  BibliaFamilia,
  BibliaStore,
} from './bibliaTipos'
export {
  BIBLIA_NONATO_STORAGE_KEY,
  BIBLIA_LEGACY_CATEGORIES_KEY,
  BIBLIA_ANEXO_MAX_BYTES,
  BIBLIA_ANEXO_MAX_PER_MODEL,
  inferBibliaSecaoFromName,
  normalizeBibliaSecao,
  resolveBibliaSecao,
  bibliaUid,
  normalizeBibliaImport,
  buildInformacoesText,
  serializeBibliaForServer,
  countBibliaStats,
  seedBibliaExample,
  moveItem,
  normalizeSearch,
  bibliaMatchesSearch,
} from './bibliaTipos'

export type {
  CreateManuaisGrupoFromFormOpts,
  CreateManuaisModeloFromFormOpts,
  CreateManuaisDocumentoFromFormOpts,
  CreateManuaisImagemFromFormOpts,
  CreateBibliaAnexoFromFormOpts,
} from './fromForm'
export {
  newManuaisEntityId,
  isManuaisFamiliaNomeValid,
  normalizeManuaisFamiliaNome,
  sortManuaisFamiliaNomes,
  canAddManuaisFamilia,
  addManuaisFamiliaFromForm,
  canRenameManuaisFamilia,
  renameManuaisFamiliaFromForm,
  isManuaisGrupoNomeValid,
  createManuaisGrupoFromForm,
  updateManuaisGrupoNomeFromForm,
  isManuaisModeloNomeValid,
  createManuaisModeloFromForm,
  updateManuaisModeloNomeFromForm,
  resolveManuaisDocumentoTipo,
  isManuaisDocumentoFormValid,
  createManuaisDocumentoFromForm,
  isManuaisImagemFormValid,
  createManuaisImagemFromForm,
  isBibliaAnexoFormValid,
  createBibliaAnexoFromForm,
} from './fromForm'

export type { ManualSection } from './zipSection'
export { findManualSectionPdf } from './zipSection'
export {
  normalizeZipRelativePath,
  cleanLinkTarget,
  matchEntryByPathSuffix,
  resolveZipEntryPath,
} from './zipPath'
export { extractAnnotationTargets, targetLooksLikeSection } from './zipAnnotation'
export type { ZipPdfLinkHint } from './zipViewer'
export {
  MAX_PDFJS_PAGES,
  MAX_PDFJS_BYTES,
  inferIndexSectionHints,
  preferNativePdfViewer,
} from './zipViewer'

export type { ManuaisFamiliasGruposPayload, ConhecimentoMergeIdFactory } from './conhecimentoMerge'
export {
  CONHECIMENTO_TECNICO_STORAGE_KEY,
  MANUAIS_STORAGE_KEY,
  DEFAULT_MARCA_NAME,
  mergeManuaisPayloads,
  mergeBibliaIntoManuais,
  manuaisToBibliaStore,
  buildManuaisFromSources,
  buildBibliaConhecimentoFromSources,
  buildConhecimentoTecnicoFromSources,
} from './conhecimentoMerge'

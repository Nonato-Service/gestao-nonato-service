/** Módulo Biblioteca — peças (sync, merge, sequência) e recuperação de relatórios. */

export type { PecaBibliotecaLike, CategoriaPecaLike, SubcategoriaPecaLike } from './tipos'

export type { MapItemToPecaBibliotecaOpts } from './importMappers'

export type { CategoriaPeca, SubcategoriaPeca, PecaBiblioteca } from './pecaTipos'
export type { EmptyPecaBibliotecaFormOpts } from './pecaForm'
export { createEmptyPecaBibliotecaForm } from './pecaForm'
export type { CreatePecaBibliotecaFromFormOpts } from './pecaFromForm'
export {
  isPecaBibliotecaFormValid,
  createPecaBibliotecaFromForm,
  updatePecaBibliotecaFromForm,
} from './pecaFromForm'
export type {
  CreateCategoriaPecaFromFormOpts,
  CreateSubcategoriaPecaFromFormOpts,
} from './categoriaFromForm'
export {
  isCategoriaPecaFormValid,
  createCategoriaPecaFromForm,
  inserirCategoriaPecaAposRef,
  isSubcategoriaPecaFormValid,
  createSubcategoriaPecaFromForm,
  inserirSubcategoriaPecaAposRef,
} from './categoriaFromForm'

export type { BibliotecaNovidadesMsgTemplates } from './aviso'
export {
  BIBLIOTECA_AVISO_POLL_MS,
  formatBibliotecaNovidadesMsg,
} from './aviso'

export {
  getCachedPecasBibliotecaServerTotal,
  setCachedPecasBibliotecaServerTotal,
  pecasBibliotecaMinExpected,
  isPecasBibliotecaCatalogIncomplete,
  pecasBibliotecaMeetsServerTotal,
} from './completeness'

export {
  isPecasBibliotecaSyncInFlight,
  getPecasBibliotecaSyncOwner,
  runPecasBibliotecaSyncExclusive,
  shouldDeferPecasBibliotecaImageHydration,
  isBibliotecaMobileDevice,
  shouldRejectPartialPecasSave,
} from './syncCoordinator'

export type { PecaBibliotecaMerge, MergePecaBibliotecaOptions } from './merge'
export {
  normalizeImportKey,
  variantesCodigoPecaBiblioteca,
  pecaRevisionScore,
  mergePecaBibliotecaFields,
  deduplicarPecasBibliotecaPorCodigo,
  mergePecasBibliotecaArrays,
  pecasBibliotecaArraysDiffer,
} from './merge'

export { toLitePeca, buildPecasBibliotecaLite } from './lite'

export type { PecaBibliotecaImagemKind, PecaBibliotecaImagemStats, PecaBibliotecaImagemInput } from './imagemStats'
export {
  PECA_BIBLIOTECA_PLACEHOLDER_PATTERNS,
  PECA_BIBLIOTECA_LOGO_PADRAO_SRC,
  pecaBibliotecaSrcEhLogoPadrao,
  pecaBibliotecaTemImagemNoServidor,
  pecaBibliotecaTemFotoVisivel,
  isPecaBibliotecaImagemPlaceholder,
  pecaBibliotecaTemImagemPropria,
  classificarImagemPecaBiblioteca,
  calcularPecasBibliotecaImagemStats,
  pecaBibliotecaTemFotoReal,
  resolvePecaBibliotecaImagemSrcForDisplay,
  resolvePecaBibliotecaCapaSrcForDisplay,
  pecaBibliotecaTemCapaOuFotoVisivel,
  pecaBibliotecaUsarEstiloLogoPadrao,
} from './imagemStats'

export type { RelatorioServicoMin, ClienteMin, RecuperacaoRelatoriosResultado } from './relatoriosRecovery'
export {
  normalizarNomeClienteParaMatch,
  nomesClienteCorrespondem,
  resolverClienteIdRelatorioFlexivel,
  recuperarRelatoriosServicoPerdidos,
  mergeRelatoriosServicoDeferServerLocal,
  relatoriosServicoOrfaosNaBiblioteca,
  agruparRelatoriosOrfaosPorNome,
} from './relatoriosRecovery'

export type {
  RelatorioServicoBibliotecaLike,
  EquipamentoClienteBibliotecaLike,
  ClienteBibliotecaLike,
  RelatorioFechadoBibliotecaRow,
  RelatorioFechadoBibliotecaGrupo,
  BibliotecaRelatoriosClienteRow,
} from './relatoriosLista'
export {
  cmpClienteRelatorioFinanceiro,
  repararIdsGuardadosBiblioteca,
  relatoriosComFechamentoNaBibliotecaOrdenados,
  buildRelatoriosFechadosBibliotecaLista,
  groupRelatoriosFechadosPorCliente,
  bibliotecaRelatoriosRowMatchesBusca,
  cmpBibliotecaLocale,
  ordenarRelatoriosBiblioteca,
  bibliotecaRowTemConteudo,
  buildBibliotecaRelatoriosPorCliente,
  equipamentosClienteDoRelatorioDespesas,
} from './relatoriosLista'

export {
  ehImportacaoPendenteStrict,
  sanitizarPecaBibliotecaImportacaoFlag,
  normalizarUltimaSelecaoBiblioteca,
  preencherPecaBibliotecaComUltimaCategoriaSeVazio,
  resolverIdEdicaoPecaBiblioteca,
} from './cadastroForm'

export {
  clipboardLooksLikeCatalogImport,
  pickBestCatalogRawFromClipboard,
} from './catalogClipboard'

export type { SepararPecasImportacaoResultado } from './importDedup'
export {
  indiceVariantesPecaBiblioteca,
  pecaBibliotecaEstaNoCatalogo,
  construirIndiceCodigosBiblioteca,
  codigoExisteNaBibliotecaPecas,
  chavePecaBibliotecaParaImport,
  codigoNormalizadoImport,
  separarPecasImportacao,
} from './importDedup'

export { buildImportedPecaDescricao, mapItemToPecaBiblioteca } from './importMappers'

export { parseRawCatalogItensPlain, csvSplit, pushIfValidCatalogItem } from './importParsePlain'
export { parseRawCatalogItensHtml } from './importParseHtml'
export { parseRawToPecas, looksLikeCatalogImportHtml } from './importParse'

export type { HomagClipboardItem } from './homagClipboard'
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
} from './homagClipboard'

export type {
  HomagExportIdentity,
  MergeHomagExportOptions,
  MergeHomagExportResult,
  PecaHomagMerge,
} from './homagExport'
export {
  normCodigoHomag,
  formatHomagPreco,
  extrairPrecoHomagItem,
  extrairImagemHomagItem,
  homagItemToPecaMerge,
  parseHomagExportJson,
  mergeHomagExportIntoBiblioteca,
} from './homagExport'

export type { RegraClassificacaoPeca, DestinoClassificacaoResolvido } from './classificacao'
export {
  parsePalavrasClassificacao,
  resolverDestinoClassificacaoLote,
  aplicarClassificacaoCamposNaPeca,
  aplicarRegrasClassificacaoEmLista,
  aplicarClassificacaoManualEmLista,
  aplicarClassificacaoPorPalavrasEmLista,
  criarRegraClassificacaoPeca,
  renomearRegraClassificacaoCategoria,
  renomearRegraClassificacaoSubcategoria,
} from './classificacao'

export {
  BIBLIOTECA_PECAS_ULTIMA_SELECAO_KEY,
  NONATO_PECA_LOOKUP_URL_TEMPLATE_KEY,
  HOMAG_SHOP_PECA_LOOKUP_ROOT,
  buildPecaCatalogoUrlFromTemplate,
} from './catalogUrl'

export type { CategoriaRefSequencia } from './sequencia'
export {
  BIBLIOTECA_SEM_GRUPO_SEQUENCIA_KEY,
  pecaEntraNaNumeracaoSequenciaBiblioteca,
  resolverChaveSequenciaNumeroPecaBiblioteca,
  chaveSequenciaNumeroPecaBiblioteca,
  formatNumeroSequenciaPecaBiblioteca,
  parseNumeroSequenciaPecaBiblioteca,
  proximoNumeroSequenciaPecaBiblioteca,
  garantirNumerosSequenciaPecaBiblioteca,
  chavePecaBibliotecaSequenciaPreview,
  indiceOrdemCategoriaPecaBiblioteca,
  compararPecasBibliotecaPorNumeroSequencia,
  ordenarPecasBibliotecaParaExibicao,
  atribuirNumerosSequenciaNovasPecas,
  resolverNumeroSequenciaAoSalvarPecaBiblioteca,
  rotuloNumeroSequenciaPecaBiblioteca,
} from './sequencia'

export {
  BIBLIOTECA_FILTRO_SEM_CATEGORIA,
  BIBLIOTECA_ITENS_POR_LOTE,
  PECA_BIBLIOTECA_IMAGEM_PADRAO_SRC,
  pecaBibliotecaSrcImagemDisplay,
  pecaBibliotecaSrcCapaDisplay,
  pecaPassaBuscaBibliotecaTexto,
} from './display'

export type { PecasBackupPayload, ParsedPecasBackup, ApplyPecasBackupMode } from './pecasBackup'
export {
  PECAS_BIBLIOTECA_STORAGE_KEY,
  CATEGORIAS_PECAS_STORAGE_KEY,
  SUBCATEGORIAS_PECAS_STORAGE_KEY,
  PECAS_BACKUP_TYPE,
  PECAS_BACKUP_VERSION,
  countPecasComImagemBase64,
  enrichPecasParaBackup,
  buildPecasBackupPayload,
  pecasBackupFileName,
  parsePecasBackupJson,
  mergeCategoriasPecas,
  mergeSubcategoriasPecas,
  applyPecasBackupImport,
} from './pecasBackup'

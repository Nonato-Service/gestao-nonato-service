/** Módulo Biblioteca — peças (sync, merge, sequência) e recuperação de relatórios. */

export type { PecaBibliotecaLike, CategoriaPecaLike, SubcategoriaPecaLike } from './tipos'

export type { BibliotecaNovidadesMsgTemplates } from './aviso'
export {
  BIBLIOTECA_AVISO_POLL_MS,
  lerUltimoServidorTotalAvisado,
  gravarUltimoServidorTotalAvisado,
  pedirPermissaoAvisoBibliotecaSeNecessario,
  showBibliotecaBrowserNotification,
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

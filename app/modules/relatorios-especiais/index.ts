/** Módulo Relatórios Especiais — tipos, cálculos, deleted-ids, fechamento/cobrança e PDF. */

export type { PecaSubstituicao } from './shared'
export { dataLocalHojeISO } from './shared'

export {
  RELATORIOS_ESPECIAIS_DELETED_IDS_KEY,
  normalizeDeletedIds,
  mergeDeletedIds,
  filterByDeletedIds,
  readDeletedIdsFromLocalStorage,
} from './deleted'

export {
  RELATORIOS_ESPECIAIS_STORAGE_KEY,
  MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_MES,
  MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_DIA,
  MAX_LINHAS_HORAS_RELATORIO_ESPECIAL_DIA,
  criarHorasEquipamentoDiaVazio,
  criarDiaTrabalhoEspecialVazio,
  criarRelatorioEspecialVazio,
} from './tipos'
export type {
  HorasEquipamentoDia,
  DiaTrabalhoEspecial,
  FechamentoEquipamentoEspecial,
  FechamentoRelatorioEspecial,
  RelatorioEspecial,
} from './tipos'

export type {
  TotaisRelatorioEspecial,
  DiaSemanaLabels,
  SessaoHorasEquipamentoEspecial,
  ResumoHorasTrabalhoDia,
  DiaSemMaquinaResumoEspecial,
  EquipamentoRefMinEspecial,
  ColetarDiasSemMaquinaOpts,
  DistribuicaoAlmocoLinhas,
} from './calculos'
export {
  calcularDuracaoHoras,
  minutosDeDuracaoHHMM,
  minutosPausaOuAlmocoDia,
  minutosViagemDia,
  minutosAlmocoDia,
  minutosTrabalhoBrutoDia,
  minutosTrabalhoLiquidoDia,
  indiceLinhaAlmocoActiva,
  distribuirAlmocoPorLinhaEquipamentoDia,
  minutosLiquidosPorLinhaEquipamentoDia,
  formatMinutosComoHHMM,
  horasEquipamentoDiaBruto,
  atualizarHorasEquipamentoDia,
  atualizarCalculosDiaEspecial,
  diaContaComoDiariaEspecial,
  calcularTotaisRelatorioEspecial,
  aplicarTotaisNoRelatorioEspecial,
  diaTrabalhoDataChaveOrdenacao,
  getDiaSemanaInfo,
  formatDiaComDiaSemana,
  sortDiasTrabalhoEspecialCronologicamente,
  formatDiaCurtoPt,
  intervaloHorasTrabalhoDia,
  intervaloViagemDia,
  resumoHorasTrabalhoDia,
  contarEquipamentosUnicosDia,
  equipamentosContextoDiaEspecial,
  coletarDiasSemMaquinaResumo,
  coletarSessoesPorEquipamento,
} from './calculos'

export type {
  FechamentoItemBaseEspecial,
  LabelsFechamentoEspecial,
  RelatorioEspecialFechamentoShape,
} from './fechamentoCobranca'
export {
  isRelatorioEspecialId,
  numeroPareceRelatorioEspecial,
  quantidadesFechamentoCobrancaEspecial,
  buildItensFechamentoBaseRelatorioEspecial,
  adaptRelatorioEspecialParaFechamentoShape,
  encontrarRelatorioEspecialPorOsInput,
} from './fechamentoCobranca'

export type {
  RelatorioEspecialPdfLabels,
  RelatorioEspecialPdfOptions,
  RelatorioEspecialPdfSecaoId,
  RelatorioEspecialPdfSecoes,
} from './pdf'
export {
  RELATORIO_ESPECIAL_PDF_SECAO_IDS,
  defaultRelatorioEspecialPdfSecoes,
  normalizeRelatorioEspecialPdfSecoes,
  temAlgumaSecaoPdfEspecial,
  imprimirRelatorioEspecialPdf,
} from './pdf'

export {
  riquezaRelatorioEspecial,
  dedupeRelatoriosEspeciais,
  encontrarRelatorioEspecialParaUpsert,
  upsertRelatorioEspecialNaLista,
} from './dedupe'

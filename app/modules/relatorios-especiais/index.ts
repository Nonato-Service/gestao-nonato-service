/** Módulo Relatórios Especiais — tipos, cálculos, deleted-ids e fechamento/cobrança. */

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
} from './calculos'
export {
  calcularDuracaoHoras,
  minutosDeDuracaoHHMM,
  minutosPausaOuAlmocoDia,
  minutosAlmocoDia,
  minutosTrabalhoBrutoDia,
  minutosTrabalhoLiquidoDia,
  formatMinutosComoHHMM,
  horasEquipamentoDiaBruto,
  atualizarHorasEquipamentoDia,
  atualizarCalculosDiaEspecial,
  calcularTotaisRelatorioEspecial,
  aplicarTotaisNoRelatorioEspecial,
  diaTrabalhoDataChaveOrdenacao,
  getDiaSemanaInfo,
  formatDiaComDiaSemana,
  sortDiasTrabalhoEspecialCronologicamente,
  formatDiaCurtoPt,
  intervaloHorasTrabalhoDia,
  resumoHorasTrabalhoDia,
  contarEquipamentosUnicosDia,
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

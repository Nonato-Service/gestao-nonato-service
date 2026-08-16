/**
 * @deprecated Preferir `app/modules/relatorios-especiais` — reexport de compatibilidade.
 */
export type {
  TotaisRelatorioEspecial,
  DiaSemanaLabels,
  SessaoHorasEquipamentoEspecial,
  ResumoHorasTrabalhoDia,
} from '../modules/relatorios-especiais/calculos'
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
} from '../modules/relatorios-especiais/calculos'

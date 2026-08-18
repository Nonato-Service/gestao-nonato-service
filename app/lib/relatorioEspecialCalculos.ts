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
  minutosViagemDia,
  minutosAlmocoDia,
  minutosTrabalhoBrutoDia,
  minutosTrabalhoLiquidoDia,
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
  resumoHorasTrabalhoDia,
  contarEquipamentosUnicosDia,
  coletarSessoesPorEquipamento,
} from '../modules/relatorios-especiais/calculos'

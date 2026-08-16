/**
 * @deprecated Preferir `app/modules/relatorios-especiais` — reexport de compatibilidade.
 */
export {
  RELATORIOS_ESPECIAIS_STORAGE_KEY,
  RELATORIOS_ESPECIAIS_DELETED_IDS_KEY,
  MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_MES,
  MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_DIA,
  MAX_LINHAS_HORAS_RELATORIO_ESPECIAL_DIA,
  criarHorasEquipamentoDiaVazio,
  criarDiaTrabalhoEspecialVazio,
  criarRelatorioEspecialVazio,
} from '../modules/relatorios-especiais/tipos'
export type {
  HorasEquipamentoDia,
  DiaTrabalhoEspecial,
  FechamentoEquipamentoEspecial,
  FechamentoRelatorioEspecial,
  RelatorioEspecial,
} from '../modules/relatorios-especiais/tipos'

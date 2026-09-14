/**
 * @deprecated Preferir `app/modules/relatorios-especiais` — reexport de compatibilidade.
 */
import {
  criarDiaTrabalhoEspecialVazio as criarDiaTrabalhoEspecialVazioPure,
  criarRelatorioEspecialVazio as criarRelatorioEspecialVazioPure,
} from '../modules/relatorios-especiais/tipos'
import type { DiaTrabalhoEspecial, RelatorioEspecial } from '../modules/relatorios-especiais/tipos'

export {
  RELATORIOS_ESPECIAIS_STORAGE_KEY,
  RELATORIOS_ESPECIAIS_DELETED_IDS_KEY,
  MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_MES,
  MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_DIA,
  MAX_LINHAS_HORAS_RELATORIO_ESPECIAL_DIA,
  criarHorasEquipamentoDiaVazio,
} from '../modules/relatorios-especiais/tipos'
export type {
  HorasEquipamentoDia,
  DiaTrabalhoEspecial,
  FechamentoEquipamentoEspecial,
  FechamentoRelatorioEspecial,
  RelatorioEspecial,
} from '../modules/relatorios-especiais/tipos'

/** Injeta Date.now() e Math.random() no id quando o call-site não envia. */
export function criarDiaTrabalhoEspecialVazio(data = ''): DiaTrabalhoEspecial {
  return criarDiaTrabalhoEspecialVazioPure(data, { nowMs: Date.now(), random: Math.random })
}

export function criarRelatorioEspecialVazio(): RelatorioEspecial {
  return criarRelatorioEspecialVazioPure({ nowMs: Date.now(), random: Math.random })
}

/** Re-export fino — fonte canónica em `app/modules/conhecimento-tecnico`. */
export type {
  ConhecimentoSkillField,
  ConhecimentoTecnicoEntry,
  ConhecimentoTecnicoStats,
  TipoEquipamentoOpcao,
} from '../modules/conhecimento-tecnico'
export {
  CONHECIMENTO_SKILL_FIELDS,
  clampConhecimentoNivel,
  descricaoKeyForSkill,
  getDescricaoValue,
  normalizeConhecimentoTecnicos,
  filterConhecimentoByTecnico,
  conhecimentoEntryExists,
  computeTecnicoStats,
  buildTiposEquipamentoOpcoes,
} from '../modules/conhecimento-tecnico'
import { createConhecimentoTecnicoEntry as createConhecimentoTecnicoEntryPure } from '../modules/conhecimento-tecnico/entries'
import type { ConhecimentoTecnicoEntry } from '../modules/conhecimento-tecnico/tipos'

/** Injeta Date.now() e Math.random() no id quando o call-site não envia. */
export function createConhecimentoTecnicoEntry(input: {
  tecnicoId: string
  equipamentoTipoId: string
  equipamentoTipoNome: string
  id?: string
}): ConhecimentoTecnicoEntry {
  return createConhecimentoTecnicoEntryPure({ ...input, nowMs: Date.now(), random: Math.random })
}

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
  filterConhecimentoByTecnico,
  conhecimentoEntryExists,
  computeTecnicoStats,
  buildTiposEquipamentoOpcoes,
} from '../modules/conhecimento-tecnico'
import {
  createConhecimentoTecnicoEntry as createConhecimentoTecnicoEntryPure,
  normalizeConhecimentoTecnicos as normalizeConhecimentoTecnicosPure,
} from '../modules/conhecimento-tecnico/entries'
import type { ConhecimentoTecnicoEntry } from '../modules/conhecimento-tecnico/tipos'

/** Injeta Date.now() nos ids em falta do payload persistido. */
export function normalizeConhecimentoTecnicos(raw: unknown): ConhecimentoTecnicoEntry[] {
  return normalizeConhecimentoTecnicosPure(raw, { nowMs: Date.now() })
}

/** Injeta Date.now() e Math.random() no id quando o call-site não envia. */
export function createConhecimentoTecnicoEntry(input: {
  tecnicoId: string
  equipamentoTipoId: string
  equipamentoTipoNome: string
  id?: string
}): ConhecimentoTecnicoEntry {
  return createConhecimentoTecnicoEntryPure({ ...input, nowMs: Date.now(), random: Math.random })
}

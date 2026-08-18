/** Módulo conhecimento técnico — tipos e helpers por técnico / tipo de equipamento. */

export type {
  ConhecimentoSkillField,
  ConhecimentoTecnicoEntry,
  ConhecimentoTecnicoStats,
  TipoEquipamentoOpcao,
} from './tipos'

export {
  CONHECIMENTO_SKILL_FIELDS,
  clampConhecimentoNivel,
  descricaoKeyForSkill,
  getDescricaoValue,
  normalizeConhecimentoTecnicos,
  filterConhecimentoByTecnico,
  conhecimentoEntryExists,
  createConhecimentoTecnicoEntry,
  computeTecnicoStats,
  buildTiposEquipamentoOpcoes,
} from './entries'

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
  createConhecimentoTecnicoEntry,
  computeTecnicoStats,
  buildTiposEquipamentoOpcoes,
} from '../modules/conhecimento-tecnico'

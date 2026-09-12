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

export type {
  ConhecimentoTecnicoFormPayload,
  CreateConhecimentoTecnicoFromFormOpts,
} from './fromForm'
export {
  isConhecimentoTecnicoFormValid,
  createConhecimentoTecnicoFromForm,
} from './fromForm'

export type { ConhecimentoFileItem } from './fileItem'
export {
  guessMime,
  isPdf,
  isImage,
  isTextLike,
  isWord,
  isZip,
  supportsTranslation,
} from './fileItem'

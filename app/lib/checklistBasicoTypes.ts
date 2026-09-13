/** Re-export fino — fonte canónica em `app/modules/checklist/basicoTipos`. */

import { newChecklistBasicoId as newChecklistBasicoIdPure } from '../modules/checklist/basicoTipos'

export { CHECKLIST_BASICO_STORAGE_KEY } from '../modules/checklist/basicoTipos'

/** Injeta Date.now() e Math.random() no id. */
export function newChecklistBasicoId(prefix: string): string {
  return newChecklistBasicoIdPure(prefix, Date.now(), Math.random)
}

export type {
  ChecklistBasicoItemStatus,
  ChecklistBasicoItem,
  ChecklistBasicoGrupo,
  ChecklistBasicoEquipamentoInfo,
  ChecklistBasicoInstancia,
} from '../modules/checklist/basicoTipos'

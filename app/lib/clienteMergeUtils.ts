/** Re-export fino — fonte canónica em `app/modules/clientes/merge`. */

export type { EquipamentoClienteMerge, ClienteMerge } from '../modules/clientes/merge'
export {
  equipamentoClienteDedupeKey,
  mergeEquipamentoClienteSameId,
  preferEquipamentoClienteMerge,
  dedupeEquipamentosClientePorSerie,
  mergeEquipamentosClienteLists,
  mergeNonatoClientesDeferServerLocal,
} from '../modules/clientes/merge'

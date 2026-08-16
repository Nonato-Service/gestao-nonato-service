/**
 * @deprecated Preferir `app/modules/clientes` — reexport de compatibilidade.
 */
export type { ClienteAlfabetoRow } from '../modules/clientes/busca'
export {
  getClienteLetraAlfabeto,
  ORCAMENTOS_ALFABETO_INDICE,
  ORCAMENTOS_ALFABETO_INDICE as CLIENTES_ALFABETO_INDICE,
  contarClientesPorLetraAlfabeto,
  filtrarClientesPorLetraAlfabeto,
  filtrarClientesPorBusca,
  agruparClientesPorLetra,
} from '../modules/clientes/busca'

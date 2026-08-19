/** Módulo Clientes — alfabeto A–Z, ordenação, busca, detalhe financeiro, tipo Cliente, formulário cadastro, prioritário e equipamento do cliente (funções puras). */

export type { Cliente } from './clienteTipos'

export type { ClienteFormState } from './clienteFormState'
export { emptyClienteFormState } from './clienteFormState'

export {
  CLIENTES_ALFABETO_INDICE,
  ORCAMENTOS_ALFABETO_INDICE,
  getClienteLetraAlfabeto,
  extrairPalavrasNomeCliente,
  clienteNomeMatchesLetraAlfabeto,
  clienteNomeMatchesLetraEmQualquerPalavra,
  contarClientesPorLetraAlfabeto,
  filtrarClientesPorLetraAlfabeto,
} from './alfabeto'

export {
  cmpNomeCliente,
  ordenarClientesPorNome,
  localeOrdenacaoClientes,
  ordenarNomesClientes,
} from './ordenar'

export type { ClienteAlfabetoRow } from './busca'
export {
  filtrarClientesPorBusca,
  agruparClientesPorLetra,
} from './busca'

export type {
  FechamentoItemLike,
  FechamentoIvaLike,
  RelatorioClienteLike,
  EquipamentoArmazemIdLookup,
  EquipamentoClienteLike,
  RotuloIdEquipamentoCliente,
  FaturaPecasLike,
  ClienteDetalheFinanceiroResumo,
  ClienteDetalheServicoFinanceiro,
  RelatorioServicoFinanceiroLike,
} from './detalhe'

export {
  rotuloIdEquipamentoCliente,
  fmtEuro,
  fmtEuroPt,
  formatarData,
  formatarDataPt,
  idClienteExibicao,
  getPagamentoRelatorio,
  relatorioServicoConsideradoConcluido,
  coletarRelatoriosCliente,
  coletarRelatoriosServicoCliente,
  coletarRelatoriosFinanceirosCliente,
  dataClienteDesde,
  dataEquipamentoAdicionado,
  calcularResumoFinanceiroCliente,
  buildServicosFinanceirosCliente,
} from './detalhe'

export type { ClientePrioritario, ClientePrioritarioForm } from './prioritarioTipos'
export { CLIENTE_PRIORITARIO_FORM_TRACKED_FIELDS } from './prioritarioTipos'

export {
  emptyClientePrioritarioForm,
  clientePrioritarioToForm,
  isClientePrioritarioFormValid,
  createClientePrioritarioFromForm,
  updateClientePrioritarioFromForm,
  clientePrioritarioFormCompleteness,
  formatClientePrioritarioAddress,
} from './prioritarioForm'

export type { RelatorioEquipamento, EquipamentoCliente } from './equipamentoClienteTipos'

export type { RelatorioEquipamentoFormFields } from './equipamentoClienteForm'
export {
  createEmptyEquipamentoClienteForm,
  createEmptyRelatorioEquipamentoForm,
} from './equipamentoClienteForm'

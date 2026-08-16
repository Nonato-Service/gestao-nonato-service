/** Módulo Clientes — alfabeto A–Z, ordenação, busca e detalhe financeiro (funções puras). */

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

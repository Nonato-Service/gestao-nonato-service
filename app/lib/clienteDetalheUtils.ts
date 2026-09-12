/**
 * @deprecated Preferir `app/modules/clientes` — reexport de compatibilidade.
 */
export type {
  FechamentoItemLike,
  FechamentoIvaLike,
  RelatorioClienteLike,
  EquipamentoArmazemIdLookup,
  EquipamentoClienteLike,
  RotuloIdEquipamentoCliente,
  FaturaPecasLike,
  ClienteDetalheData,
  ClienteDetalheFinanceiroResumo,
  ClienteDetalheServicoFinanceiro,
  RelatorioServicoFinanceiroLike,
} from '../modules/clientes/detalhe'

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
} from '../modules/clientes/detalhe'

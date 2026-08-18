/** Módulo Orçamentos — workflow, equipamento/pedidos, numeração avulsa, rascunho, imagens e pedido de relatório. */

export { chaveClienteOrcamento } from './chave'

export type {
  PedidoOrcamento,
  PedidoOrcamentoStatus,
  PedidoOrcamentoEmitirComo,
  PecaPedidoOrcamento,
  RelatorioParaPedidoOrcamento,
} from './pedidoRelatorioTipos'

export type { BuildPedidoOrcamentoFromRelatorioOpts } from './pedidoRelatorio'
export {
  buildPedidoOrcamentoFromRelatorio,
  relatorioTemPecasParaPedidoOrcamento,
} from './pedidoRelatorio'


export type {
  OrcamentoWorkflowStatus,
  PedidoSeparacaoItem,
  PedidoSeparacaoRef,
  OrcamentoWorkflowOrc,
} from './workflow'
export {
  orcamentoAguardandoConfirmacaoCliente,
  orcamentoPedidoConfirmado,
  orcamentoMercadoriaRecebida,
  criarPedidoSeparacaoFromOrcamento,
  pedidoSeparacaoJaExiste,
  notifyEquipamentoOrcamentosChanged,
} from './workflow'

export type {
  EquipamentoArmazemRef,
  EquipamentoClienteRef,
  PedidoOrcamentoRef,
  PedidoAvulsoRef,
  OrcamentoGeradoRef,
} from './equipamento'
export {
  resolverChaveEquipamentoCliente,
  equipamentoCorrespondeChave,
  pedidoRelatorioCorrespondeEquipamento,
  pedidoAvulsoCorrespondeEquipamento,
  orcamentoGeradoCorrespondeEquipamento,
  orcamentoStatusParaPedidoRelatorio,
  findOrcamentoGeradoParaPedidoRelatorio,
  findOrcamentoGeradoParaPedidoAvulso,
  statusEfetivoPedidoAvulso,
  pedidoAvulsoCancelado,
  orcamentoGeradoCancelado,
  pedidoRelatorioCancelado,
  statusEfetivoPedidoRelatorio,
  pedidoRelatorioPendenteComOrcamento,
  pedidoRelatorioAprovadoComOrcamento,
  dedupePedidosRelatorioCliente,
  chaveOrcamentoRelatorioJaTemPedido,
  aprovarPedidosOrcamentoRelatorio,
  aprovarOrcamentosGeradosRelatorio,
  aplicarPatchPedidoFromOrcamentoGerado,
  pedidoRelatorioPendente,
  pedidoRelatorioAprovado,
  pedidoAvulsoPendente,
  pedidoAvulsoAprovado,
  orcamentoGeradoPendente,
  orcamentoGeradoAprovado,
  pedidoAvulsoEntregaAguardandoNotaFiscal,
  orcamentoEntregaAguardandoNotaFiscal,
  pedidoAvulsoAprovadoSemEntrega,
  orcamentoGeradoAprovadoSemEntrega,
  gerarProximoCodigoPedidoRelatorio,
  clienteCorrespondeRegistro,
  pedidoRelatorioCorrespondeCliente,
  pedidoAvulsoCorrespondeCliente,
  orcamentoGeradoCorrespondeCliente,
  rotuloEquipamentoPedidoRelatorio,
  rotuloEquipamentoPedidoAvulso,
  rotuloEquipamentoOrcamentoGerado,
  mergeOrcamentosGeradosArrays,
  enrichOrcamentosGeradosComPedidosAvulsos,
} from './equipamento'

export type { OrcamentoAvulsoNumeroRef } from './numeroAvulso'
export {
  parseNumeroOrcamentoAvulsoSequencial,
  dataIsoParaDiaAnoOrcamento,
  gerarProximoNumeroOrcamentoAvulso,
  resolverNumeroOrcamentoAvulsoAoSalvar,
  snapshotDadosClienteOrcamentoAvulso,
} from './numeroAvulso'

export type {
  OrcamentoAvulsoTipoRascunho,
  OrcamentoAvulsoItemRascunho,
  OrcamentoAvulsoRascunhoPersist,
} from './rascunhoAvulso'
export {
  ORCAMENTO_AVULSO_RASCUNHO_LS,
  criarOrcamentoAvulsoRascunhoVazio,
  lerOrcamentoAvulsoRascunhoSession,
  gravarOrcamentoAvulsoRascunhoSession,
  limparOrcamentoAvulsoRascunhoSession,
} from './rascunhoAvulso'

export {
  ORCAMENTO_PECA_IMAGEM_PADRAO_SRC,
  resolveImagemItemOrcamentoParaGravar,
  resolveImagemItemOrcamentoDisplay,
  itemOrcamentoDeveMostrarImagem,
} from './imagemItem'

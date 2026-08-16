/** Módulo SST — Solicitação de Serviço Técnico (tipos, formulário vazio, mappers cliente/equipamento). */

export type {
  SolicitacaoDocDevolvido,
  SolicitacaoDocDevolvidoCliente,
  SolicitacaoServicoTecnico,
  SolicitacaoServicoTecnicoFormState,
  ClienteSstLike,
  EquipamentoClienteSstLike,
} from './tipos'

export { emptySolicitacaoServicoTecnicoFormState } from './formState'

export {
  enriquecerSolicitacaoComClienteCadastrado,
  mergeClienteSelecionadoSst,
  patchEquipamentoClienteChave,
} from './clienteMappers'

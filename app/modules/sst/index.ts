/** Módulo SST — Solicitação de Serviço Técnico (tipos, form, mappers, texto de envio, print PDF). */

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

export {
  sstRefValFromId,
  rotuloNivelUrgenciaSst,
  rotuloHorarioPreferidoSst,
  sstHtmlLangFromUiLanguage,
  formatDataSstLista,
} from './rotulos'

export type { SstEnvioTextoTr } from './envioTexto'
export { buildSolicitacaoBody } from './envioTexto'

export type { SstPrintTr, SolicitacaoPrintPayload } from './printPayload'
export { buildSolicitacaoPrintPayload } from './printPayload'

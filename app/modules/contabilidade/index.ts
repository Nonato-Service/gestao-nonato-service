/** Módulo Contabilidade — estilos, escape, mailto e builders HTML/texto (funções puras). */

export { CONTAB_PRINT_WINDOW_STYLES } from './estilosPrint'
export { escAttr, preEsc, valDash } from './escape'
export { mailtoPrefixContabilidade } from './mailto'
export { construirTextoPlanoClienteDadosContabilidade } from './textoCliente'
export { buildHtmlClienteDadosContabilidade } from './documentoCliente'
export type { BuildHtmlClienteDadosContabilidadeInput } from './documentoCliente'
export { buildHtmlFechamentoContabilidade } from './documentoFechamento'
export type { BuildHtmlFechamentoContabilidadeInput } from './documentoFechamento'
export type {
  ContabAnexoLike,
  ClienteContabEnvioModalOpts,
  ClienteContabLike,
  RelatorioContabLike,
  FechamentoIvaTotaisContab,
  ContabLabels,
} from './tipos'

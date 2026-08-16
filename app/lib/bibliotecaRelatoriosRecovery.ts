/**
 * @deprecated Preferir `app/modules/biblioteca` — reexport de compatibilidade.
 */
export type {
  RelatorioServicoMin,
  ClienteMin,
  RecuperacaoRelatoriosResultado,
} from '../modules/biblioteca/relatoriosRecovery'
export {
  normalizarNomeClienteParaMatch,
  nomesClienteCorrespondem,
  resolverClienteIdRelatorioFlexivel,
  recuperarRelatoriosServicoPerdidos,
  mergeRelatoriosServicoDeferServerLocal,
  relatoriosServicoOrfaosNaBiblioteca,
  agruparRelatoriosOrfaosPorNome,
} from '../modules/biblioteca/relatoriosRecovery'

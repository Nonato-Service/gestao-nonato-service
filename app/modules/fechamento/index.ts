export type {
  ServicoCadastroFechamentoMin,
  FechamentoItem,
  FechamentoLinhaIdFixo,
} from './tipos'
export { FECHAMENTO_IDS_FIXOS_TEMPLATE } from './tipos'

export {
  normalizeServicoValorStored,
  formatServicoValorExibicao,
  parseServicoValorInput,
  servicoValorToInputString,
} from './servicoValor'

export {
  servicoCodParaExibicao,
  servicoDescricaoLegivelFechamento,
  servicoRotuloParaSelectFechamento,
} from './servicoRotulos'

export {
  filtrarServicosCadastroPorGrupo,
  resolverServicosFechamentoTemplate,
  servicoCombinaLinhaFechamento,
  servicoPertenceAoGrupoFechamento,
  getServicoParaLinhaFechamento,
  enriquecerLinhaFechamentoComCadastro,
} from './linhaCadastro'

export type { FechamentoIvaOpcoesRelatorio } from './iva'
export {
  filtrarFechamentoItensPorOmitidos,
  FECHAMENTO_IVA_PADRAO,
  parseFechamentoIncluirIva,
  normalizarFechamentoIvaOpcoes,
  resolveFechamentoIvaOpcoes,
  totaisFechamentoLiquidoComIva,
} from './iva'

export type { ServicoCadastroGrupo } from './grupos'
export {
  DEFAULT_SERVICO_GRUPO_ID,
  ordenarServicoGrupos,
  nomeGrupoTarifaServico,
  migrarServicoLegacyCodNomeDesc,
} from './grupos'

export type {
  LabelsFechamentoCobrancaRelatorio,
  RelatorioServicoCobrancaMin,
  BuildItensFechamentoBaseRelatorioOpts,
} from './cobrancaRelatorio'
export {
  hhmmToDecimal,
  minutosParaHorasDecimal,
  quantidadesFechamentoCobrancaRelatorio,
  buildItensFechamentoBaseRelatorio,
  isLinhaManualFechamento,
  sincronizarItensFechamentoComRelatorioAtualizado,
} from './cobrancaRelatorio'

export type {
  LabelsLinhaFechamentoFixa,
  BuildItensFechamentoParaExibirOpts,
} from './exibirItens'
export {
  buildItensFechamentoParaExibirFromSalvos,
  labelLinhaFechamentoFixa,
  filtrarOpcoesServicoLinhaFechamento,
} from './exibirItens'

export type { ResumoCobrancaDecisao } from './persistMaps'
export {
  RESUMO_COBRANCA_DECISAO_KEY,
  FECHAMENTO_ITENS_OMITIDOS_KEY,
  FECHAMENTO_IVA_POR_RELATORIO_KEY,
  FECHAMENTO_GRUPO_POR_RELATORIO_KEY,
  pruneRelatorioIdsFromMap,
  normalizeResumoCobrancaDecisaoMap,
  normalizeFechamentoItensOmitidosMap,
  normalizeFechamentoIvaPorRelatorioMap,
  normalizeFechamentoGrupoPorRelatorioMap,
} from './persistMaps'

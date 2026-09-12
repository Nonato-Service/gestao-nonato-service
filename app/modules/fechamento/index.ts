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
  servicoOpcaoSelectFechamentoComValor,
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

export type {
  ServicoCadastroItem,
  ServicoCadastroTipoCobranca,
  ServicoCadastroCategoria,
} from './servicoCadastroTipos'

export type { ServicoCadastroFormState, CadastroServicoSavePayload } from './servicoCadastroForm'
export { emptyServicoCadastroFormState, servicoCadastroToFormState } from './servicoCadastroForm'

export {
  isServicoCadastroFormValid,
  resolverGrupoIdServicoCadastro,
  createServicoCadastroFromForm,
  updateServicoCadastroFromForm,
} from './servicoCadastroFromForm'

export type { ServicoCadastroGrupo } from './grupos'
export {
  DEFAULT_SERVICO_GRUPO_ID,
  ordenarServicoGrupos,
  nomeGrupoTarifaServico,
  migrarServicoLegacyCodNomeDesc,
} from './grupos'
export type { CreateServicoCadastroGrupoFromFormOpts } from './grupoFromForm'
export {
  isServicoCadastroGrupoNomeValid,
  proximaOrdemServicoCadastroGrupo,
  createServicoCadastroGrupoFromForm,
  updateServicoCadastroGrupoNomeFromForm,
} from './grupoFromForm'

export type { RelatorioCobrancaGrupoMin } from './cobrancaGrupos'
export { buildRelatorioCobrancaGruposOpcoes } from './cobrancaGrupos'

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
  resolverQuantidadeLinhaFechamentoExibir,
  buildItensFechamentoParaExibirFromSalvos,
  labelLinhaFechamentoFixa,
  filtrarOpcoesServicoLinhaFechamento,
} from './exibirItens'

export type { ComprovanteParaFechamentoMin } from './comprovantesMerge'
export {
  comprovanteIdFechamento,
  filtrarComprovantesDoCliente,
  comprovanteParaItemFechamento,
  mesclarComprovantesEmItensFechamento,
} from './comprovantesMerge'

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

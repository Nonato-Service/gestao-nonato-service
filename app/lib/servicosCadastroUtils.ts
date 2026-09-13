/** Re-export fino — fonte canónica em `app/modules/fechamento`. */

export type { ServicoCadastroGrupo, ServicoCadastroItem } from '../modules/fechamento'
export {
  DEFAULT_SERVICO_GRUPO_ID,
  ordenarServicoGrupos,
  nomeGrupoTarifaServico,
  migrarServicoLegacyCodNomeDesc,
  servicoCodParaExibicao,
  formatServicoValorExibicao,
  TEMPLATE_SERVICOS_PADRAO,
  SERVICO_COD_ORDEM_PADRAO,
  labelTipoCobranca,
  labelCategoria,
  coletarCodigosMatriz,
  servicoPorCodNoGrupo,
} from '../modules/fechamento'

/**
 * @deprecated Preferir `app/modules/clientes` (alfabeto) e `app/modules/orcamentos` (chave).
 * Reexport de compatibilidade.
 */
export {
  ORCAMENTOS_ALFABETO_INDICE,
  getClienteLetraAlfabeto,
  extrairPalavrasNomeCliente,
  clienteNomeMatchesLetraAlfabeto,
  clienteNomeMatchesLetraEmQualquerPalavra,
  contarClientesPorLetraAlfabeto,
  filtrarClientesPorLetraAlfabeto,
} from '../modules/clientes/alfabeto'

export { chaveClienteOrcamento } from '../modules/orcamentos/chave'

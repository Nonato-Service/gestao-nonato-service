/** Re-export fino — fonte canónica em `app/modules/clientes`. */
export type { ClienteDuplicadoMotivo, ClienteCadastroDuplicado } from '../modules/clientes'

export {
  normalizarNomeClienteComparacao,
  normalizarNifClienteComparacao,
  saoNomesClienteIguais,
  eVarianteNomeClienteComExtra,
  encontrarClienteDuplicadoCadastro,
  encontrarClienteDuplicadoCadastroAntecipado,
  listarClientesNomeSimilarCadastro,
} from '../modules/clientes'

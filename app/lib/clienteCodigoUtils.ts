/** Re-export fino — fonte canónica em `app/modules/clientes/codigo`. */

export {
  CLIENTE_CODIGO_PREFIX,
  normalizarCodigoCliente,
  parseSequenciaCodigoCliente,
  formatarCodigoClienteSequencia,
  gerarProximoCodigoCliente,
  garantirCodigosClientes,
  codigoClienteExibicao,
} from '../modules/clientes/codigo'

/**
 * @deprecated Preferir `app/modules/clientes` — reexport de compatibilidade.
 * Chave de orçamento permanece aqui (específica de orçamentos).
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

export function chaveClienteOrcamento(clienteId?: string, clienteNome?: string, fallbackId?: string): string {
  const id = String(clienteId ?? '').trim()
  if (id) return `id:${id}`
  const nome = String(clienteNome ?? '').trim()
  if (nome) return `nome:${nome.toLowerCase()}`
  return `orc:${fallbackId || 'sem-cliente'}`
}

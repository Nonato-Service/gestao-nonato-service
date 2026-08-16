/** Chave estável para agrupar orçamentos por cliente. */
export function chaveClienteOrcamento(
  clienteId?: string,
  clienteNome?: string,
  fallbackId?: string
): string {
  const id = String(clienteId ?? '').trim()
  if (id) return `id:${id}`
  const nome = String(clienteNome ?? '').trim()
  if (nome) return `nome:${nome.toLowerCase()}`
  return `orc:${fallbackId || 'sem-cliente'}`
}

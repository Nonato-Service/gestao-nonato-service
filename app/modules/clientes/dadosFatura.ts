/** Texto fiscal do cliente para emitir fatura (puro, sem I/O). */

export type ClienteDadosFatura = {
  nomeEmpresa?: string
  numeroContribuicaoFiscal?: string
  morada?: string
  codigoPostal?: string
  localidade?: string
  conselho?: string
  freguesia?: string
  pais?: string
  telefones?: string
  email?: string
}

export type ClienteDadosFaturaLabels = {
  nome?: string
  nif?: string
  morada?: string
  codigoPostal?: string
  localidade?: string
  conselho?: string
  pais?: string
  telefone?: string
  email?: string
}

function linhaFatura(label: string, valor: string | undefined): string | null {
  const v = String(valor || '').trim()
  if (!v) return null
  return `${label}: ${v}`
}

/** Bloco copiável: nome, NIF, morada e contactos para o software de faturação. */
export function formatClienteDadosFaturaTexto(
  cliente: ClienteDadosFatura | null | undefined,
  labels?: ClienteDadosFaturaLabels
): string {
  if (!cliente) return ''
  const cpLocal = [cliente.codigoPostal, cliente.localidade]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .join(' ')
  return [
    linhaFatura(labels?.nome || 'Nome', cliente.nomeEmpresa),
    linhaFatura(labels?.nif || 'NIF', cliente.numeroContribuicaoFiscal),
    linhaFatura(labels?.morada || 'Morada', cliente.morada),
    linhaFatura(labels?.codigoPostal || 'Código postal', cpLocal || undefined),
    linhaFatura(labels?.conselho || 'Concelho', cliente.conselho),
    linhaFatura(labels?.pais || 'País', cliente.pais),
    linhaFatura(labels?.telefone || 'Telefone', cliente.telefones),
    linhaFatura(labels?.email || 'E-mail', cliente.email),
  ]
    .filter(Boolean)
    .join('\n')
}

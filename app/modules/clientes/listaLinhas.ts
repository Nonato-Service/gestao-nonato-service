/** Dados e texto de INF. ADICIONAL na lista de clientes. */

export type ClienteListaLinhasData = {
  codigoCliente?: string
  id?: string
  nomeEmpresa?: string
  telefones?: string
  localidade?: string
  morada?: string
  codigoPostal?: string
  numeroContribuicaoFiscal?: string
  email?: string
}

/** Evita «NIF NIF 123» quando o valor já traz o prefixo. */
export function formatNifClienteExibicao(nif: string | undefined | null): string {
  const t = String(nif ?? '').trim()
  if (!t) return ''
  return /^nif[\s.:]/i.test(t) ? t : `NIF ${t}`
}

export function buildClienteInfAdicional(cliente: ClienteListaLinhasData): string {
  const localCp = [cliente.localidade, cliente.codigoPostal]
    .map((x) => String(x || '').trim())
    .filter((x) => x && !/^x+$/i.test(x))
    .join(' ')
    .trim()

  return [
    cliente.telefones?.trim(),
    cliente.morada?.trim(),
    localCp,
    formatNifClienteExibicao(cliente.numeroContribuicaoFiscal),
    cliente.email?.trim(),
  ]
    .filter(Boolean)
    .join(' · ')
}

import { codigoClienteExibicao } from './clienteCodigoUtils'
import {
  getClienteLetraAlfabeto,
  ORCAMENTOS_ALFABETO_INDICE,
  contarClientesPorLetraAlfabeto,
  filtrarClientesPorLetraAlfabeto,
} from './orcamentosAlfabeto'
import { ordenarClientesPorNome } from './ordenarClientes'

export {
  getClienteLetraAlfabeto,
  ORCAMENTOS_ALFABETO_INDICE as CLIENTES_ALFABETO_INDICE,
  contarClientesPorLetraAlfabeto,
  filtrarClientesPorLetraAlfabeto,
}

export type ClienteAlfabetoRow = {
  id: string
  nomeEmpresa: string
  codigoCliente?: string
  morada?: string
  codigoPostal?: string
  pais?: string
  telefones?: string
  email?: string
  contato?: string
  localidade?: string
  conselho?: string
  numeroContribuicaoFiscal?: string
  isDevedor?: boolean
  saldoPendente?: number
  relatoriosNaoPagoCount?: number
}

export function filtrarClientesPorBusca<T extends ClienteAlfabetoRow>(
  clientes: T[],
  busca: string,
  locale = 'pt-BR'
): T[] {
  const q = busca.trim().toLowerCase()
  const base = q
    ? clientes.filter(
        (cliente) =>
          cliente.nomeEmpresa.toLowerCase().includes(q) ||
          codigoClienteExibicao(cliente).toLowerCase().includes(q) ||
          (cliente.codigoCliente || '').toLowerCase().includes(q) ||
          (cliente.morada || '').toLowerCase().includes(q) ||
          (cliente.codigoPostal || '').toLowerCase().includes(q) ||
          (cliente.pais || '').toLowerCase().includes(q) ||
          cliente.telefones?.toLowerCase().includes(q) ||
          cliente.email?.toLowerCase().includes(q) ||
          cliente.contato?.toLowerCase().includes(q)
      )
    : [...clientes]
  return ordenarClientesPorNome(base, locale) as T[]
}

export function agruparClientesPorLetra<T extends ClienteAlfabetoRow>(clientes: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const c of clientes) {
    const letra = getClienteLetraAlfabeto(c.nomeEmpresa)
    if (!map.has(letra)) map.set(letra, [])
    map.get(letra)!.push(c)
  }
  return map
}

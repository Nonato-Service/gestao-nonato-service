/** Empresa no PDF de orçamento — mapeamento e HTML. Sem I/O. */

import { escapePdfHtml } from '../pdf/documentLayout'

export type OrcamentoPdfEmpresa = {
  nomeEmpresa?: string
  morada?: string
  nif?: string
  telefone?: string
  email?: string
  website?: string
}

export type ClienteEmpresaPdfOrigem = {
  nomeEmpresa?: string
  morada?: string
  codigoPostal?: string
  conselho?: string
  pais?: string
  numeroContribuicaoFiscal?: string
  telefones?: string
  email?: string
}

export type FichaCadastralEmpresaPdfOrigem = {
  nomeEmpresa?: string
  morada?: string
  nif?: string
  telefone?: string
  email?: string
}

export const EMPRESA_NONATO_DEFAULT: OrcamentoPdfEmpresa = {
  nomeEmpresa: 'NONATO SERVICE',
  morada: 'Portugal',
  website: 'www.nonatoservice.pt',
}

export function buildEmpresaBlockHtml(
  empresa: OrcamentoPdfEmpresa | undefined,
  L: Record<string, string | undefined>
): string {
  if (!empresa) return ''
  const nome = String(empresa.nomeEmpresa ?? '').trim()
  const morada = String(empresa.morada ?? '').trim()
  const nif = String(empresa.nif ?? '').trim()
  const tel = String(empresa.telefone ?? '').trim()
  const email = String(empresa.email ?? '').trim()
  const web = String(empresa.website ?? '').trim()
  if (!nome && !morada && !nif && !tel && !email) return ''

  const line = (label: string | undefined, val: string) =>
    val
      ? `<div class="orc-pdf-pro__empresa-line">${label ? `<span class="orc-pdf-pro__empresa-label">${escapePdfHtml(label)}:</span> ` : ''}${escapePdfHtml(val)}</div>`
      : ''

  return `<div class="orc-pdf-pro__empresa">
    ${nome ? `<div class="orc-pdf-pro__empresa-nome">${escapePdfHtml(nome)}</div>` : ''}
    ${morada ? `<div class="orc-pdf-pro__empresa-line">${escapePdfHtml(morada).replace(/\n/g, '<br/>')}</div>` : ''}
    ${line(L.empresaNifLabel || 'NIF', nif)}
    ${line(L.empresaTelefoneLabel || L.telefone || 'Telefone', tel)}
    ${line(L.empresaEmailLabel || L.email || 'E-mail', email)}
    ${line(L.website || 'Website', web)}
  </div>`
}

/** Converte cadastro de cliente para bloco de empresa no PDF. */
export function clienteParaEmpresaPdf(cliente: ClienteEmpresaPdfOrigem): OrcamentoPdfEmpresa {
  const moradaLinha = [
    String(cliente.morada ?? '').trim(),
    [String(cliente.codigoPostal ?? '').trim(), String(cliente.conselho ?? '').trim()]
      .filter(Boolean)
      .join(' '),
    String(cliente.pais ?? '').trim(),
  ]
    .filter(Boolean)
    .join(', ')
  return {
    nomeEmpresa: String(cliente.nomeEmpresa ?? '').trim(),
    morada: moradaLinha,
    nif: String(cliente.numeroContribuicaoFiscal ?? '').trim(),
    telefone: String(cliente.telefones ?? '').trim(),
    email: String(cliente.email ?? '').trim(),
  }
}

/** Converte ficha cadastral da Nonato Service para bloco de empresa no PDF. */
export function fichaCadastralParaEmpresaPdf(
  ficha: FichaCadastralEmpresaPdfOrigem
): OrcamentoPdfEmpresa {
  return {
    nomeEmpresa: String(ficha.nomeEmpresa ?? '').trim() || 'NONATO SERVICE',
    morada: String(ficha.morada ?? '').trim(),
    nif: String(ficha.nif ?? '').trim(),
    telefone: String(ficha.telefone ?? '').trim(),
    email: String(ficha.email ?? '').trim(),
    website: 'www.nonatoservice.pt',
  }
}

/** Define qual entidade aparece no cabeçalho do PDF conforme «emitir como». */
export function resolverEmpresaPedidoOrcamentoPdf(
  emitirComo: 'cliente' | 'nonato-service',
  opts: {
    empresaNonato: OrcamentoPdfEmpresa
    cliente?: ClienteEmpresaPdfOrigem | null
    nomeClienteFallback?: string
  }
): OrcamentoPdfEmpresa {
  if (emitirComo === 'nonato-service') {
    return opts.empresaNonato
  }
  if (opts.cliente && String(opts.cliente.nomeEmpresa ?? '').trim()) {
    return clienteParaEmpresaPdf(opts.cliente)
  }
  return {
    nomeEmpresa: String(opts.nomeClienteFallback ?? '').trim(),
  }
}

/** Textos e telefones para envio de IBAN / cobrança (e-mail, WhatsApp, SMS). */

export type FichaCadastralBancariaMin = {
  nomeEmpresa?: string
  nif?: string
  nib?: string
  iban?: string
  swift?: string
  nomeBanco?: string
  telefone?: string
  email?: string
  morada?: string
}

export type FaturaPecasEnvioLike = {
  numeroFatura: string
  clienteNome: string
  valorTotal: number
}

export type RelatorioCobrancaEnvioLike = {
  numero: string
  cliente?: string
  maquinaModelo?: string
}

/** Primeiro telefone da lista (só dígitos, máx. 18). */
export function primeiroTelefoneSoDigitosCliente(telefones: string): string {
  const partes = (telefones || '')
    .split(/[/,;]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const raw = (partes[0] || telefones || '').replace(/\D/g, '')
  return raw.slice(0, 18)
}

/** Dígitos para wa.me — prefixo 351 em móveis PT de 9 dígitos. */
export function digitosWhatsAppFromTelefonesCliente(telefones: string): string {
  const raw = primeiroTelefoneSoDigitosCliente(telefones)
  if (raw.length === 9 && raw.startsWith('9')) return '351' + raw
  if (raw.length >= 9) return raw
  if (raw.length > 0) return '351' + raw
  return ''
}

function appendLinhasDadosBancarios(lines: string[], fc: FichaCadastralBancariaMin): void {
  if (fc.nif) lines.push(`NIF: ${fc.nif}`)
  if (fc.nib) lines.push(`NIB: ${fc.nib}`)
  if (fc.iban) lines.push(`IBAN: ${fc.iban}`)
  if (fc.swift) lines.push(`SWIFT/BIC: ${fc.swift}`)
  if (fc.nomeBanco) lines.push(`Banco: ${fc.nomeBanco}`)
  if (fc.telefone) lines.push(`Contacto: ${fc.telefone}`)
  if (fc.email) lines.push(`Email: ${fc.email}`)
  if (fc.morada) lines.push(`Morada: ${fc.morada}`)
}

export function buildCorpoEnvioIbanFaturaPecas(
  fatura: FaturaPecasEnvioLike,
  ficha: FichaCadastralBancariaMin
): string {
  const nome = (ficha.nomeEmpresa || 'NONATO SERVICE').trim()
  const lines: string[] = [
    'Olá,',
    '',
    `Seguem os dados para pagamento da fatura ${fatura.numeroFatura} (${fatura.clienteNome}).`,
    `Valor total: €${fatura.valorTotal.toFixed(2)} (com IVA).`,
    '',
    `${nome} — dados bancários:`,
  ]
  appendLinhasDadosBancarios(lines, ficha)
  lines.push('')
  lines.push('Obrigado.')
  return lines.join('\n')
}

export function buildCorpoEnvioCobrancaFechamentoBiblioteca(
  rel: RelatorioCobrancaEnvioLike,
  totalComIva: number,
  ficha: FichaCadastralBancariaMin,
  clienteNome?: string
): string {
  const nome = (ficha.nomeEmpresa || 'NONATO SERVICE').trim()
  const nomeCli = (clienteNome || rel.cliente || '—').trim() || '—'
  const lines: string[] = [
    'Olá,',
    '',
    `Seguem os dados para pagamento do fechamento do relatório ${rel.numero} (${nomeCli}).`,
    `Equipamento: ${rel.maquinaModelo || '—'}.`,
    `Valor total (c/ IVA): €${totalComIva.toFixed(2)}.`,
    '',
    `${nome} — dados bancários:`,
  ]
  appendLinhasDadosBancarios(lines, ficha)
  lines.push('')
  lines.push('Obrigado.')
  return lines.join('\n')
}

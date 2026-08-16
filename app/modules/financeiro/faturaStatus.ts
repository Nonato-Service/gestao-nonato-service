/** Status / sinal de pagamento de faturas (fornecedor e peças). */

export type SinalPagamentoFaturaFornecedor = 'pago' | 'pendente' | 'atrasado'
export type SinalPagamentoFaturaPecas = SinalPagamentoFaturaFornecedor | 'cancelada'
export type StatusFaturasAgregado = 'pago' | 'pendente' | 'atrasado' | 'sem-faturas'

export type FaturaFornecedorStatusLike = {
  status: 'pendente' | 'paga' | 'vencida'
  dataVencimento?: string
  mes?: string
  clienteId?: string
}

export type FaturaPecasStatusLike = {
  status: 'pendente' | 'paga' | 'vencida' | 'cancelada'
  dataVencimento?: string
}

export type FornecedorFaturasLike = {
  id?: string
  nomeEmpresa: string
  faturas?: FaturaFornecedorStatusLike[]
}

export type StatusFaturasDetalhado = {
  semFatura: boolean
  faturaPendente: boolean
  faturaAtrasada: boolean
  faturaPaga: boolean
}

export type ClienteFaturaBadgeLabels = {
  semFaturas?: string
  semFatura?: string
  clienteBadgeFaturaAReceber?: string
  clienteBadgeNaoPago?: string
  clienteBadgeEmDia?: string
}

export type ClienteFaturaBadgeProps = {
  bg: string
  fg: string
  border: string
  label: string
  mark: string
}

export function getSinalPagamentoFaturaFornecedor(
  f: Pick<FaturaFornecedorStatusLike, 'status' | 'dataVencimento'>,
  hojeRef?: Date
): SinalPagamentoFaturaFornecedor {
  const hoje = hojeRef ? new Date(hojeRef) : new Date()
  hoje.setHours(0, 0, 0, 0)
  if (f.status === 'paga') return 'pago'
  if (f.status === 'vencida') return 'atrasado'
  if (f.dataVencimento) {
    const dv = new Date(f.dataVencimento)
    dv.setHours(0, 0, 0, 0)
    if (dv < hoje) return 'atrasado'
  }
  return 'pendente'
}

/** Converte texto com formato PT (350,50 ou 350) em número. */
export function parseMoedaPtFaturaFornecedor(s: string): number {
  const t = String(s ?? '')
    .trim()
    .replace(/\s/g, '')
  if (!t) return NaN
  const normalized = t.replace(/\./g, '').replace(',', '.')
  return parseFloat(normalized)
}

/** Durante a digitação: só dígitos e uma vírgula; remove zeros à esquerda na parte inteira. */
export function sanitizeFaturaFornecedorValorDigitando(raw: string): string {
  let s = String(raw ?? '').replace(/[^\d,]/g, '')
  const firstComma = s.indexOf(',')
  if (firstComma !== -1) {
    s = s.slice(0, firstComma + 1) + s.slice(firstComma + 1).replace(/,/g, '')
  }
  const parts = s.split(',')
  let intPart = parts[0] ?? ''
  const frac = (parts[1] ?? '').slice(0, 2)
  intPart = intPart.replace(/^0+(?=\d)/, '')
  if (intPart === '' && frac !== '') intPart = '0'
  if (parts.length > 1) return intPart + ',' + frac
  return intPart
}

export function getSinalPagamentoFaturaPecas(
  f: Pick<FaturaPecasStatusLike, 'status' | 'dataVencimento'>,
  hojeRef?: Date
): SinalPagamentoFaturaPecas {
  const hoje = hojeRef ? new Date(hojeRef) : new Date()
  hoje.setHours(0, 0, 0, 0)
  if (f.status === 'paga') return 'pago'
  if (f.status === 'cancelada') return 'cancelada'
  if (f.status === 'vencida') return 'atrasado'
  if (f.dataVencimento) {
    const dv = new Date(f.dataVencimento)
    dv.setHours(0, 0, 0, 0)
    if (dv < hoje) return 'atrasado'
  }
  return 'pendente'
}

export function listarFaturasPendentesFornecedores<T extends FornecedorFaturasLike>(
  fornecedores: T[]
): Array<{ fornecedor: T; fatura: NonNullable<T['faturas']>[number] }> {
  const todas: Array<{ fornecedor: T; fatura: NonNullable<T['faturas']>[number] }> = []
  fornecedores.forEach((fornecedor) => {
    ;(fornecedor.faturas || []).forEach((fatura) => {
      if (fatura.status === 'pendente' || fatura.status === 'vencida') {
        todas.push({ fornecedor, fatura })
      }
    })
  })
  return todas.sort((a, b) => {
    const mesA = String(a.fatura.mes || '')
    const mesB = String(b.fatura.mes || '')
    if (mesA !== mesB) return mesA.localeCompare(mesB)
    return a.fornecedor.nomeEmpresa.localeCompare(b.fornecedor.nomeEmpresa)
  })
}

export function agruparFaturasPorMes<T extends { mes: string }>(faturas: T[]): Record<string, T[]> {
  const agrupadas: Record<string, T[]> = {}
  faturas.forEach((fatura) => {
    if (!agrupadas[fatura.mes]) agrupadas[fatura.mes] = []
    agrupadas[fatura.mes].push(fatura)
  })
  return agrupadas
}

function statusAgregadoDeFaturas(
  faturas: Array<{ status: 'pendente' | 'paga' | 'vencida' }>
): StatusFaturasAgregado {
  if (faturas.length === 0) return 'sem-faturas'
  if (faturas.some((f) => f.status === 'vencida')) return 'atrasado'
  if (faturas.some((f) => f.status === 'pendente')) return 'pendente'
  return 'pago'
}

export function getStatusFaturasCliente(
  clienteId: string,
  fornecedores: FornecedorFaturasLike[]
): StatusFaturasAgregado {
  const faturasDoCliente: FaturaFornecedorStatusLike[] = []
  fornecedores.forEach((fornecedor) => {
    ;(fornecedor.faturas || []).forEach((fatura) => {
      if (fatura.clienteId === clienteId) faturasDoCliente.push(fatura)
    })
  })
  return statusAgregadoDeFaturas(faturasDoCliente)
}

export function clienteFaturaBadgePropsFromStatus(
  st: StatusFaturasAgregado,
  labels?: ClienteFaturaBadgeLabels | null
): ClienteFaturaBadgeProps {
  const tr = (labels || {}) as ClienteFaturaBadgeLabels
  if (st === 'sem-faturas') {
    return {
      bg: 'rgba(255, 255, 255, 0.14)',
      fg: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.65)',
      label: tr.semFaturas || tr.semFatura || 'Sem Faturas',
      mark: '—',
    }
  }
  if (st === 'pendente') {
    return {
      bg: '#fde047',
      fg: '#1c1917',
      border: '1px solid rgba(202, 138, 8, 0.95)',
      label: tr.clienteBadgeFaturaAReceber || 'Fatura a receber',
      mark: '\u23F3',
    }
  }
  if (st === 'atrasado') {
    return {
      bg: '#dc2626',
      fg: '#ffffff',
      border: '1px solid rgba(252, 165, 165, 0.7)',
      label: tr.clienteBadgeNaoPago || 'Não pago',
      mark: '!',
    }
  }
  return {
    bg: '#15803d',
    fg: '#ecfdf5',
    border: '1px solid rgba(74, 222, 128, 0.55)',
    label: tr.clienteBadgeEmDia || 'Em Dia',
    mark: '\u2713',
  }
}

/** Badge do cadastro de clientes a partir do id + lista de fornecedores. */
export function getClienteFaturaBadgeProps(
  clienteId: string,
  fornecedores: FornecedorFaturasLike[],
  labels?: ClienteFaturaBadgeLabels | null
): ClienteFaturaBadgeProps {
  return clienteFaturaBadgePropsFromStatus(getStatusFaturasCliente(clienteId, fornecedores), labels)
}

export function getStatusFaturasFornecedor(fornecedor: FornecedorFaturasLike): StatusFaturasAgregado {
  return statusAgregadoDeFaturas(fornecedor.faturas || [])
}

export function getStatusFaturasDetalhado(fornecedor: FornecedorFaturasLike): StatusFaturasDetalhado {
  const faturas = fornecedor.faturas || []
  return {
    semFatura: faturas.length === 0,
    faturaPendente: faturas.some((f) => f.status === 'pendente'),
    faturaAtrasada: faturas.some((f) => f.status === 'vencida'),
    faturaPaga: faturas.length > 0 && faturas.some((f) => f.status === 'paga'),
  }
}

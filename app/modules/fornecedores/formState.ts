/** Estado vazio e mapeamento Fornecedor / FaturaFornecedor → formulário. */

import type {
  FaturaFornecedor,
  FaturaFornecedorFormState,
  Fornecedor,
  FornecedorFormState,
} from './tipos'

export function emptyFornecedorFormState(): FornecedorFormState {
  return {
    nomeEmpresa: '',
    morada: '',
    localidade: '',
    conselho: '',
    pais: '',
    codigoPostal: '',
    freguesia: '',
    numeroContribuicaoFiscal: '',
    telefones: '',
    email: '',
    contato: '',
    iban: '',
  }
}

export function fornecedorToFormState(fornecedor: Fornecedor): FornecedorFormState {
  return {
    nomeEmpresa: fornecedor.nomeEmpresa,
    morada: fornecedor.morada,
    localidade: fornecedor.localidade,
    conselho: fornecedor.conselho,
    pais: fornecedor.pais,
    codigoPostal: fornecedor.codigoPostal,
    freguesia: fornecedor.freguesia,
    numeroContribuicaoFiscal: fornecedor.numeroContribuicaoFiscal,
    telefones: fornecedor.telefones,
    email: fornecedor.email,
    contato: fornecedor.contato,
    iban: fornecedor.iban,
  }
}

export function emptyFaturaFornecedorFormState(
  overrides?: Partial<FaturaFornecedorFormState>
): FaturaFornecedorFormState {
  return {
    numeroFatura: '',
    mes: new Date().toISOString().slice(0, 7), // YYYY-MM
    valorText: '',
    clienteId: '',
    clienteNome: '',
    dataVencimento: '',
    status: 'pendente',
    observacoes: '',
    entidadeOrigem: 'fornecedor',
    ...overrides,
  }
}

/** Formata valor numérico da fatura para o campo de texto PT (ex.: 350,00). */
export function formatFaturaFornecedorValorText(valor: number): string {
  return Number.isFinite(valor)
    ? valor.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : ''
}

export function faturaFornecedorToFormState(
  fatura: FaturaFornecedor,
  entidadeOrigem: 'fornecedor' | 'cliente'
): FaturaFornecedorFormState {
  return {
    numeroFatura: fatura.numeroFatura,
    mes: fatura.mes,
    valorText: formatFaturaFornecedorValorText(fatura.valor),
    clienteId: fatura.clienteId,
    clienteNome: fatura.clienteNome,
    dataVencimento: fatura.dataVencimento || '',
    status: fatura.status,
    observacoes: fatura.observacoes || '',
    entidadeOrigem,
  }
}

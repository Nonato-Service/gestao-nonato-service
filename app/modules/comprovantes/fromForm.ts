/** Validação e mapeamento puro do comprovante de despesa. */

import { hashImagemComprovante } from './duplicado'
import type { ComprovanteDespesaFormState } from './formState'
import type { ComprovanteDespesa } from './tipos'

export function isComprovanteDespesaClienteNomeValid(
  form: Pick<ComprovanteDespesaFormState, 'tipo' | 'cliente'>
): boolean {
  if (form.tipo !== 'cliente') return true
  return Boolean(form.cliente.trim())
}

export function comprovanteDespesaClienteCadastrado(
  clientes: { nomeEmpresa: string }[],
  nome: string
): boolean {
  return clientes.some((c) => c.nomeEmpresa === nome)
}

export function dadosDuplicadoComprovanteFromForm(
  form: Pick<
    ComprovanteDespesaFormState,
    'tipo' | 'cliente' | 'data' | 'valorUnitario' | 'quantidade' | 'imagemBase64'
  >
) {
  const dataNorm = String(form.data || '').slice(0, 10)
  return {
    imagemBase64: form.imagemBase64 || undefined,
    data: dataNorm,
    valorTotal: form.valorUnitario * form.quantidade,
    tipo: form.tipo,
    cliente: form.tipo === 'cliente' ? form.cliente.trim() : '',
  }
}

export type CreateComprovanteDespesaFromFormOpts = {
  id?: string
  clientes?: { id: string; nomeEmpresa: string }[]
}

export function createComprovanteDespesaFromForm(
  form: ComprovanteDespesaFormState,
  opts: CreateComprovanteDespesaFromFormOpts = {}
): ComprovanteDespesa {
  const dataNorm = String(form.data || '').slice(0, 10)
  const mesFromData = dataNorm.length >= 7 ? dataNorm.slice(0, 7) : new Date().toISOString().slice(0, 7)
  const mesPick =
    typeof form.mesCompetencia === 'string' && /^\d{4}-\d{2}$/.test(form.mesCompetencia)
      ? form.mesCompetencia
      : mesFromData
  const nomeCliente = form.tipo === 'cliente' ? form.cliente.trim() : ''
  return {
    id: opts.id ?? Date.now().toString(),
    tipo: form.tipo,
    cliente: nomeCliente,
    clienteId:
      form.tipo === 'cliente'
        ? opts.clientes?.find((c) => c.nomeEmpresa === nomeCliente)?.id || undefined
        : undefined,
    data: dataNorm || new Date().toISOString().slice(0, 10),
    mesCompetencia: mesPick !== mesFromData ? mesPick : undefined,
    valorUnitario: form.valorUnitario,
    quantidade: form.quantidade,
    valorTotal: form.valorUnitario * form.quantidade,
    descricao: form.descricao.trim() || undefined,
    imagemBase64: form.imagemBase64 || undefined,
    imagemHash: form.imagemBase64 ? hashImagemComprovante(form.imagemBase64) : undefined,
  }
}

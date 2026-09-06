/**
 * Junta despesas de comprovantes (foto → cliente activo) às linhas manuais do fechamento,
 * sem alterar o armazenamento de comprovantes nem duplicar itens já presentes.
 */
import type { FechamentoItem } from './tipos'

export type ComprovanteParaFechamentoMin = {
  id: string
  tipo: 'cliente' | 'pessoal'
  cliente: string
  clienteId?: string
  data?: string
  valorUnitario: number
  quantidade: number
  valorTotal: number
  descricao?: string
}

function chaveClienteNorm(clienteId: string | undefined, clienteNome: string): string {
  const id = String(clienteId || '').trim()
  if (id) return `id:${id}`
  return `nome:${String(clienteNome || '').trim().toLowerCase()}`
}

export function comprovanteIdFechamento(comprovanteId: string): string {
  return `comp-${String(comprovanteId || '').trim()}`
}

/** Comprovantes de tipo cliente que batem com o cliente do relatório. */
export function filtrarComprovantesDoCliente(
  comprovantes: ComprovanteParaFechamentoMin[],
  clienteId?: string | null,
  clienteNome?: string | null
): ComprovanteParaFechamentoMin[] {
  const alvo = chaveClienteNorm(clienteId || undefined, clienteNome || '')
  if (alvo === 'nome:') return []
  return (comprovantes || []).filter((c) => {
    if (c.tipo !== 'cliente') return false
    return chaveClienteNorm(c.clienteId, c.cliente) === alvo
  })
}

export function comprovanteParaItemFechamento(
  c: ComprovanteParaFechamentoMin,
  labelFallback = 'Despesa (comprovante)'
): FechamentoItem {
  const qtd = Number(c.quantidade) > 0 ? Number(c.quantidade) : 1
  const vu = Math.max(0, Number(c.valorUnitario) || 0)
  const total =
    Number(c.valorTotal) > 0 ? Number(c.valorTotal) : Math.round(qtd * vu * 100) / 100
  const dataHint = c.data ? String(c.data).slice(0, 10) : ''
  const desc = String(c.descricao || '').trim() || labelFallback
  return {
    id: comprovanteIdFechamento(c.id),
    descricao: desc,
    tipoCobranca: 'unidade',
    quantidade: qtd,
    valorUnitario: vu,
    valorTotal: total,
    origem: 'manual',
    infoAdicional: dataHint ? `Comprovante ${dataHint}` : 'Comprovante (foto)',
  }
}

/**
 * Acrescenta comprovantes do cliente que ainda não estão no fechamento
 * (por id `comp-…`). Preserva todas as linhas existentes.
 */
export function mesclarComprovantesEmItensFechamento(
  itensAtuais: FechamentoItem[],
  comprovantes: ComprovanteParaFechamentoMin[],
  clienteId?: string | null,
  clienteNome?: string | null,
  labelFallback = 'Despesa (comprovante)'
): FechamentoItem[] {
  const base = Array.isArray(itensAtuais) ? [...itensAtuais] : []
  const ids = new Set(base.map((i) => i.id))
  const doCliente = filtrarComprovantesDoCliente(comprovantes, clienteId, clienteNome)
  let changed = false
  for (const c of doCliente) {
    const fid = comprovanteIdFechamento(c.id)
    if (!fid || ids.has(fid)) continue
    base.push(comprovanteParaItemFechamento(c, labelFallback))
    ids.add(fid)
    changed = true
  }
  return changed ? base : itensAtuais
}

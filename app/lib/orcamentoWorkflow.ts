/** Fluxo pedagógico: fornecedor (empresa) → cotação → orçamento cliente → aprovado → separação → recebido */

export type OrcamentoWorkflowStatus =
  | 'enviado_fornecedor'
  | 'cotacao_recebida'
  | 'gerado'
  | 'pedido_confirmado'
  | 'aguardando_separacao'
  | 'mercadoria_recebida'

export type PedidoSeparacaoItem = {
  id: string
  descricao: string
  quantidade: number
  codigo?: string
  pecaId?: string
  imagem?: string
  status: 'aguardando-fornecedor' | 'separado-nao-embalado' | 'pronto-envio'
}

export type PedidoSeparacaoRef = {
  id: string
  numeroOrcamento: string
  clienteNome: string
  clienteId?: string
  dadosCliente?: Record<string, unknown>
  dataPedido?: string
  status: 'aguardando-fornecedor' | 'separado-nao-embalado' | 'pronto-envio'
  itens: PedidoSeparacaoItem[]
  dataCriacao: string
  mercadoriaRecebidaEm?: string
  origemOrcamentoId?: string
}

export type OrcamentoWorkflowOrc = {
  id: string
  numeroOrcamento: string
  status?: string
  workflowStatus?: OrcamentoWorkflowStatus
  clienteId?: string
  clienteNome?: string
  data?: string
  descricao?: string
  dadosCliente?: { nomeEmpresa?: string }
  itens?: Array<{
    descricao: string
    quantidade: number
    codigo?: string
    pecaId?: string
    imagem?: string
  }>
}

export function orcamentoAguardandoConfirmacaoCliente(orc: OrcamentoWorkflowOrc): boolean {
  const ws = orc.workflowStatus
  if (ws === 'gerado' || ws === 'cotacao_recebida') return orc.status === 'pendente' || !orc.status
  return (!ws || ws === 'gerado') && (!orc.status || orc.status === 'pendente')
}

export function orcamentoPedidoConfirmado(orc: OrcamentoWorkflowOrc): boolean {
  if (orcamentoMercadoriaRecebida(orc)) return false
  return (
    orc.workflowStatus === 'pedido_confirmado' ||
    orc.workflowStatus === 'aguardando_separacao' ||
    (orc.status === 'aprovado' && !orc.workflowStatus)
  )
}

export function orcamentoMercadoriaRecebida(orc: OrcamentoWorkflowOrc): boolean {
  return orc.workflowStatus === 'mercadoria_recebida'
}

export function criarPedidoSeparacaoFromOrcamento(
  orc: OrcamentoWorkflowOrc,
  pecasBiblioteca?: Array<{ id: string; codigo?: string; imagem?: string }>
): PedidoSeparacaoRef {
  const resolverImagem = (item: { pecaId?: string; imagem?: string; codigo?: string }) => {
    if (item.imagem) return item.imagem
    if (item.pecaId && pecasBiblioteca) {
      const p = pecasBiblioteca.find((x) => x.id === item.pecaId)
      if (p?.imagem) return p.imagem
    }
    if (item.codigo && pecasBiblioteca) {
      const p = pecasBiblioteca.find((x) => x.codigo === item.codigo)
      if (p?.imagem) return p.imagem
    }
    return undefined
  }

  const itens = (orc.itens ?? []).map((item, index) => ({
    id: `item-${Date.now()}-${index}`,
    descricao: item.descricao,
    quantidade: Number(item.quantidade) || 1,
    codigo: item.codigo,
    pecaId: item.pecaId,
    imagem: resolverImagem(item),
    status: 'aguardando-fornecedor' as const,
  }))

  return {
    id: 'pedido-sep-' + Date.now(),
    numeroOrcamento: orc.numeroOrcamento,
    clienteNome: orc.clienteNome || orc.dadosCliente?.nomeEmpresa || 'N/A',
    clienteId: orc.clienteId,
    dadosCliente: orc.dadosCliente,
    dataPedido: orc.data,
    status: 'aguardando-fornecedor',
    itens,
    dataCriacao: new Date().toISOString(),
    origemOrcamentoId: orc.id,
  }
}

export function pedidoSeparacaoJaExiste(
  pedidos: PedidoSeparacaoRef[],
  numeroOrcamento: string
): boolean {
  const num = String(numeroOrcamento ?? '').trim()
  if (!num) return false
  return pedidos.some((p) => String(p.numeroOrcamento ?? '').trim() === num)
}

/** Dispara actualização nos painéis de equipamento do cliente (mesmo separador). */
export function notifyEquipamentoOrcamentosChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nonato-equip-orcamentos-changed'))
  }
}

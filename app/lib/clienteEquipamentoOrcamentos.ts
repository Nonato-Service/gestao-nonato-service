import { resolverIdEquipamentoCliente } from './relatorioServicoEquipamentos'

export type EquipamentoClienteRef = {
  id?: string
  tipoEquipamento?: string
  modelo?: string
  marca?: string
  numeroSerie?: string
}

export type PedidoOrcamentoRef = {
  id: string
  codigo?: string
  numeroRelatorio: string
  cliente: string
  clienteId?: string
  equipamentoId?: string
  maquinaModelo: string
  numeroMaquina: string
  data: string
  dataGeracao: string
  status: 'pendente' | 'enviado' | 'recebido' | 'aprovado' | 'rejeitado'
  emitirComoCliente?: 'cliente' | 'nonato-service'
  pecas?: Array<{ codigo: string; descricao: string; quantidade: number | string }>
}

export type PedidoAvulsoRef = {
  codigo: string
  dataGeracao: string
  clienteNomeReal: string
  clienteId?: string
  equipamentoTexto: string
  equipamentoChave?: string
  equipamentoNumeroSerie?: string
  emitirComoCliente: 'cliente' | 'nonato-service'
  status?: 'pendente' | 'cancelado' | 'concluido' | 'aprovado' | 'entregue'
  numeroNotaFiscalEntrega?: string
  entregaConfirmadaEm?: string
  geradoEm?: string
  pecas?: Array<{ codigo: string; nome: string; quantidade: number; imagem?: string }>
}

export type OrcamentoGeradoRef = {
  id: string
  numeroOrcamento: string
  data: string
  descricao?: string
  tipo?: string
  status?: 'pendente' | 'cancelado' | 'concluido' | 'aprovado' | 'entregue'
  clienteId?: string
  clienteNome?: string
  relatorioId?: string
  relatorioNumero?: string
  equipamentoChave?: string
  equipamentoNumeroSerie?: string
  dataCriacao?: string
  geradoEm?: string
  numeroNotaFiscalEntrega?: string
  entregaConfirmadaEm?: string
  total?: number
}

export function resolverChaveEquipamentoCliente(
  equipamento: EquipamentoClienteRef,
  index: number
): string {
  return resolverIdEquipamentoCliente(equipamento, index)
}

export function equipamentoCorrespondeChave(
  equipamento: EquipamentoClienteRef,
  index: number,
  chaveAlvo: string | undefined
): boolean {
  const alvo = String(chaveAlvo ?? '').trim()
  if (!alvo) return false
  const chave = resolverChaveEquipamentoCliente(equipamento, index)
  const serie = String(equipamento.numeroSerie ?? '').trim()
  const modelo = String(equipamento.modelo ?? '').trim()
  const id = String(equipamento.id ?? '').trim()
  return (
    chave === alvo ||
    serie === alvo ||
    modelo === alvo ||
    id === alvo
  )
}

export function pedidoRelatorioCorrespondeEquipamento(
  pedido: PedidoOrcamentoRef,
  clienteId: string,
  equipamento: EquipamentoClienteRef,
  equipamentoIndex: number,
  clienteNome?: string
): boolean {
  const cid = String(clienteId).trim()
  const pedidoClienteId = String(pedido.clienteId ?? '').trim()
  const nomeOk =
    pedidoClienteId === cid ||
    (!pedidoClienteId &&
      clienteNome &&
      String(pedido.cliente ?? '').trim().toLowerCase() === clienteNome.trim().toLowerCase())
  if (!nomeOk) return false
  return equipamentoCorrespondeChave(equipamento, equipamentoIndex, pedido.equipamentoId)
}

export function pedidoAvulsoCorrespondeEquipamento(
  pedido: PedidoAvulsoRef,
  clienteId: string,
  equipamento: EquipamentoClienteRef,
  equipamentoIndex: number,
  clienteNome?: string
): boolean {
  const cid = String(clienteId).trim()
  const pedidoClienteId = String(pedido.clienteId ?? '').trim()
  const nomeOk =
    pedidoClienteId === cid ||
    (!pedidoClienteId &&
      clienteNome &&
      String(pedido.clienteNomeReal ?? '').trim().toLowerCase() === clienteNome.trim().toLowerCase())
  if (!nomeOk) return false
  if (pedido.equipamentoChave && equipamentoCorrespondeChave(equipamento, equipamentoIndex, pedido.equipamentoChave)) {
    return true
  }
  const texto = String(pedido.equipamentoTexto ?? '').toLowerCase()
  const modelo = String(equipamento.modelo ?? '').trim().toLowerCase()
  const marca = String(equipamento.marca ?? '').trim().toLowerCase()
  const serie = String(equipamento.numeroSerie ?? '').trim().toLowerCase()
  if (modelo && texto.includes(modelo)) return true
  if (serie && texto.includes(serie)) return true
  if (marca && modelo && texto.includes(`${marca}`)) return true
  return false
}

export function orcamentoGeradoCorrespondeEquipamento(
  orc: OrcamentoGeradoRef,
  clienteId: string,
  equipamento: EquipamentoClienteRef,
  equipamentoIndex: number,
  clienteNome?: string,
  numerosRelatorio?: string[]
): boolean {
  const cid = String(clienteId).trim()
  const orcClienteId = String(orc.clienteId ?? '').trim()
  const nomeOk =
    orcClienteId === cid ||
    (!orcClienteId &&
      clienteNome &&
      String(orc.clienteNome ?? '').trim().toLowerCase() === clienteNome.trim().toLowerCase())
  if (!nomeOk) return false
  if (orc.relatorioNumero && numerosRelatorio?.includes(orc.relatorioNumero)) return true
  if (
    orc.equipamentoChave &&
    equipamentoCorrespondeChave(equipamento, equipamentoIndex, orc.equipamentoChave)
  ) {
    return true
  }
  const orcSerie = String(orc.equipamentoNumeroSerie ?? '').trim().toLowerCase()
  const eqSerie = String(equipamento.numeroSerie ?? '').trim().toLowerCase()
  if (orcSerie && eqSerie && orcSerie === eqSerie) return true
  const desc = String(orc.descricao ?? '').toLowerCase()
  const modelo = String(equipamento.modelo ?? '').trim().toLowerCase()
  const serie = String(equipamento.numeroSerie ?? '').trim().toLowerCase()
  if (modelo && desc.includes(modelo)) return true
  if (serie && desc.includes(serie)) return true
  return false
}

export function pedidoRelatorioPendente(status: PedidoOrcamentoRef['status']): boolean {
  return status === 'pendente' || status === 'enviado' || status === 'recebido'
}

export function pedidoRelatorioAprovado(status: PedidoOrcamentoRef['status']): boolean {
  return status === 'aprovado'
}

export function pedidoAvulsoPendente(status?: PedidoAvulsoRef['status']): boolean {
  return !status || status === 'pendente'
}

export function pedidoAvulsoAprovado(status?: PedidoAvulsoRef['status']): boolean {
  return status === 'aprovado' || status === 'concluido' || status === 'entregue'
}

export function orcamentoGeradoPendente(status?: OrcamentoGeradoRef['status']): boolean {
  return !status || status === 'pendente'
}

export function orcamentoGeradoAprovado(status?: OrcamentoGeradoRef['status']): boolean {
  return status === 'aprovado' || status === 'concluido' || status === 'entregue'
}

export function pedidoAvulsoEntregaAguardandoNotaFiscal(pedido: PedidoAvulsoRef): boolean {
  return pedido.status === 'entregue' && !String(pedido.numeroNotaFiscalEntrega ?? '').trim()
}

export function orcamentoEntregaAguardandoNotaFiscal(orc: OrcamentoGeradoRef): boolean {
  return orc.status === 'entregue' && !String(orc.numeroNotaFiscalEntrega ?? '').trim()
}

export function pedidoAvulsoAprovadoSemEntrega(status?: PedidoAvulsoRef['status']): boolean {
  return status === 'aprovado' || status === 'concluido'
}

export function orcamentoGeradoAprovadoSemEntrega(status?: OrcamentoGeradoRef['status']): boolean {
  return status === 'aprovado' || status === 'concluido'
}

export function gerarProximoCodigoPedidoRelatorio(pedidos: PedidoOrcamentoRef[]): string {
  const ano = new Date().getFullYear()
  const prefix = `POR-${ano}-`
  const mesmosAno = pedidos.filter((p) => (p.codigo || '').startsWith(prefix))
  const nums = mesmosAno.map((p) => {
    const n = parseInt(String(p.codigo).replace(prefix, ''), 10)
    return Number.isNaN(n) ? 0 : n
  })
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

export function clienteCorrespondeRegistro(
  clienteId: string,
  clienteNome: string,
  registroClienteId?: string,
  registroClienteNome?: string
): boolean {
  const cid = String(clienteId).trim()
  const rid = String(registroClienteId ?? '').trim()
  if (rid && rid === cid) return true
  const nome = String(clienteNome ?? '').trim().toLowerCase()
  const rnome = String(registroClienteNome ?? '').trim().toLowerCase()
  return Boolean(nome && rnome && nome === rnome)
}

export function pedidoRelatorioCorrespondeCliente(
  pedido: PedidoOrcamentoRef,
  clienteId: string,
  clienteNome?: string
): boolean {
  return clienteCorrespondeRegistro(clienteId, clienteNome || '', pedido.clienteId, pedido.cliente)
}

export function pedidoAvulsoCorrespondeCliente(
  pedido: PedidoAvulsoRef,
  clienteId: string,
  clienteNome?: string
): boolean {
  return clienteCorrespondeRegistro(clienteId, clienteNome || '', pedido.clienteId, pedido.clienteNomeReal)
}

export function orcamentoGeradoCorrespondeCliente(
  orc: OrcamentoGeradoRef,
  clienteId: string,
  clienteNome?: string
): boolean {
  return clienteCorrespondeRegistro(clienteId, clienteNome || '', orc.clienteId, orc.clienteNome)
}

export function rotuloEquipamentoPedidoRelatorio(pedido: PedidoOrcamentoRef): string {
  return `${pedido.maquinaModelo || ''}${pedido.numeroMaquina ? ` (${pedido.numeroMaquina})` : ''}`.trim() || '—'
}

export function rotuloEquipamentoPedidoAvulso(pedido: PedidoAvulsoRef): string {
  return String(pedido.equipamentoTexto || '—').trim() || '—'
}

export function rotuloEquipamentoOrcamentoGerado(orc: OrcamentoGeradoRef): string {
  const serie = String(orc.equipamentoNumeroSerie ?? '').trim()
  const desc = String(orc.descricao || '—').trim() || '—'
  if (serie) {
    return desc !== '—' ? `${desc} · Nº Série: ${serie}` : `Nº Série: ${serie}`
  }
  return desc
}

/** Repõe n.º de série/chave em orçamentos avulsos antigos a partir dos pedidos guardados. */
export function enrichOrcamentosGeradosComPedidosAvulsos<T extends OrcamentoGeradoRef>(
  orcamentos: T[],
  pedidos: PedidoAvulsoRef[]
): T[] {
  if (!Array.isArray(orcamentos) || orcamentos.length === 0) return orcamentos
  return orcamentos.map((o) => {
    if (o.equipamentoNumeroSerie || o.equipamentoChave) return o
    if (o.tipo !== 'pedido-avulso') return o
    const codigo = o.id?.startsWith('avulso-') ? o.id.slice('avulso-'.length) : o.numeroOrcamento
    const ped = pedidos.find((p) => p.codigo === codigo || p.codigo === o.numeroOrcamento)
    if (!ped) return o
    return {
      ...o,
      equipamentoNumeroSerie: ped.equipamentoNumeroSerie,
      equipamentoChave: ped.equipamentoChave,
    }
  })
}

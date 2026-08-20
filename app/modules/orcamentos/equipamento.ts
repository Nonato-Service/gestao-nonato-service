import { resolverIdEquipamentoCliente, resolverIdEquipamentoVisivelCliente } from '../../lib/relatorioServicoEquipamentos'

export type EquipamentoArmazemRef = {
  id?: string
  numeroSerie?: string
}

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
  relatorioId?: string
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
  emitirComoCliente?: 'cliente' | 'nonato-service'
  workflowStatus?: string
  status?: 'pendente' | 'cancelado' | 'concluido' | 'aprovado' | 'entregue'
  numeroNotaFiscalEntrega?: string
  entregaConfirmadaEm?: string
  geradoEm?: string
  cotacaoRecebidaEm?: string
  pecas?: Array<{ codigo: string; nome: string; quantidade: number; imagem?: string }>
}

export type OrcamentoGeradoRef = {
  id: string
  numeroOrcamento: string
  data: string
  descricao?: string
  tipo?: string
  status?: 'pendente' | 'cancelado' | 'concluido' | 'aprovado' | 'entregue'
  workflowStatus?: string
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
  /** Linhas com preço (quando o orçamento gerado as guarda). */
  itens?: Array<{
    id?: string
    descricao?: string
    nome?: string
    quantidade?: number | string
    precoUnitario?: number
    codigo?: string
    codigoPeca?: string
  }>
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
  chaveAlvo: string | undefined,
  equipamentosArmazem: EquipamentoArmazemRef[] = []
): boolean {
  const alvo = String(chaveAlvo ?? '').trim()
  if (!alvo) return false
  const chave = resolverChaveEquipamentoCliente(equipamento, index)
  const vis = resolverIdEquipamentoVisivelCliente(equipamento, equipamentosArmazem)
  const serie = String(equipamento.numeroSerie ?? '').trim()
  const modelo = String(equipamento.modelo ?? '').trim()
  const marca = String(equipamento.marca ?? '').trim()
  const id = String(equipamento.id ?? '').trim()
  const modeloMarca = `${modelo} ${marca}`.trim()
  return (
    chave === alvo ||
    vis === alvo ||
    serie === alvo ||
    modelo === alvo ||
    id === alvo ||
    modeloMarca === alvo ||
    String(index) === alvo
  )
}

export function pedidoRelatorioCorrespondeEquipamento(
  pedido: PedidoOrcamentoRef,
  clienteId: string,
  equipamento: EquipamentoClienteRef,
  equipamentoIndex: number,
  clienteNome?: string,
  equipamentosArmazem: EquipamentoArmazemRef[] = [],
  numerosRelatorio?: string[]
): boolean {
  const cid = String(clienteId).trim()
  const pedidoClienteId = String(pedido.clienteId ?? '').trim()
  const nomeOk =
    pedidoClienteId === cid ||
    (!pedidoClienteId &&
      clienteNome &&
      String(pedido.cliente ?? '').trim().toLowerCase() === clienteNome.trim().toLowerCase())
  if (!nomeOk) return false
  if (
    equipamentoCorrespondeChave(
      equipamento,
      equipamentoIndex,
      pedido.equipamentoId,
      equipamentosArmazem
    )
  ) {
    return true
  }
  const serieEq = String(equipamento.numeroSerie ?? '').trim().toLowerCase()
  const seriePed = String(pedido.numeroMaquina ?? '').trim().toLowerCase()
  if (serieEq && seriePed && serieEq === seriePed) return true
  const modeloEq = String(equipamento.modelo ?? '').trim().toLowerCase()
  const modeloPed = String(pedido.maquinaModelo ?? '').trim().toLowerCase()
  if (modeloEq && modeloPed && modeloEq === modeloPed) {
    if (!serieEq || !seriePed) return true
    return serieEq === seriePed
  }
  return false
}

export function pedidoAvulsoCorrespondeEquipamento(
  pedido: PedidoAvulsoRef,
  clienteId: string,
  equipamento: EquipamentoClienteRef,
  equipamentoIndex: number,
  clienteNome?: string,
  equipamentosArmazem: EquipamentoArmazemRef[] = []
): boolean {
  const cid = String(clienteId).trim()
  const pedidoClienteId = String(pedido.clienteId ?? '').trim()
  const nomeOk =
    pedidoClienteId === cid ||
    (!pedidoClienteId &&
      clienteNome &&
      String(pedido.clienteNomeReal ?? '').trim().toLowerCase() === clienteNome.trim().toLowerCase())
  if (!nomeOk) return false
  if (
    pedido.equipamentoChave &&
    equipamentoCorrespondeChave(equipamento, equipamentoIndex, pedido.equipamentoChave, equipamentosArmazem)
  ) {
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
  numerosRelatorio?: string[],
  equipamentosArmazem: EquipamentoArmazemRef[] = []
): boolean {
  const cid = String(clienteId).trim()
  const orcClienteId = String(orc.clienteId ?? '').trim()
  const nomeOk =
    orcClienteId === cid ||
    (!orcClienteId &&
      clienteNome &&
      String(orc.clienteNome ?? '').trim().toLowerCase() === clienteNome.trim().toLowerCase())
  if (!nomeOk) return false
  if (
    orc.equipamentoChave &&
    equipamentoCorrespondeChave(equipamento, equipamentoIndex, orc.equipamentoChave, equipamentosArmazem)
  ) {
    return true
  }
  const orcSerie = String(orc.equipamentoNumeroSerie ?? '').trim().toLowerCase()
  const eqSerie = String(equipamento.numeroSerie ?? '').trim().toLowerCase()
  if (orcSerie && eqSerie && orcSerie === eqSerie) return true
  const desc = String(orc.descricao ?? '').toLowerCase()
  const modelo = String(equipamento.modelo ?? '').trim().toLowerCase()
  const serie = String(equipamento.numeroSerie ?? '').trim().toLowerCase()
  if (modelo && desc.includes(modelo)) {
    if (!serie || desc.includes(serie)) return true
  }
  if (serie && desc.includes(serie)) return true
  return false
}

export function orcamentoStatusParaPedidoRelatorio(
  status?: OrcamentoGeradoRef['status']
): PedidoOrcamentoRef['status'] | null {
  if (!status) return null
  if (status === 'aprovado' || status === 'concluido' || status === 'entregue') return 'aprovado'
  if (status === 'cancelado') return 'rejeitado'
  return null
}

export function findOrcamentoGeradoParaPedidoRelatorio(
  pedido: PedidoOrcamentoRef,
  orcamentos: OrcamentoGeradoRef[]
): OrcamentoGeradoRef | undefined {
  const byId = orcamentos.find((o) => o.id === `rel-${pedido.id}`)
  if (byId) return byId
  const num = String(pedido.numeroRelatorio ?? '').trim()
  if (!num) return undefined
  return orcamentos.find((o) => String(o.relatorioNumero ?? '').trim() === num)
}

export function findOrcamentoGeradoParaPedidoAvulso(
  pedido: PedidoAvulsoRef,
  orcamentos: OrcamentoGeradoRef[]
): OrcamentoGeradoRef | undefined {
  const byId = orcamentos.find((o) => o.id === `avulso-${pedido.codigo}`)
  if (byId) return byId
  return orcamentos.find((o) => o.numeroOrcamento === pedido.codigo && o.tipo === 'pedido-avulso')
}

/** Estado real do pedido avulso — considera orçamento gerado ligado. */
export function statusEfetivoPedidoAvulso(
  pedido: PedidoAvulsoRef,
  orcamento?: OrcamentoGeradoRef | null
): PedidoAvulsoRef['status'] {
  const rank: Record<NonNullable<PedidoAvulsoRef['status']>, number> = {
    pendente: 0,
    cancelado: 1,
    aprovado: 3,
    concluido: 4,
    entregue: 5,
  }
  let best: PedidoAvulsoRef['status'] = pedido.status || 'pendente'
  const fromOrc = orcamento?.status
  if (fromOrc && rank[fromOrc] > rank[best]) best = fromOrc
  return best
}

export function pedidoAvulsoCancelado(
  pedido: PedidoAvulsoRef,
  orcamento?: OrcamentoGeradoRef | null
): boolean {
  const st = statusEfetivoPedidoAvulso(pedido, orcamento)
  return st === 'cancelado' || orcamento?.status === 'cancelado'
}

export function orcamentoGeradoCancelado(status?: OrcamentoGeradoRef['status']): boolean {
  return status === 'cancelado'
}

export function pedidoRelatorioCancelado(status: PedidoOrcamentoRef['status']): boolean {
  return status === 'rejeitado'
}

/** Estado real do pedido — considera orçamento gerado ligado (ex.: aprovado em Orçamentos Gerados). */
export function statusEfetivoPedidoRelatorio(
  pedido: PedidoOrcamentoRef,
  orcamento?: OrcamentoGeradoRef | null
): PedidoOrcamentoRef['status'] {
  const rank: Record<PedidoOrcamentoRef['status'], number> = {
    pendente: 0,
    enviado: 1,
    recebido: 2,
    aprovado: 4,
    rejeitado: 3,
  }
  let best = pedido.status
  const fromOrc = orcamentoStatusParaPedidoRelatorio(orcamento?.status)
  if (fromOrc && rank[fromOrc] > rank[best]) best = fromOrc
  return best
}

export function pedidoRelatorioPendenteComOrcamento(
  pedido: PedidoOrcamentoRef,
  orcamento?: OrcamentoGeradoRef | null
): boolean {
  return pedidoRelatorioPendente(statusEfetivoPedidoRelatorio(pedido, orcamento))
}

export function pedidoRelatorioAprovadoComOrcamento(
  pedido: PedidoOrcamentoRef,
  orcamento?: OrcamentoGeradoRef | null
): boolean {
  return pedidoRelatorioAprovado(statusEfetivoPedidoRelatorio(pedido, orcamento))
}

/** Remove pedidos duplicados do mesmo relatório/equipamento (fica o mais avançado ou o mais recente). */
export function dedupePedidosRelatorioCliente(pedidos: PedidoOrcamentoRef[]): PedidoOrcamentoRef[] {
  const rank = (s: PedidoOrcamentoRef['status']) =>
    s === 'aprovado' ? 4 : s === 'rejeitado' ? 3 : s === 'recebido' ? 2 : s === 'enviado' ? 1 : 0
  const map = new Map<string, PedidoOrcamentoRef>()
  for (const p of pedidos) {
    const key = [
      String(p.numeroRelatorio ?? '').trim(),
      String(p.relatorioId ?? '').trim(),
      String(p.equipamentoId ?? '').trim(),
      String(p.maquinaModelo ?? '').trim(),
      String(p.numeroMaquina ?? '').trim(),
    ].join('::')
    const prev = map.get(key)
    if (!prev) {
      map.set(key, p)
      continue
    }
    if (rank(p.status) > rank(prev.status)) {
      map.set(key, p)
      continue
    }
    if (rank(p.status) === rank(prev.status) && String(p.dataGeracao) > String(prev.dataGeracao)) {
      map.set(key, p)
    }
  }
  return [...map.values()]
}

export function chaveOrcamentoRelatorioJaTemPedido(
  orc: OrcamentoGeradoRef,
  pedidos: PedidoOrcamentoRef[]
): boolean {
  if (orc.id.startsWith('rel-')) {
    const pid = orc.id.slice(4)
    if (pedidos.some((p) => p.id === pid)) return true
  }
  const num = String(orc.relatorioNumero ?? '').trim()
  if (num && pedidos.some((p) => String(p.numeroRelatorio ?? '').trim() === num)) return true
  return false
}

export function aprovarPedidosOrcamentoRelatorio(
  pedidos: PedidoOrcamentoRef[],
  opts: { relatorioId?: string; numeroRelatorio?: string }
): PedidoOrcamentoRef[] {
  const rid = String(opts.relatorioId ?? '').trim()
  const num = String(opts.numeroRelatorio ?? '').trim()
  if (!rid && !num) return pedidos
  let changed = false
  const next = pedidos.map((p) => {
    const match =
      (rid && String(p.relatorioId ?? '').trim() === rid) ||
      (num && String(p.numeroRelatorio ?? '').trim() === num)
    if (!match || p.status === 'aprovado' || p.status === 'rejeitado') return p
    changed = true
    return { ...p, status: 'aprovado' as const }
  })
  return changed ? next : pedidos
}

export function aprovarOrcamentosGeradosRelatorio(
  orcamentos: OrcamentoGeradoRef[],
  opts: { relatorioId?: string; numeroRelatorio?: string }
): OrcamentoGeradoRef[] {
  const rid = String(opts.relatorioId ?? '').trim()
  const num = String(opts.numeroRelatorio ?? '').trim()
  if (!rid && !num) return orcamentos
  let changed = false
  const next = orcamentos.map((o) => {
    const isRel =
      o.tipo === 'orcamento-relatorio' ||
      o.tipo === 'cliente-cadastrado' ||
      Boolean(o.relatorioId || o.relatorioNumero)
    if (!isRel) return o
    const match =
      (rid && String(o.relatorioId ?? '').trim() === rid) ||
      (num && String(o.relatorioNumero ?? '').trim() === num)
    if (!match) return o
    const st = o.status
    if (st === 'aprovado' || st === 'concluido' || st === 'entregue' || st === 'cancelado') return o
    changed = true
    return { ...o, status: 'aprovado' as const }
  })
  return changed ? next : orcamentos
}

export function aplicarPatchPedidoFromOrcamentoGerado(
  orc: OrcamentoGeradoRef,
  pedidos: PedidoOrcamentoRef[],
  statusOrc?: OrcamentoGeradoRef['status']
): PedidoOrcamentoRef[] {
  const novoStatus = orcamentoStatusParaPedidoRelatorio(statusOrc ?? orc.status)
  if (!novoStatus) return pedidos

  const pedidoId = orc.id.startsWith('rel-') ? orc.id.slice(4) : ''
  const numRel = String(orc.relatorioNumero ?? '').trim()
  const relId = String(orc.relatorioId ?? '').trim()
  const rank: Record<PedidoOrcamentoRef['status'], number> = {
    pendente: 0,
    enviado: 1,
    recebido: 2,
    rejeitado: 3,
    aprovado: 4,
  }

  let changed = false
  const next = pedidos.map((p) => {
    const match =
      (pedidoId && p.id === pedidoId) ||
      (numRel && String(p.numeroRelatorio ?? '').trim() === numRel) ||
      (relId && String(p.relatorioId ?? '').trim() === relId)
    if (!match) return p
    if (p.status === novoStatus) return p
    if (rank[novoStatus] < rank[p.status]) return p
    changed = true
    return { ...p, status: novoStatus }
  })
  return changed ? next : pedidos
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

/** Funde listas local/servidor sem perder orçamentos ainda não sincronizados. */
export function mergeOrcamentosGeradosArrays<T extends OrcamentoGeradoRef>(
  server: T[],
  local: T[]
): T[] {
  const map = new Map<string, T>()
  const registrar = (o: T) => {
    if (!o?.id) return
    const prev = map.get(o.id)
    if (!prev) {
      map.set(o.id, o)
      return
    }
    const tPrev = new Date(prev.dataCriacao || prev.geradoEm || 0).getTime()
    const tNew = new Date(o.dataCriacao || o.geradoEm || 0).getTime()
    map.set(o.id, tNew >= tPrev ? { ...prev, ...o } : prev)
  }
  for (const o of server) registrar(o)
  for (const o of local) registrar(o)
  return [...map.values()].sort(
    (a, b) =>
      new Date(b.dataCriacao || b.geradoEm || 0).getTime() -
      new Date(a.dataCriacao || a.geradoEm || 0).getTime()
  )
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

import {
  nomesClienteCorrespondem,
  resolverClienteIdRelatorioFlexivel,
} from '../../lib/bibliotecaRelatoriosRecovery'
import { relatorioFluxoFinanceiroNaoPago } from './devedorFlags'
import type {
  ClienteCadastroDevedorFlags,
  ClienteDevedor,
  FaturaPecasDevedorLike,
  FechamentoItemDevedorLike,
  FechamentoIvaDevedorLike,
  RelatorioParaDevedorLike,
} from './tipos'

function totaisFechamentoLiquidoComIva(
  itens: FechamentoItemDevedorLike[],
  opts?: FechamentoIvaDevedorLike | null
): { liquido: number; iva: number; comIva: number } {
  const liquido = itens.reduce(
    (s, i) => s + (i.id === 'diarias' && i.cobrarDiaria === false ? 0 : Number(i.valorTotal) || 0),
    0
  )
  const incluir = Boolean(opts?.incluirIva)
  let taxa = Number(opts?.taxaIva)
  if (!Number.isFinite(taxa) || taxa < 0) taxa = 0
  if (taxa > 100) taxa = 100
  const iva = incluir ? Math.round(liquido * (taxa / 100) * 100) / 100 : 0
  const comIva = Math.round((liquido + iva) * 100) / 100
  return { liquido, iva, comIva }
}

function parseRelatorioNumeroDataSeq(numero: string): { yyyymmdd: string; seq: number } | null {
  const m = (numero || '').trim().match(/^(\d{8})-(\d{1,4})$/i)
  if (!m) return null
  const yyyymmdd = m[1]
  const y = Number(yyyymmdd.slice(0, 4))
  const mo = Number(yyyymmdd.slice(4, 6))
  const da = Number(yyyymmdd.slice(6, 8))
  if (!Number.isFinite(y) || mo < 1 || mo > 12 || da < 1 || da > 31) return null
  const seq = parseInt(m[2], 10)
  if (!Number.isFinite(seq) || seq < 1) return null
  return { yyyymmdd, seq }
}

function relatorioTsParaOrdenar(r: RelatorioParaDevedorLike): number {
  const s = String(r.data || '').trim().slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const t = new Date(s + 'T12:00:00').getTime()
    if (!Number.isNaN(t)) return t
  }
  const parsed = parseRelatorioNumeroDataSeq(String(r.numero || ''))
  if (parsed) {
    const y = Number(parsed.yyyymmdd.slice(0, 4))
    const mo = Number(parsed.yyyymmdd.slice(4, 6)) - 1
    const da = Number(parsed.yyyymmdd.slice(6, 8))
    const t = new Date(y, mo, da).getTime()
    if (!Number.isNaN(t)) return t
  }
  return 0
}

function cmpNumeroRelatorio(a: string, b: string): number {
  return (a || '').localeCompare(b || '', undefined, { sensitivity: 'base', numeric: true })
}

function emptyDevedor(
  clienteId: string,
  clienteNome: string,
  agoraIso: string
): ClienteDevedor {
  return {
    clienteId,
    clienteNome,
    totalDevido: 0,
    totalPago: 0,
    saldoPendente: 0,
    numeroFaturasPendentes: 0,
    numeroFaturasVencidas: 0,
    ultimaAtualizacao: agoraIso,
    faturasPendentes: [],
    isDevedor: false,
    relatoriosNaoPagoCount: 0,
  }
}

export type CalcularClientesDevedoresInput = {
  faturas: FaturaPecasDevedorLike[]
  clientes: Array<{ id: string; nomeEmpresa?: string }>
  /** Relatórios de serviço + especiais já adaptados (sem duplicar ids). */
  relatoriosParaDevedor: RelatorioParaDevedorLike[]
  fechamentoFluxoFinanceiroPorRelatorioId: Record<string, unknown>
  fechamentosRelatorios: Record<string, FechamentoItemDevedorLike[] | undefined>
  fechamentoItensOmitidosPorRelatorio: Record<string, string[]>
  fechamentoIvaPorRelatorioId: Record<string, FechamentoIvaDevedorLike | undefined>
  agora?: Date
}

/** Calcula o mapa de clientes devedores (faturas de peças + fechamentos «não pago»). */
export function calcularClientesDevedores(input: CalcularClientesDevedoresInput): ClienteDevedor[] {
  const agora = input.agora ?? new Date()
  const hoje = new Date(agora)
  hoje.setHours(0, 0, 0, 0)
  const agoraIso = agora.toISOString()
  const { clientes } = input
  const devedoresMap = new Map<string, ClienteDevedor>()

  for (const fatura of input.faturas) {
    if (fatura.status !== 'pendente' && fatura.status !== 'vencida') continue
    const clienteId = fatura.clienteId
    if (!devedoresMap.has(clienteId)) {
      const cliente = clientes.find((c) => c.id === clienteId)
      devedoresMap.set(
        clienteId,
        emptyDevedor(clienteId, cliente?.nomeEmpresa || fatura.clienteNome, agoraIso)
      )
    }
    const devedor = devedoresMap.get(clienteId)!
    const isVencida = Boolean(fatura.dataVencimento && new Date(fatura.dataVencimento) < hoje)
    const diasVencido = fatura.dataVencimento
      ? Math.floor(
          (hoje.getTime() - new Date(fatura.dataVencimento).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0

    devedor.totalDevido += fatura.valorTotal
    devedor.saldoPendente += fatura.valorTotal
    devedor.numeroFaturasPendentes++
    if (isVencida) devedor.numeroFaturasVencidas++

    devedor.faturasPendentes.push({
      faturaId: fatura.id,
      numeroFatura: fatura.numeroFatura,
      numeroOS: fatura.numeroOS,
      valor: fatura.valorTotal,
      dataVencimento: fatura.dataVencimento,
      diasVencido: diasVencido > 0 ? diasVencido : undefined,
    })
  }

  for (const fatura of input.faturas) {
    if (fatura.status !== 'paga') continue
    const clienteId = fatura.clienteId
    if (!devedoresMap.has(clienteId)) continue
    const devedor = devedoresMap.get(clienteId)!
    devedor.totalPago += fatura.valorTotal
    devedor.saldoPendente = Math.max(0, devedor.saldoPendente - fatura.valorTotal)
  }

  const relatoriosNaoPagoPorCliente = new Map<string, RelatorioParaDevedorLike[]>()
  for (const rel of input.relatoriosParaDevedor) {
    if (!rel?.id) continue
    const fr = input.fechamentoFluxoFinanceiroPorRelatorioId[rel.id]
    if (!relatorioFluxoFinanceiroNaoPago(fr)) continue
    const clienteId =
      String(rel.clienteId ?? '').trim() ||
      resolverClienteIdRelatorioFlexivel(rel, clientes) ||
      clientes.find((c) =>
        nomesClienteCorrespondem(String(rel.cliente ?? ''), String(c.nomeEmpresa ?? ''))
      )?.id ||
      ''
    if (!clienteId) continue
    if (!relatoriosNaoPagoPorCliente.has(clienteId)) relatoriosNaoPagoPorCliente.set(clienteId, [])
    relatoriosNaoPagoPorCliente.get(clienteId)!.push(rel)
  }

  for (const [clienteId, rels] of relatoriosNaoPagoPorCliente.entries()) {
    if (!devedoresMap.has(clienteId)) {
      const rel0 = rels[0]
      const cliente = clientes.find((c) => c.id === clienteId)
      devedoresMap.set(
        clienteId,
        emptyDevedor(clienteId, cliente?.nomeEmpresa || rel0?.cliente || '', agoraIso)
      )
    }
    const devedorRel = devedoresMap.get(clienteId)!
    devedorRel.relatoriosNaoPagoCount = rels.length
    let valorFechamentosNaoPago = 0
    for (const rel of rels) {
      if (!rel?.id) continue
      const itensRaw = input.fechamentosRelatorios[rel.id]
      if (!Array.isArray(itensRaw) || itensRaw.length === 0) continue
      const omit = new Set(input.fechamentoItensOmitidosPorRelatorio[rel.id] || [])
      const itensVis = itensRaw.filter((i) => i?.id && !omit.has(i.id))
      valorFechamentosNaoPago += totaisFechamentoLiquidoComIva(
        itensVis,
        input.fechamentoIvaPorRelatorioId[rel.id]
      ).comIva
    }
    if (valorFechamentosNaoPago > 0) {
      devedorRel.totalDevido += valorFechamentosNaoPago
      devedorRel.saldoPendente += valorFechamentosNaoPago
    }
    const maisRecente = [...rels].sort((a, b) => {
      const ta = relatorioTsParaOrdenar(a)
      const tb = relatorioTsParaOrdenar(b)
      if (tb !== ta) return tb - ta
      return cmpNumeroRelatorio(String(b.numero ?? ''), String(a.numero ?? ''))
    })[0]
    devedorRel.ultimoRelatorioNaoPagoId = maisRecente?.id
  }

  for (const devedor of devedoresMap.values()) {
    devedor.isDevedor =
      devedor.saldoPendente > 0 || (devedor.relatoriosNaoPagoCount ?? 0) > 0
  }

  return Array.from(devedoresMap.values())
}

/** Aplica flags de dívida no cadastro de clientes (mesma quantidade de linhas). */
export function aplicarFlagsDevedorNosClientes<T extends { id: string }>(
  clientes: T[],
  novosDevedores: ClienteDevedor[]
): Array<
  T & {
    isDevedor: boolean
    saldoPendente: number
    relatoriosNaoPagoCount: number
    ultimoRelatorioDevedorId?: string
  }
> {
  return clientes.map((cliente) => {
    const devedor = novosDevedores.find((d) => d.clienteId === cliente.id)
    return {
      ...cliente,
      isDevedor: devedor?.isDevedor || false,
      saldoPendente: devedor?.saldoPendente || 0,
      relatoriosNaoPagoCount: devedor?.relatoriosNaoPagoCount ?? 0,
      ultimoRelatorioDevedorId: devedor?.ultimoRelatorioNaoPagoId,
    }
  })
}

/** Hash estável das flags de dívida — evita loop de setState. */
export function hashFlagsClientesDevedores(
  clientes: ClienteCadastroDevedorFlags[]
): string {
  return JSON.stringify(
    clientes
      .map((c) => ({
        id: c.id,
        isDevedor: c.isDevedor || false,
        saldoPendente: c.saldoPendente || 0,
        relatoriosNaoPagoCount: c.relatoriosNaoPagoCount ?? 0,
        ultimoRelatorioDevedorId: c.ultimoRelatorioDevedorId || '',
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  )
}

/**
 * Segurança anti-regressão: nunca gravar lista de clientes menor após refresh de devedores.
 */
export function refreshDevedoresListaSegura(
  clientesAtualizados: { length: number },
  clientesActuais: { length: number }
): boolean {
  return clientesAtualizados.length >= clientesActuais.length
}

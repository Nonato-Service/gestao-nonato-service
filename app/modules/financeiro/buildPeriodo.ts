import {
  filtrarFechamentoItensPorOmitidos,
  totaisFechamentoLiquidoComIva,
} from '../fechamento'
import type { FechamentoFluxoFinanceiroEntryLike } from './fluxoUi'
import {
  dataDentroPeriodoFinanceiro,
  parseDataFinanceiroParaDate,
  periodoFinanceiroFromDate,
} from './periodo'
import type {
  BuildFinanceiroPeriodoInput,
  IVAControle,
  RelatorioFinanceiro,
  TipoPeriodoFinanceiro,
} from './tiposOs'

export function buildIvaControlesFromDados(input: BuildFinanceiroPeriodoInput): IVAControle[] {
  const tipos: TipoPeriodoFinanceiro[] = ['semanal', 'mensal', 'anual']
  type Bucket = {
    tipoPeriodo: TipoPeriodoFinanceiro
    periodo: string
    dataInicio: Date
    dataFim: Date
    valorTotalVendas: number
    IVACobrado: number
    faturasVendas: string[]
  }
  const buckets = new Map<string, Bucket>()

  const add = (
    tipo: TipoPeriodoFinanceiro,
    dt: Date,
    iva: number,
    venda: number,
    faturaId?: string
  ) => {
    if (iva <= 0 && venda <= 0) return
    const { periodo, dataInicio, dataFim } = periodoFinanceiroFromDate(dt, tipo)
    const key = `${tipo}|${periodo}`
    let b = buckets.get(key)
    if (!b) {
      b = {
        tipoPeriodo: tipo,
        periodo,
        dataInicio,
        dataFim,
        valorTotalVendas: 0,
        IVACobrado: 0,
        faturasVendas: [],
      }
      buckets.set(key, b)
    }
    b.IVACobrado = Math.round((b.IVACobrado + iva) * 100) / 100
    b.valorTotalVendas = Math.round((b.valorTotalVendas + venda) * 100) / 100
    if (faturaId && !b.faturasVendas.includes(faturaId)) b.faturasVendas.push(faturaId)
  }

  for (const tipo of tipos) {
    for (const f of input.faturasPecas) {
      if (f.status === 'cancelada') continue
      const dt = parseDataFinanceiroParaDate(f.dataEmissao)
      if (!dt) continue
      add(tipo, dt, Number(f.valorIVA) || 0, Number(f.valorTotal) || 0, f.id)
    }
    for (const os of input.ordensServico) {
      if (os.status === 'cancelada') continue
      const dt = parseDataFinanceiroParaDate(os.dataFechamento || os.dataAbertura)
      if (!dt) continue
      add(tipo, dt, Number(os.valorIVA) || 0, Number(os.valorTotal) || 0)
    }
    for (const rel of input.relatoriosServico) {
      if (!input.fechamentosGuardadosBibliotecaIds.includes(rel.id)) continue
      const itens = input.fechamentosRelatorios[rel.id]
      if (!itens?.length) continue
      const vis = filtrarFechamentoItensPorOmitidos(
        input.fechamentoItensOmitidosPorRelatorio,
        rel.id,
        itens
      )
      const tot = totaisFechamentoLiquidoComIva(vis, input.fechamentoIvaPorRelatorioId[rel.id])
      if (!tot.incluir || tot.iva <= 0) continue
      const dt = parseDataFinanceiroParaDate(rel.data)
      if (!dt) continue
      add(tipo, dt, tot.iva, tot.comIva)
    }
  }

  return [...buckets.values()]
    .map((b) => {
      const IVAPago = 0
      const IVAApagar = Math.max(0, Math.round((b.IVACobrado - IVAPago) * 100) / 100)
      const status: IVAControle['status'] =
        b.IVACobrado <= 0 ? 'aberto' : IVAApagar <= 0.009 ? 'pago' : 'fechado'
      return {
        id: `iva-${b.tipoPeriodo}-${b.periodo}`,
        periodo: b.periodo,
        tipoPeriodo: b.tipoPeriodo,
        dataInicio: b.dataInicio.toISOString(),
        dataFim: b.dataFim.toISOString(),
        valorTotalVendas: b.valorTotalVendas,
        valorTotalCompras: 0,
        IVACobrado: b.IVACobrado,
        IVAPago,
        IVAApagar,
        faturasVendas: b.faturasVendas,
        faturasCompras: [],
        status,
      } satisfies IVAControle
    })
    .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())
}

export function buildRelatorioFinanceiroPeriodo(input: BuildFinanceiroPeriodoInput): RelatorioFinanceiro {
  const agora = input.agora ?? new Date()
  const { periodo, dataInicio, dataFim } = periodoFinanceiroFromDate(agora, input.tipo)

  let totalVendas = 0
  let totalIVA = 0
  let totalRecebido = 0
  let numeroOS = 0
  let numeroFaturas = 0
  let numeroFechamentosBiblioteca = 0
  let totalFechamentosBiblioteca = 0
  let ivaFechamentosBiblioteca = 0
  let recebidoFechamentosBiblioteca = 0
  let pendenteFechamentosBiblioteca = 0

  for (const os of input.ordensServico) {
    if (os.status === 'cancelada') continue
    const dt = parseDataFinanceiroParaDate(os.dataFechamento || os.dataAbertura)
    if (!dt || !dataDentroPeriodoFinanceiro(dt, dataInicio, dataFim)) continue
    numeroOS++
    totalVendas += Number(os.valorTotal) || 0
    totalIVA += Number(os.valorIVA) || 0
    if (os.status === 'concluida') totalRecebido += Number(os.valorTotal) || 0
  }

  for (const f of input.faturasPecas) {
    if (f.status === 'cancelada') continue
    const dt = parseDataFinanceiroParaDate(f.dataEmissao)
    if (!dt || !dataDentroPeriodoFinanceiro(dt, dataInicio, dataFim)) continue
    numeroFaturas++
    totalVendas += Number(f.valorTotal) || 0
    totalIVA += Number(f.valorIVA) || 0
    if (f.status === 'paga') totalRecebido += Number(f.valorTotal) || 0
  }

  for (const rel of input.relatoriosServico) {
    if (!input.fechamentosGuardadosBibliotecaIds.includes(rel.id)) continue
    const itens = input.fechamentosRelatorios[rel.id]
    if (!itens?.length) continue
    const dt = parseDataFinanceiroParaDate(rel.data)
    if (!dt || !dataDentroPeriodoFinanceiro(dt, dataInicio, dataFim)) continue
    const vis = filtrarFechamentoItensPorOmitidos(
      input.fechamentoItensOmitidosPorRelatorio,
      rel.id,
      itens
    )
    const tot = totaisFechamentoLiquidoComIva(vis, input.fechamentoIvaPorRelatorioId[rel.id])
    numeroFechamentosBiblioteca++
    totalFechamentosBiblioteca += tot.comIva
    if (tot.incluir) ivaFechamentosBiblioteca += tot.iva
    const fr = input.fechamentoFluxoFinanceiroPorRelatorioId[rel.id]
    const frObj =
      fr && typeof fr === 'object' && !Array.isArray(fr)
        ? (fr as FechamentoFluxoFinanceiroEntryLike)
        : null
    if (frObj?.pagamento === 'pago') recebidoFechamentosBiblioteca += tot.comIva
    else pendenteFechamentosBiblioteca += tot.comIva
  }

  totalVendas = Math.round(totalVendas * 100) / 100
  totalIVA = Math.round(totalIVA * 100) / 100
  totalRecebido = Math.round((totalRecebido + recebidoFechamentosBiblioteca) * 100) / 100
  totalFechamentosBiblioteca = Math.round(totalFechamentosBiblioteca * 100) / 100
  ivaFechamentosBiblioteca = Math.round(ivaFechamentosBiblioteca * 100) / 100
  recebidoFechamentosBiblioteca = Math.round(recebidoFechamentosBiblioteca * 100) / 100
  pendenteFechamentosBiblioteca = Math.round(pendenteFechamentosBiblioteca * 100) / 100

  const devedores = input.clientesDevedores.filter(
    (cd) =>
      cd.isDevedor && (cd.saldoPendente > 0 || Number(cd.relatoriosNaoPagoCount ?? 0) > 0)
  )

  return {
    id: `rel-vivo-${input.tipo}-${periodo}`,
    tipo: input.tipo,
    periodo,
    dataInicio: dataInicio.toISOString(),
    dataFim: dataFim.toISOString(),
    totalVendas,
    totalCompras: 0,
    totalRecebido,
    totalPago: recebidoFechamentosBiblioteca,
    saldo: Math.round((totalRecebido - 0) * 100) / 100,
    totalIVA: Math.round((totalIVA + ivaFechamentosBiblioteca) * 100) / 100,
    numeroOS,
    numeroFaturas,
    clientesDevedores: devedores.length,
    valorTotalDevedores: Math.round(devedores.reduce((s, d) => s + d.saldoPendente, 0) * 100) / 100,
    dataGeracao: agora.toISOString(),
    numeroFechamentosBiblioteca,
    totalFechamentosBiblioteca,
    ivaFechamentosBiblioteca,
    recebidoFechamentosBiblioteca,
    pendenteFechamentosBiblioteca,
  }
}

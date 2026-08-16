/**
 * Fechamento para cobrança do Relatório de Serviço — linhas fixas (ht, km, diárias, ida, retorno)
 * com quantidades de calcularTotais; ramo especial reutiliza buildItensFechamentoBaseRelatorioEspecial.
 */
import { calcularTotais } from '../relatorio-servico'
import type { DiaTrabalho } from '../relatorio-servico'
import {
  buildItensFechamentoBaseRelatorioEspecial,
  isRelatorioEspecialId,
  type LabelsFechamentoEspecial,
  type RelatorioEspecial,
} from '../relatorios-especiais'
import { enriquecerLinhaFechamentoComCadastro } from './linhaCadastro'
import {
  FECHAMENTO_IDS_FIXOS_TEMPLATE,
  type FechamentoItem,
  type ServicoCadastroFechamentoMin,
} from './tipos'

export type LabelsFechamentoCobrancaRelatorio = LabelsFechamentoEspecial

/** Forma mínima do relatório de serviço usada na cobrança do fechamento. */
export type RelatorioServicoCobrancaMin = {
  id: string
  diasTrabalho?: DiaTrabalho[] | null
}

export type BuildItensFechamentoBaseRelatorioOpts = {
  labels?: LabelsFechamentoCobrancaRelatorio
  servicos: ServicoCadastroFechamentoMin[]
  grupoId?: string | null
  /** Relatório especial já resolvido (prioridade sobre o getter). */
  relatorioEspecial?: RelatorioEspecial | null
  /** Lookup por id quando o relatório tem id `re-…`. */
  getRelatorioEspecial?: (id: string) => RelatorioEspecial | undefined
}

export function hhmmToDecimal(s: string): number {
  const raw = String(s ?? '').trim()
  if (!raw) return 0
  if (!raw.includes(':')) {
    const n = parseFloat(raw.replace(',', '.'))
    return Number.isFinite(n) ? n : 0
  }
  const parts = raw.split(':').map((p) => p.trim())
  const h = parseInt(parts[0], 10) || 0
  const m = parseInt(parts[1] ?? '0', 10) || 0
  return h + m / 60
}

export function minutosParaHorasDecimal(min: number | undefined): number {
  if (min == null || !Number.isFinite(min)) return 0
  return Math.round(min) / 60
}

export function quantidadesFechamentoCobrancaRelatorio(r: RelatorioServicoCobrancaMin): {
  ht: number
  km: number
  diarias: number
  hida: number
  hret: number
} {
  const dias = r.diasTrabalho || []
  const totais = calcularTotais(dias)
  return {
    ht:
      typeof totais.horasTrabalhoMinutos === 'number'
        ? minutosParaHorasDecimal(totais.horasTrabalhoMinutos)
        : hhmmToDecimal(totais.horasTrabalho),
    km: parseFloat(totais.kmsPercorridos) || 0,
    diarias: dias.length,
    hida:
      typeof totais.horasViagemIdaMinutos === 'number'
        ? minutosParaHorasDecimal(totais.horasViagemIdaMinutos)
        : hhmmToDecimal(totais.horasViagemIda),
    hret:
      typeof totais.horasViagemRetornoMinutos === 'number'
        ? minutosParaHorasDecimal(totais.horasViagemRetornoMinutos)
        : hhmmToDecimal(totais.horasViagemRetorno),
  }
}

function resolverRelatorioEspecial(
  r: RelatorioServicoCobrancaMin,
  opts: BuildItensFechamentoBaseRelatorioOpts
): RelatorioEspecial | undefined {
  if (!isRelatorioEspecialId(r.id)) return undefined
  if (opts.relatorioEspecial && opts.relatorioEspecial.id === r.id) {
    return opts.relatorioEspecial
  }
  return opts.getRelatorioEspecial?.(r.id)
}

export function buildItensFechamentoBaseRelatorio(
  r: RelatorioServicoCobrancaMin,
  opts: BuildItensFechamentoBaseRelatorioOpts
): FechamentoItem[] {
  const labels = opts.labels || {}
  const grupoId = opts.grupoId ?? null
  const servicos = opts.servicos

  const esp = resolverRelatorioEspecial(r, opts)
  if (esp) {
    const base = buildItensFechamentoBaseRelatorioEspecial(esp, labels) as FechamentoItem[]
    return base.map((item) =>
      enriquecerLinhaFechamentoComCadastro(item, servicos, undefined, grupoId)
    )
  }

  const q = quantidadesFechamentoCobrancaRelatorio(r)
  const base: FechamentoItem[] = [
    {
      id: 'ht',
      descricao: labels.horasTrabalho || 'Horas de Trabalho',
      tipoCobranca: 'hora',
      quantidade: q.ht,
      valorUnitario: 0,
      valorTotal: 0,
      origem: 'relatorio',
    },
    {
      id: 'km',
      descricao: labels.kmsPercorridos || "Km's Percorridos",
      tipoCobranca: 'km',
      quantidade: q.km,
      valorUnitario: 0,
      valorTotal: 0,
      origem: 'relatorio',
    },
    {
      id: 'diarias',
      descricao: labels.diarias || 'Diárias',
      tipoCobranca: 'diarias',
      quantidade: q.diarias,
      valorUnitario: 0,
      valorTotal: 0,
      origem: 'relatorio',
      cobrarDiaria: true,
    },
    {
      id: 'hida',
      descricao: labels.horasViagemIda || 'Horas de Viagem de Ida',
      tipoCobranca: 'hora',
      quantidade: q.hida,
      valorUnitario: 0,
      valorTotal: 0,
      origem: 'relatorio',
    },
    {
      id: 'hret',
      descricao: labels.horasViagemRetorno || 'Horas de Viagem de Retorno',
      tipoCobranca: 'hora',
      quantidade: q.hret,
      valorUnitario: 0,
      valorTotal: 0,
      origem: 'relatorio',
    },
  ]
  return base.map((item) =>
    enriquecerLinhaFechamentoComCadastro(item, servicos, undefined, grupoId)
  )
}

export function isLinhaManualFechamento(i: FechamentoItem): boolean {
  if (i.origem === 'manual') return true
  if (i.origem === 'relatorio') return false
  return !(FECHAMENTO_IDS_FIXOS_TEMPLATE as readonly string[]).includes(i.id)
}

/** Atualiza linhas fixas (horas/km/diárias) do fechamento guardado quando o relatório é editado. */
export function sincronizarItensFechamentoComRelatorioAtualizado(
  rel: RelatorioServicoCobrancaMin,
  salvosBrutos: FechamentoItem[] | undefined,
  opts: BuildItensFechamentoBaseRelatorioOpts
): FechamentoItem[] {
  const salvos = salvosBrutos || []
  const seisDoResumo = buildItensFechamentoBaseRelatorio(rel, opts)
  if (salvos.length === 0) return seisDoResumo
  const itensExtrasSalvos = salvos.filter(
    (i) =>
      isLinhaManualFechamento(i) ||
      i.id.startsWith('peca-') ||
      i.id.startsWith('m')
  )
  const grupoId = opts.grupoId ?? null
  const seisComQuantidadeDoResumo = seisDoResumo.map((item) => {
    const saved = salvos.find((s) => s.id === item.id)
    if (!saved) return item
    const cobrarDiaria =
      item.id === 'diarias' && typeof saved.cobrarDiaria === 'boolean'
        ? saved.cobrarDiaria
        : (item as FechamentoItem).cobrarDiaria !== false
    const enriched = enriquecerLinhaFechamentoComCadastro(
      {
        ...item,
        ...saved,
        id: item.id,
        quantidade: item.quantidade ?? 0,
        tipoCobranca: item.tipoCobranca,
        origem: saved.origem ?? item.origem,
      },
      opts.servicos,
      saved.servicoId,
      grupoId
    )
    return {
      ...enriched,
      cobrarDiaria: item.id === 'diarias' ? cobrarDiaria : undefined,
    }
  })
  const seisIds = ['ht', 'km', 'diarias', 'hida', 'hret']
  const comTodosSeis = seisIds
    .map(
      (id) =>
        seisComQuantidadeDoResumo.find((i) => i.id === id) ||
        seisDoResumo.find((i) => i.id === id)
    )
    .filter(Boolean) as FechamentoItem[]
  return [...comTodosSeis, ...itensExtrasSalvos].filter(
    (i) => !(i.id === 'hviagem' && i.origem === 'relatorio')
  )
}

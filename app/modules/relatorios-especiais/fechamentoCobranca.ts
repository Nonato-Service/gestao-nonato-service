/**
 * Fechamento para cobrança do Relatório Especial — mesmas linhas fixas do relatório de serviço
 * (ht, km, diárias, ida, retorno), com quantidades de calcularTotaisRelatorioEspecial.
 */
import { calcularTotaisRelatorioEspecial } from './calculos'
import type { RelatorioEspecial } from './tipos'

export type FechamentoItemBaseEspecial = {
  id: 'ht' | 'km' | 'diarias' | 'hida' | 'hret'
  descricao: string
  tipoCobranca: 'hora' | 'km' | 'diarias'
  quantidade: number
  valorUnitario: number
  valorTotal: number
  origem: 'relatorio'
  cobrarDiaria?: boolean
}

export type LabelsFechamentoEspecial = {
  horasTrabalho?: string
  kmsPercorridos?: string
  diarias?: string
  horasViagemIda?: string
  horasViagemRetorno?: string
}

export function isRelatorioEspecialId(id: string | undefined | null): boolean {
  return String(id ?? '').startsWith('re-')
}

/** Número parece Relatório Especial (prefixo E…). */
export function numeroPareceRelatorioEspecial(numero: string | undefined | null): boolean {
  return /^e/i.test(String(numero ?? '').trim())
}

export function quantidadesFechamentoCobrancaEspecial(r: RelatorioEspecial): {
  ht: number
  km: number
  diarias: number
  hida: number
  hret: number
} {
  const totais = calcularTotaisRelatorioEspecial(r.diasTrabalho)
  const minToHoras = (min: number) => Math.round(min) / 60
  return {
    ht: minToHoras(totais.horasTrabalhoTotal),
    km: totais.kmsTotal,
    diarias: totais.diarias,
    hida: minToHoras(totais.horasViagemIda),
    hret: minToHoras(totais.horasViagemRetorno),
  }
}

export function buildItensFechamentoBaseRelatorioEspecial(
  r: RelatorioEspecial,
  labels: LabelsFechamentoEspecial = {}
): FechamentoItemBaseEspecial[] {
  const q = quantidadesFechamentoCobrancaEspecial(r)
  return [
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
}

/**
 * Forma compatível com RelatorioServico para UI de fechamento / Biblioteca
 * (equipamentos, cabeçalho, peças). diasTrabalho fica vazio — quantidades vêm do helper acima.
 */
export function adaptRelatorioEspecialParaFechamentoShape(r: RelatorioEspecial) {
  const eqs = Array.isArray(r.equipamentos) ? r.equipamentos : []
  const first = eqs[0]
  const modelos = eqs
    .map((e) => String(e.maquinaModelo || '').trim())
    .filter(Boolean)
    .join(' · ')
  return {
    id: r.id,
    numero: r.numero,
    tecnico: r.tecnico,
    cliente: r.cliente,
    cidade: r.cidade,
    telefone: r.telefone,
    data: r.data,
    maquinaModelo: first?.maquinaModelo || modelos || '',
    numeroMaquina: first?.numeroMaquina || '',
    tipoServico: r.tipoServico,
    diasTrabalho: [] as [],
    horasTrabalho: r.horasTrabalho,
    kmsPercorridos: r.kmsPercorridos,
    horasViagem: r.horasViagem,
    servicoConcluido: r.servicoConcluido,
    retornoNecessario: r.retornoNecessario,
    entregaDocumentacao: r.entregaDocumentacao,
    liberacaoProducao: r.liberacaoProducao,
    instrucaoFuncionarios: r.instrucaoFuncionarios,
    necessarioTrocaPecas: r.necessarioTrocaPecas,
    pecasInstaladasSubstituidas: r.pecasInstaladasSubstituidas,
    observacoes: r.observacoes,
    pontosAberto: r.pontosAberto,
    pecasSubstituicao: r.pecasSubstituicao || [],
    pecasInstaladas: r.pecasInstaladas || [],
    equipamentoId: first?.equipamentoId,
    clienteId: r.clienteId,
    equipamentoOrigem: first?.equipamentoOrigem,
    equipamentos: eqs,
    assinaturaCliente: r.assinaturaCliente,
    dataAssinaturaCliente: r.dataAssinaturaCliente,
  }
}

export type RelatorioEspecialFechamentoShape = ReturnType<typeof adaptRelatorioEspecialParaFechamentoShape>

export function encontrarRelatorioEspecialPorOsInput(
  lista: RelatorioEspecial[],
  raw: string
): RelatorioEspecial | undefined {
  const input = String(raw || '').trim()
  if (!input) return undefined
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '')
  let hit = lista.find((r) => (r.numero || '').trim() === input)
  if (!hit) hit = lista.find((r) => norm(r.numero || '') === norm(input))
  if (!hit) {
    const apenasDig = input.replace(/\D/g, '')
    if (apenasDig.length > 0) {
      hit = lista.find((r) => {
        const d = (r.numero || '').replace(/\D/g, '')
        return d === apenasDig || (apenasDig.length >= 3 && d.includes(apenasDig))
      })
    }
  }
  return hit
}

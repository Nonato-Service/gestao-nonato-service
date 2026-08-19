import type { Agendamento } from './tipos'
import { getDatasPeriodoAgendamento, normalizeDataKeyAgenda } from './datas'
import { agendamentoStatusAtivoParaEstadoVisual } from './filtros'
import { isAgendamentoPessoal, normalizeStatusAgendamento } from './normalize'

/** Normaliza nome (cliente ou técnico) para comparação (trim + minúsculas + sem acentos). */
export function normalizeNomeAgenda(nome: string): string {
  return String(nome ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** @deprecated Preferir normalizeNomeAgenda — mantido para API estável. */
export function normalizeNomeClienteAgenda(nome: string): string {
  return normalizeNomeAgenda(nome)
}

/** Dois conjuntos de datas YYYY-MM-DD têm algum dia em comum. */
export function intervalosSobrepoem(datasA: string[], datasB: string[]): boolean {
  if (!datasA.length || !datasB.length) return false
  const setB = new Set(datasB.map((d) => normalizeDataKeyAgenda(d)).filter(Boolean))
  return datasA.some((d) => setB.has(normalizeDataKeyAgenda(d)))
}

/** Períodos dos dois agendamentos partilham pelo menos um dia. */
export function agendamentosIntervalosSobrepoem(a: Agendamento, b: Agendamento): boolean {
  return intervalosSobrepoem(getDatasPeriodoAgendamento(a), getDatasPeriodoAgendamento(b))
}

/**
 * Mesmo cliente: prioriza clienteId quando ambos têm; senão compara nome normalizado.
 * Assuntos pessoais (sem cliente) nunca são «mesmo cliente».
 */
export function mesmoClienteAgendamento(a: Agendamento, b: Agendamento): boolean {
  if (isAgendamentoPessoal(a) || isAgendamentoPessoal(b)) return false
  const idA = String(a.clienteId ?? '').trim()
  const idB = String(b.clienteId ?? '').trim()
  if (idA && idB) return idA === idB
  const nomeA = normalizeNomeAgenda(a.cliente)
  const nomeB = normalizeNomeAgenda(b.cliente)
  if (!nomeA || !nomeB) return false
  return nomeA === nomeB
}

/**
 * Mesmo técnico: compara o campo `tecnico` (nome atribuído no formulário).
 * Sem técnico ou assunto pessoal → sem match.
 */
export function mesmoTecnicoAgendamento(a: Agendamento, b: Agendamento): boolean {
  if (isAgendamentoPessoal(a) || isAgendamentoPessoal(b)) return false
  const nomeA = normalizeNomeAgenda(a.tecnico)
  const nomeB = normalizeNomeAgenda(b.tecnico)
  if (!nomeA || !nomeB) return false
  return nomeA === nomeB
}

/** Activo para regra de conflito: pendente / confirmado / em-andamento (não cancelado nem concluído). */
export function agendamentoActivoParaConflitoAgenda(ag: Agendamento): boolean {
  if (isAgendamentoPessoal(ag)) return false
  return agendamentoStatusAtivoParaEstadoVisual(ag)
}

/** Alias estável da API anterior. */
export function agendamentoActivoParaConflitoCliente(ag: Agendamento): boolean {
  return agendamentoActivoParaConflitoAgenda(ag)
}

/**
 * Procura outro agendamento activo do mesmo cliente com sobreposição de dias.
 * `excludeId` ignora o próprio registo (edição).
 */
export function encontrarConflitoClienteMesmoDia(
  candidato: Agendamento,
  existentes: Agendamento[],
  excludeId?: string
): Agendamento | null {
  if (!agendamentoActivoParaConflitoAgenda(candidato)) return null
  const skip = String(excludeId ?? candidato.id ?? '').trim()
  for (const outro of existentes) {
    if (skip && String(outro.id) === skip) continue
    if (!agendamentoActivoParaConflitoAgenda(outro)) continue
    if (!mesmoClienteAgendamento(candidato, outro)) continue
    if (agendamentosIntervalosSobrepoem(candidato, outro)) return outro
  }
  return null
}

/**
 * Procura outro agendamento activo do mesmo técnico com sobreposição de dias
 * (independente do cliente). `excludeId` ignora o próprio registo (edição).
 */
export function encontrarConflitoTecnicoMesmoDia(
  candidato: Agendamento,
  existentes: Agendamento[],
  excludeId?: string
): Agendamento | null {
  if (!agendamentoActivoParaConflitoAgenda(candidato)) return null
  if (!normalizeNomeAgenda(candidato.tecnico)) return null
  const skip = String(excludeId ?? candidato.id ?? '').trim()
  for (const outro of existentes) {
    if (skip && String(outro.id) === skip) continue
    if (!agendamentoActivoParaConflitoAgenda(outro)) continue
    if (!mesmoTecnicoAgendamento(candidato, outro)) continue
    if (agendamentosIntervalosSobrepoem(candidato, outro)) return outro
  }
  return null
}

/** Pares de agendamentos activos do mesmo cliente com dias em comum (dados legados). Sem wipe. */
export function listarParesConflitoClienteLegados(
  agendamentos: Agendamento[]
): Array<{ a: Agendamento; b: Agendamento }> {
  const activos = agendamentos.filter(agendamentoActivoParaConflitoAgenda)
  const pares: Array<{ a: Agendamento; b: Agendamento }> = []
  for (let i = 0; i < activos.length; i++) {
    for (let j = i + 1; j < activos.length; j++) {
      const a = activos[i]
      const b = activos[j]
      if (!mesmoClienteAgendamento(a, b)) continue
      if (!agendamentosIntervalosSobrepoem(a, b)) continue
      pares.push({ a, b })
    }
  }
  return pares
}

/** Pares de agendamentos activos do mesmo técnico com dias em comum (dados legados). Sem wipe. */
export function listarParesConflitoTecnicoLegados(
  agendamentos: Agendamento[]
): Array<{ a: Agendamento; b: Agendamento }> {
  const activos = agendamentos.filter(agendamentoActivoParaConflitoAgenda)
  const pares: Array<{ a: Agendamento; b: Agendamento }> = []
  for (let i = 0; i < activos.length; i++) {
    for (let j = i + 1; j < activos.length; j++) {
      const a = activos[i]
      const b = activos[j]
      if (!mesmoTecnicoAgendamento(a, b)) continue
      if (!agendamentosIntervalosSobrepoem(a, b)) continue
      pares.push({ a, b })
    }
  }
  return pares
}

/** Há conflitos legados (cliente ou técnico) — só para aviso UI, sem apagar dados. */
export function temConflitosAgendaLegados(agendamentos: Agendamento[]): boolean {
  return (
    listarParesConflitoClienteLegados(agendamentos).length > 0 ||
    listarParesConflitoTecnicoLegados(agendamentos).length > 0 ||
    listarParesTecnicoMultiploEmAndamento(agendamentos).length > 0
  )
}

/**
 * Status persistido «em-andamento» (não confundir com activo/pendente/confirmado).
 * Assuntos pessoais não contam.
 */
export function agendamentoEmAndamentoReal(ag: Agendamento): boolean {
  if (isAgendamentoPessoal(ag)) return false
  return normalizeStatusAgendamento(ag) === 'em-andamento'
}

/**
 * Um técnico = no máximo um atendimento «em-andamento» de cada vez
 * (independente de sobreposição de datas ou tipo pré/técnico).
 * `excludeId` ignora o próprio registo (edição / clique no mesmo cartão).
 */
export function encontrarConflitoTecnicoEmAndamento(
  candidato: Agendamento,
  existentes: Agendamento[],
  excludeId?: string
): Agendamento | null {
  if (!agendamentoEmAndamentoReal(candidato)) return null
  if (!normalizeNomeAgenda(candidato.tecnico)) return null
  const skip = String(excludeId ?? candidato.id ?? '').trim()
  for (const outro of existentes) {
    if (skip && String(outro.id) === skip) continue
    if (!agendamentoEmAndamentoReal(outro)) continue
    if (!mesmoTecnicoAgendamento(candidato, outro)) continue
    return outro
  }
  return null
}

/** Pares legados: mesmo técnico com dois (ou mais) «em-andamento». Sem wipe. */
export function listarParesTecnicoMultiploEmAndamento(
  agendamentos: Agendamento[]
): Array<{ a: Agendamento; b: Agendamento }> {
  const emAndamento = agendamentos.filter(agendamentoEmAndamentoReal)
  const pares: Array<{ a: Agendamento; b: Agendamento }> = []
  for (let i = 0; i < emAndamento.length; i++) {
    for (let j = i + 1; j < emAndamento.length; j++) {
      const a = emAndamento[i]
      const b = emAndamento[j]
      if (!mesmoTecnicoAgendamento(a, b)) continue
      pares.push({ a, b })
    }
  }
  return pares
}

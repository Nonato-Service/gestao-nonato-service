import type { Agendamento } from './tipos'
import { getDatasPeriodoAgendamento, normalizeDataKeyAgenda } from './datas'
import { agendamentoStatusAtivoParaEstadoVisual } from './filtros'
import { isAgendamentoPessoal } from './normalize'

/** Normaliza nome de cliente para comparação (trim + minúsculas + sem acentos). */
export function normalizeNomeClienteAgenda(nome: string): string {
  return String(nome ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
  const nomeA = normalizeNomeClienteAgenda(a.cliente)
  const nomeB = normalizeNomeClienteAgenda(b.cliente)
  if (!nomeA || !nomeB) return false
  return nomeA === nomeB
}

/** Activo para regra de conflito: pendente / confirmado / em-andamento (não cancelado nem concluído). */
export function agendamentoActivoParaConflitoCliente(ag: Agendamento): boolean {
  if (isAgendamentoPessoal(ag)) return false
  return agendamentoStatusAtivoParaEstadoVisual(ag)
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
  if (!agendamentoActivoParaConflitoCliente(candidato)) return null
  const skip = String(excludeId ?? candidato.id ?? '').trim()
  for (const outro of existentes) {
    if (skip && String(outro.id) === skip) continue
    if (!agendamentoActivoParaConflitoCliente(outro)) continue
    if (!mesmoClienteAgendamento(candidato, outro)) continue
    if (agendamentosIntervalosSobrepoem(candidato, outro)) return outro
  }
  return null
}

/** Pares de agendamentos activos do mesmo cliente com dias em comum (dados legados). Sem wipe. */
export function listarParesConflitoClienteLegados(
  agendamentos: Agendamento[]
): Array<{ a: Agendamento; b: Agendamento }> {
  const activos = agendamentos.filter(agendamentoActivoParaConflitoCliente)
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

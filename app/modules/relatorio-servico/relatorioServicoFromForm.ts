/** Validação e mapeamento puro do relatório de serviço. */

import {
  prepararRelatorioServicoEquipamentos,
  type EquipamentoArmazemIdLookup,
} from '../equipamentos/relatorio'
import { atualizarCalculosDia, calcularTotais } from './calculos'
import { normalizarDiasTrabalhoParaPersist, sortDiasTrabalhoCronologicamente } from './dias'
import type { RelatorioServico } from './relatorioServicoForm'

export type RelatorioServicoFormRequired = Pick<
  RelatorioServico,
  'tecnico' | 'cliente' | 'data' | 'numero'
>

export function relatorioServicoFormMissing(form: RelatorioServicoFormRequired): string[] {
  const missing: string[] = []
  if (!form.tecnico) missing.push('Técnico')
  if (!form.cliente) missing.push('Cliente')
  if (!form.data) missing.push('Data')
  if (!form.numero) missing.push('Número do Relatório')
  return missing
}

export function isRelatorioServicoFormValid(form: RelatorioServicoFormRequired): boolean {
  return relatorioServicoFormMissing(form).length === 0
}

export function buildRelatorioServicoFromForm(
  form: RelatorioServico,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): RelatorioServico {
  const diasRecalculados = sortDiasTrabalhoCronologicamente(
    normalizarDiasTrabalhoParaPersist(form.diasTrabalho).map((dia) => atualizarCalculosDia(dia))
  )
  const totais = calcularTotais(diasRecalculados)
  return prepararRelatorioServicoEquipamentos(
    {
      ...form,
      diasTrabalho: diasRecalculados,
      horasTrabalho: totais.horasTrabalho,
      kmsPercorridos: totais.kmsPercorridos,
      horasViagem: totais.horasViagem,
    },
    equipamentosArmazem
  )
}

export function createRelatorioServicoFromForm(
  form: RelatorioServico,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = [],
  opts?: { id?: string }
): RelatorioServico {
  return {
    ...buildRelatorioServicoFromForm(form, equipamentosArmazem),
    id: opts?.id ?? Date.now().toString(),
  }
}

export function updateRelatorioServicoFromForm(
  existing: RelatorioServico,
  form: RelatorioServico,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): RelatorioServico {
  return {
    ...buildRelatorioServicoFromForm(form, equipamentosArmazem),
    id: existing.id,
  }
}

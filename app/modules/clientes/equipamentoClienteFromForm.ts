/** Validação, duplicados e mapeamento puro do equipamento do cliente. */

import type { EquipamentoCliente } from './equipamentoClienteTipos'

export type EquipamentoClienteFromFormOpts = {
  id: string
  numeroSerie: string
}

/** Campos obrigatórios no save (tipo, modelo, marca, n.º de série). */
export function isEquipamentoClienteFormValid(
  form: Pick<EquipamentoCliente, 'tipoEquipamento' | 'modelo' | 'marca' | 'numeroSerie'>
): boolean {
  return Boolean(form.tipoEquipamento && form.modelo && form.marca && form.numeroSerie)
}

/** Monta um EquipamentoCliente novo a partir do form (sem I/O / alertas). */
export function createEquipamentoClienteFromForm(
  form: EquipamentoCliente,
  opts: EquipamentoClienteFromFormOpts
): EquipamentoCliente {
  return {
    ...form,
    numeroSerie: opts.numeroSerie,
    id: opts.id,
  }
}

/** Actualiza campos editáveis (preserva extras do existente; aplica id/série resolvidos). */
export function updateEquipamentoClienteFromForm(
  existing: EquipamentoCliente,
  form: EquipamentoCliente,
  opts: EquipamentoClienteFromFormOpts
): EquipamentoCliente {
  return {
    ...existing,
    ...form,
    id: opts.id,
    numeroSerie: opts.numeroSerie,
  }
}

/** Mesmo n.º de série noutro equipamento do mesmo cliente. */
export function equipamentoClienteSerieDuplicada(
  equipamentos: EquipamentoCliente[],
  numeroSerie: string,
  excludeIndex = -1
): boolean {
  const serialNorm = String(numeroSerie).trim()
  if (!serialNorm) return false
  return equipamentos.some((eq, i) => {
    if (excludeIndex >= 0 && i === excludeIndex) return false
    return eq != null && String(eq.numeroSerie).trim() === serialNorm
  })
}

/** Mesmo ID noutro equipamento do mesmo cliente. */
export function equipamentoClienteIdDuplicado(
  equipamentos: EquipamentoCliente[],
  idUsuario: string,
  excludeIndex = -1
): boolean {
  const id = String(idUsuario || '').trim()
  if (!id) return false
  return equipamentos.some((eq, i) => {
    if (excludeIndex >= 0 && i === excludeIndex) return false
    return String(eq.id || '').trim() === id
  })
}

/** Índice do equipamento em edição (hint de UI, senão id, senão série+tipo). */
export function resolverIndiceEquipamentoClienteEdicao(
  equipamentosList: EquipamentoCliente[],
  editing: EquipamentoCliente,
  idxHint?: number | null
): number {
  if (idxHint != null && idxHint >= 0 && idxHint < equipamentosList.length) {
    return idxHint
  }
  const idOrig = String(editing.id ?? '').trim()
  if (idOrig) {
    const byId = equipamentosList.findIndex((eq) => String(eq?.id ?? '').trim() === idOrig)
    if (byId >= 0) return byId
  }
  return equipamentosList.findIndex(
    (eq) =>
      eq != null &&
      eq.numeroSerie === editing.numeroSerie &&
      eq.tipoEquipamento === editing.tipoEquipamento
  )
}

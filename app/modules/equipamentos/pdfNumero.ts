/** Número / série do equipamento em PDFs — puro, sem I/O. */

import {
  equipamentoIdETecnicoGerado,
  resolverIdEquipamentoVisivelCliente,
} from './relatorio'

export type EquipamentoPdfNumeroLike = {
  id?: string
  numeroSerie?: string
  modelo?: string
  marca?: string
  tipoEquipamento?: string
}

/** Evita usar modelo/marca como se fosse número do equipamento. */
function valorPareceModeloOuNomeEquipamento(
  eq: { marca?: string; modelo?: string; tipoEquipamento?: string },
  valor: string
): boolean {
  const v = valor.trim().toLowerCase()
  if (!v) return true
  const mod = String(eq.modelo ?? '').trim().toLowerCase()
  const marca = String(eq.marca ?? '').trim().toLowerCase()
  const tipo = String(eq.tipoEquipamento ?? '').trim().toLowerCase()
  const combos = [
    mod,
    marca,
    [marca, mod].filter(Boolean).join(' '),
    [tipo, mod].filter(Boolean).join(' '),
    [marca, mod, tipo].filter(Boolean).join(' '),
  ]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return combos.some((c) => c === v)
}

/**
 * Número do equipamento no PDF — igual ao cadastro do cliente:
 * ID/código próprio, senão o valor do campo «Número de Série» (ex.: 0-250-71-7571).
 * Nunca usa modelo nem descrição.
 */
export function resolverNumeroEquipamentoPdf(eq?: EquipamentoPdfNumeroLike | null): string {
  if (!eq) return ''
  const idVisivel = resolverIdEquipamentoVisivelCliente(eq)
  if (idVisivel && !valorPareceModeloOuNomeEquipamento(eq, idVisivel)) return idVisivel
  const id = String(eq.id ?? '').trim()
  if (id && !equipamentoIdETecnicoGerado(id) && !valorPareceModeloOuNomeEquipamento(eq, id)) {
    return id
  }
  const serie = String(eq.numeroSerie ?? '').trim()
  if (serie && !valorPareceModeloOuNomeEquipamento(eq, serie)) return serie
  return ''
}

/** N.º de série do equipamento (campo separado do número/ID). */
export function resolverSerieEquipamentoPdf(eq?: EquipamentoPdfNumeroLike | null): string {
  if (!eq) return ''
  const serie = String(eq.numeroSerie ?? '').trim()
  if (!serie) return ''
  const codigo = resolverNumeroEquipamentoPdf(eq)
  if (codigo && serie.toLowerCase() === codigo.toLowerCase()) return ''
  return serie
}

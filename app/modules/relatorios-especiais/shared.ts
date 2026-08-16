/** Tipos partilhados mínimos (evita import circular com NonatoMainApp). */
export type PecaSubstituicao = {
  id: string
  descricao: string
  codigo: string
  quantidade: string
}

/** Data de hoje no calendário local (YYYY-MM-DD) — evita UTC de toISOString(). */
export function dataLocalHojeISO(date = new Date()): string {
  const ano = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

import type { RelatorioEspecial } from './tipos'

/** Pontuação para escolher a cópia mais completa (mais dias/horas/conteúdo). */
export function riquezaRelatorioEspecial(r: {
  diasTrabalho?: unknown[]
  equipamentos?: unknown[]
  horasTrabalho?: unknown
  numero?: unknown
  cliente?: unknown
}): number {
  let n = 0
  n += (r.diasTrabalho?.length || 0) * 1000
  n += (r.equipamentos?.length || 0) * 50
  const horas = String(r.horasTrabalho || '').trim()
  if (horas && horas !== '0:00') n += 20
  try {
    n += JSON.stringify(r).length
  } catch {
    /* ignorar */
  }
  return n
}

function normNumero(numero: unknown): string {
  return String(numero ?? '')
    .trim()
    .toUpperCase()
}

/**
 * Remove duplicados por `id` e depois por `numero` (mesmo cartão gravado várias vezes).
 * Mantém sempre a cópia mais rica — nunca lista vazia se a entrada tinha itens.
 */
export function dedupeRelatoriosEspeciais(lista: RelatorioEspecial[]): RelatorioEspecial[] {
  if (!Array.isArray(lista) || lista.length === 0) return Array.isArray(lista) ? lista : []

  const byId = new Map<string, RelatorioEspecial>()
  const semId: RelatorioEspecial[] = []
  for (const r of lista) {
    if (!r || typeof r !== 'object') continue
    const id = String(r.id ?? '').trim()
    if (!id) {
      semId.push(r)
      continue
    }
    const prev = byId.get(id)
    if (!prev || riquezaRelatorioEspecial(r) >= riquezaRelatorioEspecial(prev)) {
      byId.set(id, r)
    }
  }

  const byNumero = new Map<string, RelatorioEspecial>()
  const semNumero: RelatorioEspecial[] = []
  for (const r of [...byId.values(), ...semId]) {
    const num = normNumero(r.numero)
    if (!num) {
      semNumero.push(r)
      continue
    }
    const prev = byNumero.get(num)
    if (!prev || riquezaRelatorioEspecial(r) >= riquezaRelatorioEspecial(prev)) {
      byNumero.set(num, r)
    }
  }

  const out = [...byNumero.values(), ...semNumero]
  // Nunca devolver a lista original com buracos/null (crash em r.id no boot).
  return out.length > 0 ? out : []
}

/** Localiza relatório já existente para actualizar (por id de edição, id do form ou número). */
export function encontrarRelatorioEspecialParaUpsert(
  lista: RelatorioEspecial[],
  preparado: Pick<RelatorioEspecial, 'id' | 'numero'>,
  editandoId?: string | null
): RelatorioEspecial | undefined {
  const idEdit = String(editandoId || '').trim()
  const idForm = String(preparado.id || '').trim()
  const num = normNumero(preparado.numero)

  if (idEdit) {
    const hit = lista.find((r) => String(r.id || '').trim() === idEdit)
    if (hit) return hit
  }
  if (idForm) {
    const hit = lista.find((r) => String(r.id || '').trim() === idForm)
    if (hit) return hit
  }
  if (num) {
    return lista.find((r) => normNumero(r.numero) === num)
  }
  return undefined
}

/**
 * Guarda relatório especial: actualiza o existente (mesmo id/número) ou acrescenta só se for novo.
 * Evita criar cartão novo ao adicionar dias / guardar de novo o mesmo relatório.
 */
export function upsertRelatorioEspecialNaLista(
  lista: RelatorioEspecial[],
  preparado: RelatorioEspecial,
  editandoId?: string | null
): RelatorioEspecial[] {
  const base = Array.isArray(lista) ? lista : []
  const existente = encontrarRelatorioEspecialParaUpsert(base, preparado, editandoId)
  if (!existente) {
    return dedupeRelatoriosEspeciais([...base, preparado])
  }
  const idFinal = String(existente.id || preparado.id || '').trim() || preparado.id
  const merged: RelatorioEspecial = { ...preparado, id: idFinal }
  const alvoId = String(existente.id || '').trim()
  const next = base.map((r) => (String(r.id || '').trim() === alvoId ? merged : r))
  return dedupeRelatoriosEspeciais(next)
}

/** Código legível do cliente (ex.: NS000042) — distinto do id interno. */

export const CLIENTE_CODIGO_PREFIX = 'NS'

export function normalizarCodigoCliente(val: string | undefined | null): string {
  return String(val ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

export function parseSequenciaCodigoCliente(codigo: string): number | null {
  const norm = normalizarCodigoCliente(codigo)
  const m = norm.match(/^NS(\d{1,8})$/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  return Number.isFinite(n) ? n : null
}

export function formatarCodigoClienteSequencia(seq: number): string {
  const n = Math.max(1, Math.floor(seq))
  return `${CLIENTE_CODIGO_PREFIX}${String(n).padStart(6, '0')}`
}

export function gerarProximoCodigoCliente(
  clientes: Array<{ codigoCliente?: string; id?: string }>
): string {
  let max = 0
  for (const c of clientes) {
    const seq = parseSequenciaCodigoCliente(c.codigoCliente || '')
    if (seq != null && seq > max) max = seq
  }
  return formatarCodigoClienteSequencia(max + 1)
}

/** Atribui código a clientes antigos que ainda não têm (ordem estável por id numérico / nome). */
export function garantirCodigosClientes<T extends { id: string; nomeEmpresa?: string; codigoCliente?: string }>(
  clientes: T[]
): { lista: T[]; alterou: boolean } {
  const usados = new Set<string>()
  for (const c of clientes) {
    const norm = normalizarCodigoCliente(c.codigoCliente)
    if (norm) usados.add(norm)
  }

  let maxSeq = 0
  for (const cod of usados) {
    const seq = parseSequenciaCodigoCliente(cod)
    if (seq != null && seq > maxSeq) maxSeq = seq
  }

  const ordenados = [...clientes].sort((a, b) => {
    const na = parseInt(String(a.id || ''), 10)
    const nb = parseInt(String(b.id || ''), 10)
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
    return String(a.nomeEmpresa || '').localeCompare(String(b.nomeEmpresa || ''), 'pt-BR', {
      sensitivity: 'base',
    })
  })

  let alterou = false
  const lista = ordenados.map((c) => {
    const existente = normalizarCodigoCliente(c.codigoCliente)
    if (existente) {
      return existente === c.codigoCliente ? c : { ...c, codigoCliente: existente }
    }
    maxSeq += 1
    alterou = true
    const codigoCliente = formatarCodigoClienteSequencia(maxSeq)
    usados.add(codigoCliente)
    return { ...c, codigoCliente }
  })

  return { lista, alterou }
}

export function codigoClienteExibicao(
  cliente: { codigoCliente?: string; id?: string } | null | undefined
): string {
  if (!cliente) return '—'
  const cod = normalizarCodigoCliente(cliente.codigoCliente)
  if (cod) return cod
  const id = String(cliente.id || '').trim()
  if (!id) return '—'
  if (id.length <= 12) return id
  return `${id.slice(0, 8)}…`
}

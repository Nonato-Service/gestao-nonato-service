import type { RelatorioServicoNumeroLike } from './tipos'

export function countRelatorioIdInClientesRelatorios(
  clientes: Array<{ relatorios?: Record<string, RelatorioServicoNumeroLike[] | undefined> }>,
  relatorioId: string
): number {
  let n = 0
  for (const c of clientes) {
    const rel = c.relatorios
    if (!rel) continue
    for (const k of Object.keys(rel)) {
      const list = rel[k]
      if (!Array.isArray(list)) continue
      for (const r of list) {
        if (r.id === relatorioId) n++
      }
    }
  }
  return n
}

export function relatorioServicoMesmaChaveNegocio(
  existente: RelatorioServicoNumeroLike,
  numero: string,
  data: string,
  clienteId: string | undefined,
  clienteNome: string
): boolean {
  if (String(existente.numero ?? '').trim() !== String(numero ?? '').trim()) return false
  const normData = (s: string) => String(s ?? '').trim().slice(0, 10)
  if (normData(String(existente.data ?? '')) !== normData(data)) return false
  const idE = (existente.clienteId || '').trim()
  const idN = (clienteId || '').trim()
  if (idE && idN) return idE === idN
  return (
    String(existente.cliente ?? '').trim().toLowerCase() ===
    String(clienteNome ?? '').trim().toLowerCase()
  )
}

export function encontrarRelatorioServicoDuplicado<T extends RelatorioServicoNumeroLike>(
  lista: T[],
  numero: string,
  data: string,
  clienteId: string | undefined,
  clienteNome: string,
  excluirId?: string
): T | undefined {
  return lista.find(
    (r) =>
      (!excluirId || r.id !== excluirId) &&
      relatorioServicoMesmaChaveNegocio(r, numero, data, clienteId, clienteNome)
  )
}

export function dataIsoParaYYYYMMDDRelatorio(dataIso: string | undefined): string {
  const s = (dataIso || '').trim().slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s.replace(/-/g, '')
  }
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}${mo}${da}`
}

export function yyyymmddRelatorioValido(yyyymmdd: string): boolean {
  if (!/^\d{8}$/.test(yyyymmdd)) return false
  const y = Number(yyyymmdd.slice(0, 4))
  const mo = Number(yyyymmdd.slice(4, 6))
  const da = Number(yyyymmdd.slice(6, 8))
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return false
  const d = new Date(y, mo - 1, da)
  return d.getFullYear() === y && d.getMonth() === mo - 1 && d.getDate() === da
}

/** Número oficial: AAAAMMDD-NNN */
export function parseRelatorioServicoNumeroDataSeq(
  numero: string
): { yyyymmdd: string; seq: number } | null {
  const m = (numero || '').trim().match(/^(\d{8})-(\d{1,4})$/i)
  if (!m) return null
  const yyyymmdd = m[1]
  if (!yyyymmddRelatorioValido(yyyymmdd)) return null
  const seq = parseInt(m[2], 10)
  if (!Number.isFinite(seq) || seq < 1) return null
  return { yyyymmdd, seq }
}

export function normalizeOsNumeroRelatorio(numero: string | undefined | null): string {
  return String(numero ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

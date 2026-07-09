import { coletarRelatoriosCliente } from './clienteDetalheUtils'
import { resolverClienteIdRelatorio } from './relatorioServicoEquipamentos'

export type RelatorioServicoMin = {
  id: string
  clienteId?: string
  cliente?: string
  numero?: string
  servicoConcluido?: boolean
  [key: string]: unknown
}

export type ClienteMin = {
  id: string
  nomeEmpresa?: string
  equipamentos?: unknown[]
  relatorios?: Record<string, RelatorioServicoMin[]>
}

export type RecuperacaoRelatoriosResultado = {
  relatorios: RelatorioServicoMin[]
  adicionadosDeClientes: number
  clienteIdsReparados: number
  alterou: boolean
}

/** Normaliza nome para comparação (minúsculas, sem acentos, só alfanumérico). */
export function normalizarNomeClienteParaMatch(s: string): string {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Correspondência flexível: exacto, inclusão ou palavras-chave (ex.: «ferwood» ↔ «FERWOOD THOMAS»). */
export function nomesClienteCorrespondem(a: string, b: string): boolean {
  const na = normalizarNomeClienteParaMatch(a)
  const nb = normalizarNomeClienteParaMatch(b)
  if (!na || !nb) return false
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true
  const wa = na.split(/\s+/).filter((w) => w.length >= 3)
  const wb = nb.split(/\s+/).filter((w) => w.length >= 3)
  if (wa.length === 0 || wb.length === 0) return false
  return wa.some((x) => wb.includes(x)) || wb.some((x) => wa.includes(x))
}

/** Resolve cliente por nome com correspondência flexível (fallback após match exacto). */
export function resolverClienteIdRelatorioFlexivel(
  rel: { clienteId?: string; cliente?: string },
  clientes: { id: string; nomeEmpresa?: string }[]
): string {
  const exact = resolverClienteIdRelatorio(rel, clientes)
  if (exact && clientes.some((c) => c.id === exact)) return exact
  const nome = String(rel.cliente ?? '').trim()
  if (!nome) return exact
  const hit = clientes.find((c) => nomesClienteCorrespondem(nome, String(c.nomeEmpresa ?? '')))
  return hit?.id || exact
}

/**
 * Repõe relatórios na lista global a partir de `cliente.relatorios` e corrige `clienteId` inválido.
 * Nunca remove relatórios — só acrescenta ou repara ligações.
 */
export function recuperarRelatoriosServicoPerdidos(
  clientes: ClienteMin[],
  relatoriosServico: RelatorioServicoMin[]
): RecuperacaoRelatoriosResultado {
  const idsCliente = new Set(clientes.map((c) => c.id).filter(Boolean))
  const byId = new Map<string, RelatorioServicoMin>()
  let clienteIdsReparados = 0

  for (const r of relatoriosServico) {
    if (!r?.id) continue
    let copy = { ...r }
    const cid = String(copy.clienteId ?? '').trim()
    if (!cid || !idsCliente.has(cid)) {
      const reparado = resolverClienteIdRelatorioFlexivel(copy, clientes)
      if (reparado && idsCliente.has(reparado) && reparado !== cid) {
        copy = { ...copy, clienteId: reparado }
        clienteIdsReparados++
      }
    }
    byId.set(copy.id, copy)
  }

  let adicionadosDeClientes = 0
  for (const c of clientes) {
    const nested = coletarRelatoriosCliente(
      c.relatorios as Record<string, RelatorioServicoMin[]> | undefined
    )
    for (const rel of nested) {
      if (!rel?.id) continue
      if (byId.has(rel.id)) continue
      const reparado = resolverClienteIdRelatorioFlexivel(
        { ...rel, cliente: rel.cliente || c.nomeEmpresa, clienteId: rel.clienteId || c.id },
        clientes
      )
      byId.set(rel.id, {
        ...rel,
        clienteId: reparado || c.id,
        cliente: String(rel.cliente || c.nomeEmpresa || '').trim() || rel.cliente,
      })
      adicionadosDeClientes++
    }
  }

  const relatorios = Array.from(byId.values())
  const alterou =
    adicionadosDeClientes > 0 ||
    clienteIdsReparados > 0 ||
    relatorios.length !== relatoriosServico.length

  return { relatorios, adicionadosDeClientes, clienteIdsReparados, alterou }
}

/** Relatórios globais que não entraram em nenhuma pasta de cliente. */
export function relatoriosServicoOrfaosNaBiblioteca(
  relatoriosServico: RelatorioServicoMin[],
  idsJaIndexados: Set<string>
): RelatorioServicoMin[] {
  return relatoriosServico.filter((r) => r?.id && !idsJaIndexados.has(r.id))
}

/** Agrupa órfãos por nome de cliente para pastas na biblioteca. */
export function agruparRelatoriosOrfaosPorNome(
  orfaos: RelatorioServicoMin[]
): Map<string, RelatorioServicoMin[]> {
  const map = new Map<string, RelatorioServicoMin[]>()
  for (const r of orfaos) {
    const nome = String(r.cliente ?? '').trim() || '—'
    const key = normalizarNomeClienteParaMatch(nome) || '—'
    const arr = map.get(key) ?? []
    arr.push(r)
    map.set(key, arr)
  }
  return map
}

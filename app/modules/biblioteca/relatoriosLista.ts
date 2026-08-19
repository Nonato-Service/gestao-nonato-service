/**
 * Biblioteca de Relatórios — helpers puros (lista fechados, árvore cliente→equipamentos, busca/ordenação).
 */
import type { FechamentoItem } from '../fechamento'
import { normalizeOsNumeroRelatorio, findClienteByRelatorio } from '../relatorio-servico'
import type { RelatorioEspecial } from '../relatorios-especiais'
import { adaptRelatorioEspecialParaFechamentoShape } from '../relatorios-especiais'
import {
  nomesClienteCorrespondem,
  resolverClienteIdRelatorioFlexivel,
  relatoriosServicoOrfaosNaBiblioteca,
  agruparRelatoriosOrfaosPorNome,
  type RelatorioServicoMin,
} from './relatoriosRecovery'
import {
  equipamentosClienteParaBiblioteca,
  normalizarEquipamentosRelatorio,
  type EquipamentoArmazemIdLookup,
  resolverClienteIdRelatorio,
} from '../equipamentos'

/** Relatório de serviço mínimo para a árvore/lista da biblioteca. */
export type RelatorioServicoBibliotecaLike = {
  id: string
  clienteId?: string
  cliente?: string
  numero?: string
  servicoConcluido?: boolean
  tipoServico?: string
  tecnico?: string
  maquinaModelo?: string
  numeroMaquina?: string
  equipamentoId?: string
  equipamentos?: unknown
  [key: string]: unknown
}

export type EquipamentoClienteBibliotecaLike = {
  id?: string
  modelo?: string
  marca?: string
  numeroSerie?: string
  [key: string]: unknown
}

export type ClienteBibliotecaLike = {
  id: string
  nomeEmpresa?: string
  numeroContribuicaoFiscal?: string
  telefones?: string
  email?: string
  equipamentos?: EquipamentoClienteBibliotecaLike[]
  relatorios?: Record<string, RelatorioServicoBibliotecaLike[]>
  [key: string]: unknown
}

/** Usado também na listagem financeira (ordenar por cliente / nº OS). */
export function cmpClienteRelatorioFinanceiro(a: string, b: string): number {
  return (a || '').localeCompare(b || '', undefined, { sensitivity: 'base', numeric: true })
}

/** Alinha IDs duplicados (mesmo n.º OS) na Biblioteca — só acrescenta cópias já concluídas. */
export function repararIdsGuardadosBiblioteca(
  guardAtual: string[],
  fechamentosRelatorios: Record<string, FechamentoItem[]>,
  relatoriosServico: RelatorioServicoBibliotecaLike[]
): string[] {
  const rels = (relatoriosServico || []).filter(
    (r): r is RelatorioServicoBibliotecaLike =>
      r != null && typeof r === 'object' && String(r.id ?? '').trim() !== ''
  )
  const porId = new Map(rels.map((r) => [r.id, r]))
  const set = new Set(guardAtual)
  const normToIds = new Map<string, string[]>()
  for (const r of rels) {
    if (!r.servicoConcluido) continue
    const n = normalizeOsNumeroRelatorio(r.numero)
    if (!n) continue
    const arr = normToIds.get(n) ?? []
    arr.push(r.id)
    normToIds.set(n, arr)
  }
  for (const ids of normToIds.values()) {
    if (!ids.some((id) => set.has(id))) continue
    for (const id of ids) {
      const rel = porId.get(id)
      if (!rel?.servicoConcluido) continue
      const itens = fechamentosRelatorios[id]
      if (Array.isArray(itens) && itens.length > 0) set.add(id)
    }
  }
  return [...set]
}

/** Relatórios de serviço com fechamento guardado na biblioteca (lista global ordenada A–Z por cliente e nº). */
export function relatoriosComFechamentoNaBibliotecaOrdenados(
  relatoriosServico: RelatorioServicoBibliotecaLike[],
  clientes: ClienteBibliotecaLike[],
  fechamentosGuardadosBibliotecaIds: string[],
  fechamentosRelatorios: Record<string, FechamentoItem[]>
): RelatorioServicoBibliotecaLike[] {
  return (relatoriosServico || [])
    .filter(
      (r) =>
        r != null &&
        typeof r === 'object' &&
        Boolean(r.id) &&
        Boolean(r.clienteId) &&
        fechamentosGuardadosBibliotecaIds.includes(r.id) &&
        Array.isArray(fechamentosRelatorios[r.id]) &&
        fechamentosRelatorios[r.id]!.length > 0
    )
    .sort((a, b) => {
      const ca = clientes.find((c) => c?.id === a.clienteId)?.nomeEmpresa || a.cliente || ''
      const cb = clientes.find((c) => c?.id === b.clienteId)?.nomeEmpresa || b.cliente || ''
      const byC = cmpClienteRelatorioFinanceiro(ca, cb)
      if (byC !== 0) return byC
      return cmpClienteRelatorioFinanceiro(String(a.numero ?? ''), String(b.numero ?? ''))
    })
}

export type RelatorioFechadoBibliotecaRow = {
  relatorio: RelatorioServicoBibliotecaLike
  clienteNome: string
  itens: FechamentoItem[]
}

/** Todos os relatórios já fechados / arquivados na biblioteca — para secção «Ver» e «Editar». */
export function buildRelatoriosFechadosBibliotecaLista(
  relatoriosServico: RelatorioServicoBibliotecaLike[],
  clientes: ClienteBibliotecaLike[],
  fechamentosGuardadosBibliotecaIds: string[],
  fechamentosRelatorios: Record<string, FechamentoItem[] | undefined>,
  relatoriosEspeciais: RelatorioEspecial[] = []
): RelatorioFechadoBibliotecaRow[] {
  const idSet = new Set(fechamentosGuardadosBibliotecaIds)
  const servicoRows = (relatoriosServico || [])
    .filter((r) => r != null && typeof r === 'object' && Boolean(r.id) && idSet.has(r.id))
    .map((r) => {
      const cliente =
        clientes.find((c) => c?.id === r.clienteId) || findClienteByRelatorio(clientes, r)
      return {
        relatorio: r,
        clienteNome: String(cliente?.nomeEmpresa || r.cliente || '—').trim() || '—',
        itens: Array.isArray(fechamentosRelatorios[r.id]) ? fechamentosRelatorios[r.id]! : [],
      }
    })
  const especialRows = (relatoriosEspeciais || [])
    .filter((r) => r != null && typeof r === 'object' && Boolean(r.id) && idSet.has(r.id))
    .map((r) => {
      const adaptado = adaptRelatorioEspecialParaFechamentoShape(r) as RelatorioServicoBibliotecaLike
      const cliente =
        clientes.find((c) => c?.id === adaptado.clienteId) ||
        findClienteByRelatorio(clientes, adaptado)
      return {
        relatorio: adaptado,
        clienteNome: String(cliente?.nomeEmpresa || adaptado.cliente || '—').trim() || '—',
        itens: Array.isArray(fechamentosRelatorios[r.id]) ? fechamentosRelatorios[r.id]! : [],
      }
    })
  return [...servicoRows, ...especialRows].sort((a, b) => {
    const byC = cmpBibliotecaLocale(a.clienteNome, b.clienteNome)
    if (byC !== 0) return byC
    return cmpBibliotecaLocale(String(a.relatorio.numero ?? ''), String(b.relatorio.numero ?? ''))
  })
}

export type RelatorioFechadoBibliotecaGrupo = {
  key: string
  clienteNome: string
  rows: RelatorioFechadoBibliotecaRow[]
}

export function groupRelatoriosFechadosPorCliente(
  lista: RelatorioFechadoBibliotecaRow[]
): RelatorioFechadoBibliotecaGrupo[] {
  const map = new Map<string, RelatorioFechadoBibliotecaRow[]>()
  for (const row of lista) {
    const key = (row.clienteNome || '—').trim().toLowerCase()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(row)
  }
  return Array.from(map.entries())
    .map(([key, rows]) => ({
      key,
      clienteNome: rows[0]?.clienteNome || '—',
      rows: [...rows].sort((a, b) =>
        cmpBibliotecaLocale(String(a.relatorio.numero ?? ''), String(b.relatorio.numero ?? ''))
      ),
    }))
    .sort((a, b) => cmpBibliotecaLocale(a.clienteNome, b.clienteNome))
}

export type BibliotecaRelatoriosClienteRow = {
  cliente: ClienteBibliotecaLike
  equipamentos: Array<{
    equipamento: EquipamentoClienteBibliotecaLike
    equipamentoKey: string
    relatorios: RelatorioServicoBibliotecaLike[]
  }>
  despesas: Array<{ relatorio: RelatorioServicoBibliotecaLike; itens: FechamentoItem[] }>
}

/** Pesquisa na biblioteca: cliente, equipamento, n.º/tipo/técnico do relatório ou fechamento. */
export function bibliotecaRelatoriosRowMatchesBusca(
  row: BibliotecaRelatoriosClienteRow,
  q: string
): boolean {
  const nq = q.trim().toLowerCase()
  if (!nq) return true
  const { cliente, equipamentos, despesas } = row
  const nome = String(cliente.nomeEmpresa || '').toLowerCase()
  const nif = String(cliente.numeroContribuicaoFiscal || '').toLowerCase()
  const telefones = String(cliente.telefones || '').toLowerCase()
  const email = String(cliente.email || '').toLowerCase()
  if (nome.includes(nq) || nif.includes(nq) || telefones.includes(nq) || email.includes(nq)) return true
  if (nomesClienteCorrespondem(nq, cliente.nomeEmpresa || '')) return true
  for (const eq of equipamentos) {
    const eqLabel =
      `${eq.equipamento.modelo || ''} ${eq.equipamento.marca || ''} ${eq.equipamento.numeroSerie || ''} ${eq.equipamentoKey || ''}`.toLowerCase()
    if (eqLabel.includes(nq)) return true
    for (const rel of eq.relatorios) {
      if (
        String(rel.numero ?? '').toLowerCase().includes(nq) ||
        String(rel.tipoServico ?? '').toLowerCase().includes(nq) ||
        String(rel.tecnico ?? '').toLowerCase().includes(nq) ||
        String(rel.cliente ?? '').toLowerCase().includes(nq) ||
        String(rel.maquinaModelo ?? '').toLowerCase().includes(nq)
      )
        return true
    }
  }
  for (const { relatorio } of despesas) {
    if (
      String(relatorio.numero ?? '').toLowerCase().includes(nq) ||
      String(relatorio.cliente ?? '').toLowerCase().includes(nq) ||
      String(relatorio.maquinaModelo ?? '').toLowerCase().includes(nq)
    )
      return true
  }
  return false
}

export function cmpBibliotecaLocale(a: string, b: string): number {
  return (a || '').localeCompare(b || '', undefined, { sensitivity: 'base', numeric: true })
}

export function ordenarRelatoriosBiblioteca(
  relatorios: RelatorioServicoBibliotecaLike[]
): RelatorioServicoBibliotecaLike[] {
  return [...relatorios].sort((a, b) => {
    const byNum = cmpBibliotecaLocale(String(a.numero ?? ''), String(b.numero ?? ''))
    if (byNum !== 0) return byNum
    return cmpBibliotecaLocale(String(a.tipoServico ?? ''), String(b.tipoServico ?? ''))
  })
}

/** Cliente com pelo menos um relatório de serviço ou de despesas na biblioteca. */
export function bibliotecaRowTemConteudo(row: BibliotecaRelatoriosClienteRow): boolean {
  if (row.despesas.length > 0) return true
  return row.equipamentos.some((eq) => eq.relatorios.length > 0)
}

/** Monta a árvore cliente → equipamentos (todos os registados) → relatórios de serviço + despesas. */
export function buildBibliotecaRelatoriosPorCliente(
  clientes: ClienteBibliotecaLike[],
  relatoriosServico: RelatorioServicoBibliotecaLike[],
  fechamentosRelatorios: Record<string, FechamentoItem[] | undefined>,
  fechamentosGuardadosBibliotecaIds: string[],
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = [],
  relatoriosEspeciais: RelatorioEspecial[] = []
): BibliotecaRelatoriosClienteRow[] {
  const rows: BibliotecaRelatoriosClienteRow[] = []

  for (const cliente of clientes) {
    if (!cliente?.id) continue
    const equipMap = new Map<
      string,
      {
        equipamento: EquipamentoClienteBibliotecaLike
        equipamentoKey: string
        relatorios: RelatorioServicoBibliotecaLike[]
      }
    >()

    const putEquip = (equipamento: EquipamentoClienteBibliotecaLike, equipamentoKey: string) => {
      const key = String(equipamentoKey || '').trim()
      if (!key) return
      const rels = ordenarRelatoriosBiblioteca(
        (cliente.relatorios?.[key] || []).filter(
          (r) => r != null && typeof r === 'object' && Boolean(r.id)
        )
      )
      equipMap.set(key, { equipamento, equipamentoKey: key, relatorios: rels })
    }

    if (cliente.equipamentos?.length) {
      for (const eq of cliente.equipamentos) {
        if (!eq || typeof eq !== 'object') continue
        const key =
          String(eq.numeroSerie || '').trim() ||
          `${String(eq.modelo || '').trim()} ${String(eq.marca || '').trim()}`.trim() ||
          String(eq.id || '').trim()
        if (key) putEquip(eq, key)
      }
    }

    if (cliente.relatorios && typeof cliente.relatorios === 'object') {
      for (const equipamentoKey of Object.keys(cliente.relatorios)) {
        const key = String(equipamentoKey || '').trim()
        if (!key) continue
        if (equipMap.has(key)) {
          const entry = equipMap.get(key)!
          entry.relatorios = ordenarRelatoriosBiblioteca(cliente.relatorios[key] || [])
          continue
        }
        const equipamento =
          cliente.equipamentos?.find(
            (eq) =>
              eq.numeroSerie === key ||
              `${String(eq.modelo || '').trim()} ${String(eq.marca || '').trim()}`.trim() === key
          ) ||
          ({
            id: `legacy-${cliente.id}-${key}`,
            modelo: key,
            marca: '',
            numeroSerie: key,
          } as EquipamentoClienteBibliotecaLike)
        putEquip(equipamento, key)
      }
    }

    const equipamentos = Array.from(equipMap.values()).sort((a, b) => {
      const sa = `${a.equipamento.modelo || ''} ${a.equipamento.marca || ''} ${a.equipamento.numeroSerie || ''}`.trim()
      const sb = `${b.equipamento.modelo || ''} ${b.equipamento.marca || ''} ${b.equipamento.numeroSerie || ''}`.trim()
      return cmpBibliotecaLocale(sa, sb)
    })

    const relatoriosDoCliente = relatoriosServico.filter(
      (r) =>
        r != null &&
        typeof r === 'object' &&
        Boolean(r.id) &&
        (r.clienteId === cliente.id ||
          resolverClienteIdRelatorioFlexivel(r, clientes) === cliente.id ||
          nomesClienteCorrespondem(String(r.cliente ?? ''), String(cliente.nomeEmpresa ?? '')))
    )

    /** Garante relatórios de serviço na pasta (fonte: relatoriosServico, não só cliente.relatorios). */
    for (const rel of relatoriosDoCliente) {
      let keys = equipamentosClienteParaBiblioteca(
        normalizarEquipamentosRelatorio(rel as Parameters<typeof normalizarEquipamentosRelatorio>[0]),
        equipamentosArmazem,
        cliente.equipamentos ?? []
      )
      if (keys.length === 0) {
        const legadoSn = String(rel.numeroMaquina ?? '').trim()
        const legadoMod = String(rel.maquinaModelo ?? '').trim()
        const legadoId = String(rel.equipamentoId ?? '').trim()
        if (legadoSn) keys = [legadoSn]
        else if (legadoMod) keys = [legadoMod]
        else if (legadoId) keys = [legadoId]
        else keys = ['—']
      }

      for (const key of keys) {
        const k = String(key || '').trim() || '—'
        if (!equipMap.has(k)) {
          const equipamento =
            cliente.equipamentos?.find(
              (eq) =>
                eq.numeroSerie === k ||
                `${String(eq.modelo || '').trim()} ${String(eq.marca || '').trim()}`.trim() === k
            ) ||
            ({
              id: `bib-${cliente.id}-${k}`,
              modelo: k === '—' ? 'Equipamento' : k,
              marca: '',
              numeroSerie: k === '—' ? '' : k,
            } as EquipamentoClienteBibliotecaLike)
          equipMap.set(k, { equipamento, equipamentoKey: k, relatorios: [] })
        }
        const entry = equipMap.get(k)!
        const ja = entry.relatorios.some((item) => item.id === rel.id)
        entry.relatorios = ordenarRelatoriosBiblioteca(
          ja ? entry.relatorios.map((item) => (item.id === rel.id ? rel : item)) : [...entry.relatorios, rel]
        )
      }
    }

    const despesas: Array<{ relatorio: RelatorioServicoBibliotecaLike; itens: FechamentoItem[] }> = []
    for (const rel of relatoriosDoCliente) {
      const itens = fechamentosRelatorios[rel.id]
      if (itens && itens.length > 0 && fechamentosGuardadosBibliotecaIds.includes(rel.id)) {
        despesas.push({ relatorio: rel, itens })
      }
    }
    const especiaisDoCliente = relatoriosEspeciais.filter(
      (r) =>
        r.clienteId === cliente.id ||
        nomesClienteCorrespondem(String(r.cliente ?? ''), String(cliente.nomeEmpresa ?? ''))
    )
    for (const relEsp of especiaisDoCliente) {
      const itens = fechamentosRelatorios[relEsp.id]
      if (itens && itens.length > 0 && fechamentosGuardadosBibliotecaIds.includes(relEsp.id)) {
        if (!despesas.some((d) => d.relatorio.id === relEsp.id)) {
          despesas.push({
            relatorio: adaptRelatorioEspecialParaFechamentoShape(relEsp) as RelatorioServicoBibliotecaLike,
            itens,
          })
        }
      }
    }
    despesas.sort((a, b) =>
      cmpBibliotecaLocale(String(a.relatorio.numero ?? ''), String(b.relatorio.numero ?? ''))
    )

    rows.push({ cliente, equipamentos, despesas })
  }

  const idsIndexados = new Set<string>()
  for (const row of rows) {
    for (const eq of row.equipamentos) {
      for (const r of eq.relatorios) idsIndexados.add(r.id)
    }
    for (const d of row.despesas) idsIndexados.add(d.relatorio.id)
  }

  const orfaos = relatoriosServicoOrfaosNaBiblioteca(
    relatoriosServico as RelatorioServicoMin[],
    idsIndexados
  ) as RelatorioServicoBibliotecaLike[]
  const orfaosPorNome = agruparRelatoriosOrfaosPorNome(orfaos as RelatorioServicoMin[])
  for (const [, relsOrfaosRaw] of orfaosPorNome) {
    const relsOrfaos = relsOrfaosRaw as RelatorioServicoBibliotecaLike[]
    if (!relsOrfaos.length) continue
    const nomeOrfaos = String(relsOrfaos[0]?.cliente ?? '').trim() || 'Relatórios recuperados'
    const clienteOrfaos: ClienteBibliotecaLike = {
      id: `bib-orfaos-${nomeOrfaos.toLowerCase().replace(/\s+/g, '-').slice(0, 48)}`,
      nomeEmpresa: nomeOrfaos,
      equipamentos: [],
      relatorios: {},
    } as ClienteBibliotecaLike
    const equipMapOrfaos = new Map<
      string,
      {
        equipamento: EquipamentoClienteBibliotecaLike
        equipamentoKey: string
        relatorios: RelatorioServicoBibliotecaLike[]
      }
    >()
    for (const rel of relsOrfaos) {
      const k =
        String(rel.numeroMaquina ?? '').trim() ||
        String(rel.maquinaModelo ?? '').trim() ||
        String(rel.equipamentoId ?? '').trim() ||
        '—'
      if (!equipMapOrfaos.has(k)) {
        equipMapOrfaos.set(k, {
          equipamento: {
            id: `orph-eq-${k}`,
            modelo: k === '—' ? 'Equipamento' : k,
            marca: '',
            numeroSerie: k === '—' ? '' : k,
          } as EquipamentoClienteBibliotecaLike,
          equipamentoKey: k,
          relatorios: [],
        })
      }
      const entry = equipMapOrfaos.get(k)!
      if (!entry.relatorios.some((item) => item.id === rel.id)) {
        entry.relatorios = ordenarRelatoriosBiblioteca([...entry.relatorios, rel])
      }
    }
    const equipamentosOrfaos = Array.from(equipMapOrfaos.values())
    const despesasOrfaos: Array<{ relatorio: RelatorioServicoBibliotecaLike; itens: FechamentoItem[] }> =
      []
    for (const rel of relsOrfaos) {
      const itens = fechamentosRelatorios[rel.id]
      if (itens && itens.length > 0 && fechamentosGuardadosBibliotecaIds.includes(rel.id)) {
        despesasOrfaos.push({ relatorio: rel, itens })
      }
    }
    rows.push({ cliente: clienteOrfaos, equipamentos: equipamentosOrfaos, despesas: despesasOrfaos })
  }

  /** Relatórios especiais com fechamento na Biblioteca sem pasta de cliente indexada. */
  const especiaisOrfaos = relatoriosEspeciais.filter(
    (r) =>
      r != null &&
      typeof r === 'object' &&
      Boolean(r.id) &&
      fechamentosGuardadosBibliotecaIds.includes(r.id) &&
      Array.isArray(fechamentosRelatorios[r.id]) &&
      (fechamentosRelatorios[r.id]?.length || 0) > 0 &&
      !idsIndexados.has(r.id)
  )
  if (especiaisOrfaos.length > 0) {
    const porNome = new Map<string, RelatorioEspecial[]>()
    for (const r of especiaisOrfaos) {
      const nome = String(r.cliente || '').trim() || 'Relatórios especiais'
      const key = nome.toLowerCase()
      if (!porNome.has(key)) porNome.set(key, [])
      porNome.get(key)!.push(r)
    }
    for (const [, listaEsp] of porNome) {
      const nomeOrfaos = String(listaEsp[0]?.cliente ?? '').trim() || 'Relatórios especiais'
      const clienteOrfaos: ClienteBibliotecaLike = {
        id: `bib-orfaos-esp-${nomeOrfaos.toLowerCase().replace(/\s+/g, '-').slice(0, 48)}`,
        nomeEmpresa: nomeOrfaos,
        equipamentos: [],
        relatorios: {},
      } as ClienteBibliotecaLike
      const despesasOrfaos = listaEsp.map((r) => ({
        relatorio: adaptRelatorioEspecialParaFechamentoShape(r) as RelatorioServicoBibliotecaLike,
        itens: fechamentosRelatorios[r.id] || [],
      }))
      rows.push({ cliente: clienteOrfaos, equipamentos: [], despesas: despesasOrfaos })
      for (const r of listaEsp) idsIndexados.add(r.id)
    }
  }

  rows.sort((x, y) => cmpBibliotecaLocale(x.cliente.nomeEmpresa || '', y.cliente.nomeEmpresa || ''))
  return rows
}

export function equipamentosClienteDoRelatorioDespesas(
  rel: { clienteId?: string; cliente?: string },
  clientes: ClienteBibliotecaLike[]
): EquipamentoClienteBibliotecaLike[] {
  const cid = rel.clienteId || resolverClienteIdRelatorio(rel, clientes)
  return clientes.find((c) => c.id === cid)?.equipamentos ?? []
}

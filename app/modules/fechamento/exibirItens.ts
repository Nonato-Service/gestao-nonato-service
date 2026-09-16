/**
 * Helpers de UI para exibir itens do fechamento (cobrança).
 * Semântica de quantidade: edição do utilizador prevalece, mas 0 guardado
 * não bloqueia qty nova do relatório (`??` não trata 0 — regressão típica pós-v430).
 */
import { enriquecerLinhaFechamentoComCadastro, filtrarServicosCadastroPorGrupo } from './linhaCadastro'
import { isLinhaManualFechamento } from './cobrancaRelatorio'
import { tipoLinhaFechamentoFixa } from './tipos'
import type { FechamentoItem, ServicoCadastroFechamentoMin } from './tipos'

export type LabelsLinhaFechamentoFixa = {
  horasTrabalho?: string
  kmsPercorridos?: string
  diarias?: string
  horasViagemIda?: string
  horasViagemRetorno?: string
}

export type BuildItensFechamentoParaExibirOpts = {
  servicos: ServicoCadastroFechamentoMin[]
  grupoId?: string | null
}

/**
 * Quantidade na tabela: edição guardada prevalece; se o guardado ficou 0
 * (fechamento aberto antes de haver horas/km) e o resumo já tem qty > 0, usa o resumo.
 */
export function resolverQuantidadeLinhaFechamentoExibir(
  savedQty: number | undefined | null,
  qtyDoResumo: number | undefined | null
): number {
  const fromReport =
    typeof qtyDoResumo === 'number' && Number.isFinite(qtyDoResumo) ? qtyDoResumo : 0
  if (typeof savedQty !== 'number' || !Number.isFinite(savedQty)) return fromReport
  if (savedQty === 0 && fromReport > 0) return fromReport
  return savedQty
}

/**
 * Monta a lista para a tabela de cobrança a partir do guardado + base do resumo.
 * Quantidade: edição do utilizador prevalece, com cura de 0 obsoleto vs resumo.
 * Diferente de `sincronizarItensFechamentoComRelatorioAtualizado`, que força qty do resumo.
 */
export function buildItensFechamentoParaExibirFromSalvos(
  salvosBrutos: FechamentoItem[] | undefined,
  baseDoResumo: FechamentoItem[],
  opts: BuildItensFechamentoParaExibirOpts
): FechamentoItem[] {
  const salvos = salvosBrutos || []
  const seisDoResumo = baseDoResumo
  const itensManuaisSalvos = salvos.filter(isLinhaManualFechamento)
  if (salvos.length === 0) return [...seisDoResumo, ...itensManuaisSalvos]

  const grupoId = opts.grupoId ?? null
  const seisComQuantidadeDoResumo = seisDoResumo.map((item) => {
    const saved = salvos.find((s) => s.id === item.id)
    if (!saved) return item
    const cobrarDiaria =
      tipoLinhaFechamentoFixa(item.id) === 'diarias' && typeof saved.cobrarDiaria === 'boolean'
        ? saved.cobrarDiaria
        : (item as FechamentoItem).cobrarDiaria !== false
    const enriched = enriquecerLinhaFechamentoComCadastro(
      {
        ...item,
        ...saved,
        id: item.id,
        quantidade: String(item.grupoKey || '').trim()
          ? item.quantidade
          : resolverQuantidadeLinhaFechamentoExibir(saved.quantidade, item.quantidade),
        tipoCobranca: item.tipoCobranca,
        origem: saved.origem ?? item.origem,
        grupoKey: item.grupoKey ?? saved.grupoKey,
        grupoLabel: item.grupoLabel ?? saved.grupoLabel,
      },
      opts.servicos,
      saved.servicoId,
      grupoId
    )
    return {
      ...enriched,
      cobrarDiaria: tipoLinhaFechamentoFixa(item.id) === 'diarias' ? cobrarDiaria : undefined,
    }
  })
  const comTodosSeis = seisDoResumo.map(
    (baseItem) =>
      seisComQuantidadeDoResumo.find((i) => i.id === baseItem.id) || baseItem
  )
  return [...comTodosSeis, ...itensManuaisSalvos].filter(
    (i) => !(i.id === 'hviagem' && i.origem === 'relatorio')
  )
}

export function labelLinhaFechamentoFixa(
  id: string,
  labels: LabelsLinhaFechamentoFixa | Record<string, string | undefined> = {}
): string {
  const tx = labels as LabelsLinhaFechamentoFixa
  const tipo = tipoLinhaFechamentoFixa(id) || id
  if (tipo === 'ht') return tx.horasTrabalho || 'HT'
  if (tipo === 'km') return tx.kmsPercorridos || 'KM'
  if (tipo === 'diarias') return tx.diarias || 'Diárias'
  if (tipo === 'hida') return tx.horasViagemIda || 'Ida'
  if (tipo === 'hret') return tx.horasViagemRetorno || 'Retorno'
  return id
}

export function codFallbackLinhaFechamentoFixa(id: string): string {
  const tipo = tipoLinhaFechamentoFixa(id)
  if (tipo === 'ht') return 'HT'
  if (tipo === 'km') return 'KM'
  if (tipo === 'diarias') return 'DIAR'
  if (tipo === 'hida') return 'H.Ida'
  if (tipo === 'hret') return 'H.Ret'
  if (id === 'hviagem') return 'H.Viag'
  return ''
}

export type GrupoItensFechamentoExibir = {
  grupoKey: string
  grupoLabel: string
  itens: FechamentoItem[]
}

/** Junta linhas do fechamento pelo cliente de trabalho (relatório especial). */
export function agruparItensFechamentoPorCliente(itens: FechamentoItem[]): GrupoItensFechamentoExibir[] {
  const UNG = '__ungrouped__'
  const order: string[] = []
  const map = new Map<string, GrupoItensFechamentoExibir>()
  for (const item of itens || []) {
    const key = String(item.grupoKey || '').trim() || UNG
    if (!map.has(key)) {
      order.push(key)
      map.set(key, {
        grupoKey: key === UNG ? '' : key,
        grupoLabel: String(item.grupoLabel || '').trim(),
        itens: [],
      })
    }
    const g = map.get(key)!
    if (!g.grupoLabel && item.grupoLabel) g.grupoLabel = String(item.grupoLabel).trim()
    g.itens.push(item)
  }
  const grouped = order.filter((k) => k !== UNG).map((k) => map.get(k)!)
  const ung = map.get(UNG)
  return ung ? [...grouped, ung] : grouped
}

function servicoElegivelAnexarManualFechamento(s: ServicoCadastroFechamentoMin): boolean {
  const cat = String(s?.categoria || '').trim().toLowerCase()
  if (cat === 'despesa') return true
  const tipo = String(s?.tipoCobranca || '').trim().toLowerCase()
  return tipo === 'extras' || tipo === 'unidade' || tipo === 'valor-fixo'
}

function unirOpcoesServicoFechamentoUnicas(
  a: ServicoCadastroFechamentoMin[],
  b: ServicoCadastroFechamentoMin[]
): ServicoCadastroFechamentoMin[] {
  const seen = new Set<string>()
  const out: ServicoCadastroFechamentoMin[] = []
  for (const s of [...a, ...b]) {
    if (!s || typeof s.id !== 'string' || !s.id || seen.has(s.id)) continue
    seen.add(s.id)
    out.push(s)
  }
  return out
}

/** Opções do select de serviço por linha do fechamento (filtro puro). */
export function filtrarOpcoesServicoLinhaFechamento(
  item: FechamentoItem,
  servicos: ServicoCadastroFechamentoMin[],
  grupoId?: string | null
): ServicoCadastroFechamentoMin[] {
  const list = Array.isArray(servicos)
    ? servicos.filter((s): s is ServicoCadastroFechamentoMin => !!s && typeof s === 'object')
    : []
  const pool = filtrarServicosCadastroPorGrupo(list, grupoId)
  const txt = (s: ServicoCadastroFechamentoMin) =>
    ((s.nome || '') + ' ' + (s.descricao || '')).toLowerCase()
  const tipo = tipoLinhaFechamentoFixa(item.id)
  if (tipo === 'hida') {
    return pool.filter(
      (s) => s.tipoCobranca === 'hora' || (/viagem/.test(txt(s)) && /ida/.test(txt(s)))
    )
  }
  if (tipo === 'hret') {
    return pool.filter(
      (s) => s.tipoCobranca === 'hora' || (/viagem/.test(txt(s)) && /retorno/.test(txt(s)))
    )
  }
  if (item.tipoCobranca === 'hora') return pool.filter((s) => s.tipoCobranca === 'hora')
  if (item.tipoCobranca === 'km') return pool.filter((s) => s.tipoCobranca === 'km')
  if (item.tipoCobranca === 'diarias') return pool.filter((s) => s.tipoCobranca === 'diarias')
  /** Linha manual / extras: grupo actual + despesas (unidade, extras, valor-fixo) de qualquer grupo. */
  return unirOpcoesServicoFechamentoUnicas(
    pool,
    list.filter(servicoElegivelAnexarManualFechamento)
  )
}

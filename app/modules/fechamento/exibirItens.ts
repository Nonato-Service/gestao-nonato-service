/**
 * Helpers de UI para exibir itens do fechamento (cobrança).
 * Semântica de quantidade: edição do utilizador prevalece, mas 0 guardado
 * não bloqueia qty nova do relatório (`??` não trata 0 — regressão típica pós-v430).
 */
import { enriquecerLinhaFechamentoComCadastro, filtrarServicosCadastroPorGrupo } from './linhaCadastro'
import { isLinhaManualFechamento } from './cobrancaRelatorio'
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
      item.id === 'diarias' && typeof saved.cobrarDiaria === 'boolean'
        ? saved.cobrarDiaria
        : (item as FechamentoItem).cobrarDiaria !== false
    const enriched = enriquecerLinhaFechamentoComCadastro(
      {
        ...item,
        ...saved,
        id: item.id,
        quantidade: resolverQuantidadeLinhaFechamentoExibir(saved.quantidade, item.quantidade),
        tipoCobranca: item.tipoCobranca,
        origem: saved.origem ?? item.origem,
      },
      opts.servicos,
      saved.servicoId,
      grupoId
    )
    return {
      ...enriched,
      cobrarDiaria: item.id === 'diarias' ? cobrarDiaria : undefined,
    }
  })
  const seisIds = ['ht', 'km', 'diarias', 'hida', 'hret']
  const comTodosSeis = seisIds
    .map(
      (id) =>
        seisComQuantidadeDoResumo.find((i) => i.id === id) ||
        seisDoResumo.find((i) => i.id === id)
    )
    .filter(Boolean) as FechamentoItem[]
  return [...comTodosSeis, ...itensManuaisSalvos].filter(
    (i) => !(i.id === 'hviagem' && i.origem === 'relatorio')
  )
}

export function labelLinhaFechamentoFixa(
  id: string,
  labels: LabelsLinhaFechamentoFixa | Record<string, string | undefined> = {}
): string {
  const tx = labels as LabelsLinhaFechamentoFixa
  if (id === 'ht') return tx.horasTrabalho || 'HT'
  if (id === 'km') return tx.kmsPercorridos || 'KM'
  if (id === 'diarias') return tx.diarias || 'Diárias'
  if (id === 'hida') return tx.horasViagemIda || 'Ida'
  if (id === 'hret') return tx.horasViagemRetorno || 'Retorno'
  return id
}

/** Opções do select de serviço por linha do fechamento (filtro puro). */
export function filtrarOpcoesServicoLinhaFechamento(
  item: FechamentoItem,
  servicos: ServicoCadastroFechamentoMin[],
  grupoId?: string | null
): ServicoCadastroFechamentoMin[] {
  const pool = filtrarServicosCadastroPorGrupo(servicos, grupoId)
  const txt = (s: ServicoCadastroFechamentoMin) =>
    ((s.nome || '') + ' ' + (s.descricao || '')).toLowerCase()
  if (item.id === 'hida') {
    return pool.filter(
      (s) => s.tipoCobranca === 'hora' || (/viagem/.test(txt(s)) && /ida/.test(txt(s)))
    )
  }
  if (item.id === 'hret') {
    return pool.filter(
      (s) => s.tipoCobranca === 'hora' || (/viagem/.test(txt(s)) && /retorno/.test(txt(s)))
    )
  }
  if (item.tipoCobranca === 'hora') return pool.filter((s) => s.tipoCobranca === 'hora')
  if (item.tipoCobranca === 'km') return pool.filter((s) => s.tipoCobranca === 'km')
  if (item.tipoCobranca === 'diarias') return pool.filter((s) => s.tipoCobranca === 'diarias')
  return pool
}

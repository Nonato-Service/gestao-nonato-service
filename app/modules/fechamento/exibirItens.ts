/**
 * Helpers de UI para exibir itens do fechamento (cobrança).
 * Semântica de quantidade: preserva `saved.quantidade ?? item` (NÃO força qty do resumo como no sync).
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
 * Monta a lista para a tabela de cobrança a partir do guardado + base do resumo.
 * Quantidade: `saved.quantidade ?? item.quantidade` (edição do utilizador prevalece).
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
        quantidade: saved.quantidade ?? item.quantidade ?? 0,
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

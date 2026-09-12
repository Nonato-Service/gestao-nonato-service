/** Relatório de serviço no histórico do equipamento do cliente (hub). */

export type RelatorioEquipamentoHistorico = {
  id: string
  numero: string
  data: string
  tecnico: string
  tipoServico?: string
  pecasSubstituicao?: Array<{ codigo: string; descricao: string; quantidade: number | string }>
  pecasInstaladas?: Array<{ codigo: string; descricao: string; quantidade: number | string }>
  servicoConcluido?: boolean
  necessarioTrocaPecas?: boolean
  pecasInstaladasSubstituidas?: boolean
}

/** Vista do hub: filtra secções sem perder dados. */
export type ClienteEquipamentoHistVista = 'todas' | 'relatorios' | 'pecas' | 'orcamentos' | 'timeline'

export function relatorioTemPecas(rel: RelatorioEquipamentoHistorico): boolean {
  const subs = rel.pecasSubstituicao?.length ?? 0
  const inst = rel.pecasInstaladas?.length ?? 0
  return subs > 0 || inst > 0 || Boolean(rel.necessarioTrocaPecas || rel.pecasInstaladasSubstituidas)
}

export function todasPecasRelatorio(rel: RelatorioEquipamentoHistorico) {
  const list = [...(rel.pecasInstaladas ?? []), ...(rel.pecasSubstituicao ?? [])]
  const map = new Map<string, { codigo: string; descricao: string; quantidade: number | string }>()
  for (const p of list) {
    const key = `${p.codigo}::${p.descricao}`
    const prev = map.get(key)
    if (!prev) {
      map.set(key, { ...p })
      continue
    }
    const qPrev = parseFloat(String(prev.quantidade)) || 0
    const qNew = parseFloat(String(p.quantidade)) || 0
    map.set(key, { ...prev, quantidade: qPrev + qNew })
  }
  return [...map.values()]
}

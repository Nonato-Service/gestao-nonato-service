/** Opções de grupo de tarifas no botão «Tipo de cobrança» do relatório. */

import { formatServicoValorExibicao } from './servicoValor'
import { ordenarServicoGrupos, type ServicoCadastroGrupo } from './grupos'
import type { ServicoCadastroItem } from './servicoCadastroTipos'

export type RelatorioCobrancaGrupoMin = {
  id: string
  nome: string
  httLabel?: string
}

function servicoEhHttCobranca(s: ServicoCadastroItem): boolean {
  return (
    /^(HT|HTT)$/i.test(String(s.cod || '').trim()) ||
    /trabalh/i.test(`${s.nome || ''} ${s.descricao || ''}`.toLowerCase())
  )
}

export function buildRelatorioCobrancaGruposOpcoes(
  grupos: ServicoCadastroGrupo[],
  servicos: ServicoCadastroItem[]
): RelatorioCobrancaGrupoMin[] {
  return ordenarServicoGrupos(grupos).map((g) => {
    const htt = servicos.find((s) => s.grupoId === g.id && servicoEhHttCobranca(s))
    const httVal = htt ? formatServicoValorExibicao(htt.valor) : null
    return {
      id: g.id,
      nome: g.nome,
      httLabel: httVal != null ? `HTT ${httVal} €` : undefined,
    }
  })
}

export function rotuloRelatorioCobrancaGrupoOption(g: RelatorioCobrancaGrupoMin): string {
  return g.httLabel ? `${g.nome} — ${g.httLabel}` : g.nome
}

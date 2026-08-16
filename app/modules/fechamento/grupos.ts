/** Grupos de tarifa no cadastro de serviços (fechamento). */

export type ServicoCadastroGrupo = {
  id: string
  nome: string
  ordem: number
}

export const DEFAULT_SERVICO_GRUPO_ID = 'servico-grupo-geral'

export function ordenarServicoGrupos(grupos: ServicoCadastroGrupo[]): ServicoCadastroGrupo[] {
  return [...grupos].sort((a, b) => (a.ordem !== b.ordem ? a.ordem - b.ordem : a.nome.localeCompare(b.nome)))
}

export function nomeGrupoTarifaServico(servicoGrupos: ServicoCadastroGrupo[], grupoId?: string): string {
  if (!grupoId) return ''
  return servicoGrupos.find((g) => g.id === grupoId)?.nome || ''
}

/**
 * Legado: `nome` = "COD-DESCRIÇÃO" (ex.: HTT-HORA TECNICA TRABALHADA) sem `cod` →
 * `cod`, `nome` em formato título a partir do texto após o hífen e `descricao` em maiúsculas (se ainda vazia).
 */
export function migrarServicoLegacyCodNomeDesc<
  T extends {
    id: string
    cod?: string
    nome: string
    descricao?: string
    valor: number
    tipoCobranca: 'unidade' | 'km' | 'hora' | 'valor-fixo' | 'diarias' | 'extras'
    categoria: 'servico' | 'despesa'
    grupoId?: string
  }
>(s: T): { row: T; touched: boolean } {
  const codExistente = (typeof s.cod === 'string' ? s.cod : '').trim()
  if (codExistente) return { row: s, touched: false }
  const nome = (s.nome || '').trim()
  const m = nome.match(/^([A-Za-z0-9]{2,8})[-–]\s*(.+)$/)
  if (!m) return { row: s, touched: false }
  const cod = m[1].toUpperCase()
  const tail = m[2].trim()
  if (!tail) return { row: s, touched: false }
  const descTrim = typeof s.descricao === 'string' ? s.descricao.trim() : ''
  const descricao = descTrim || tail.toUpperCase()
  const nomeNovo = tail
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  return { row: { ...s, cod, nome: nomeNovo, descricao } as T, touched: true }
}

/** Tipos partilhados do módulo Fechamento (cobrança / tarifas). */

export type ServicoCadastroFechamentoMin = {
  id: string
  cod?: string
  nome: string
  descricao?: string
  valor: number
  tipoCobranca: string
  categoria?: string
  grupoId?: string
}

/** Item de cobrança no fechamento de um relatório (vinculado ao Cadastro de Serviços). */
export type FechamentoItem = {
  id: string
  descricao: string
  cod?: string
  servicoId?: string
  tipoCobranca: 'hora' | 'km' | 'valor-fixo' | 'unidade' | 'diarias' | 'extras'
  quantidade: number
  valorUnitario: number
  valorTotal: number
  origem?: 'relatorio' | 'manual'
  /** Nota curta visível para o cliente (itens manuais / peças sem orçamento) */
  infoAdicional?: string
  /** Apenas para item Diárias: false = não cobrar diária ao cliente (Sim/Não) */
  cobrarDiaria?: boolean
  /** Relatório especial: chave do cliente (trabalho) neste bloco. */
  grupoKey?: string
  /** Relatório especial: «Cliente · equipamento(s)» para cabeçalho / PDF. */
  grupoLabel?: string
}

export const FECHAMENTO_IDS_FIXOS_TEMPLATE = ['ht', 'km', 'diarias', 'hida', 'hret'] as const

export type FechamentoLinhaIdFixo = (typeof FECHAMENTO_IDS_FIXOS_TEMPLATE)[number]

const FECHAMENTO_LINHA_FIXA_SET = new Set<string>(FECHAMENTO_IDS_FIXOS_TEMPLATE)

/** `ht` ou `ht__g_p` / `km__g_c_123` (fechamento especial por cliente). */
export function tipoLinhaFechamentoFixa(id: string | undefined | null): FechamentoLinhaIdFixo | null {
  const raw = String(id ?? '').trim()
  if (!raw) return null
  if (FECHAMENTO_LINHA_FIXA_SET.has(raw)) return raw as FechamentoLinhaIdFixo
  const m = raw.match(/^(ht|km|diarias|hida|hret)__g_/)
  return m ? (m[1] as FechamentoLinhaIdFixo) : null
}

export function isLinhaFechamentoFixaId(id: string | undefined | null): boolean {
  return tipoLinhaFechamentoFixa(id) != null
}

export function grupoKeyLinhaFechamento(id: string | undefined | null): string | null {
  const m = String(id ?? '').trim().match(/^(?:ht|km|diarias|hida|hret)__g_(.+)$/)
  return m ? m[1] : null
}

export function idLinhaFechamentoGrupo(tipo: FechamentoLinhaIdFixo, grupoKey: string): string {
  const g = String(grupoKey || '').trim()
  if (!g) return tipo
  return `${tipo}__g_${g}`
}

/** Diária marcada para não cobrar — o valor não entra no total. */
export function linhaFechamentoOmiteCobrar(item: {
  id?: string
  cobrarDiaria?: boolean
}): boolean {
  return tipoLinhaFechamentoFixa(item?.id) === 'diarias' && item?.cobrarDiaria === false
}

/** Utilitários partilhados — cadastro de serviços / grupos de tarifa. */

export type { ServicoCadastroGrupo } from '../modules/fechamento'
export {
  DEFAULT_SERVICO_GRUPO_ID,
  ordenarServicoGrupos,
  nomeGrupoTarifaServico,
  migrarServicoLegacyCodNomeDesc,
} from '../modules/fechamento'

export type ServicoCadastroItem = {
  id: string
  grupoId: string
  cod?: string
  nome: string
  descricao?: string
  valor: number
  tipoCobranca: 'unidade' | 'km' | 'hora' | 'valor-fixo' | 'diarias' | 'extras'
  categoria: 'servico' | 'despesa'
}

export const TEMPLATE_SERVICOS_PADRAO: Omit<ServicoCadastroItem, 'id' | 'grupoId'>[] = [
  { cod: 'HTT', nome: 'Hora técnica trabalhada', descricao: 'HORA TECNICA TRABALHADA', valor: 0, tipoCobranca: 'hora', categoria: 'servico' },
  { cod: 'HVI', nome: 'Horas viagem de ida', descricao: 'HORA VIAGEM DE IDA', valor: 0, tipoCobranca: 'hora', categoria: 'servico' },
  { cod: 'HVR', nome: 'Horas viagem de retorno', descricao: 'HORA VIAGEM DE RETORNO', valor: 0, tipoCobranca: 'hora', categoria: 'servico' },
  { cod: 'KRC', nome: 'Kilómetro rodado / cliente', descricao: 'KILOMETRO RODADO / CLIENTE', valor: 0, tipoCobranca: 'km', categoria: 'servico' },
  { cod: 'DFC', nome: 'Diárias fixas combinadas', descricao: 'DIARIAS FIXAS COMBINADAS', valor: 0, tipoCobranca: 'diarias', categoria: 'servico' },
  { cod: 'DDT', nome: 'Despesa diária do técnico', descricao: 'DESPESA DIARIA DO TECNICO', valor: 0, tipoCobranca: 'diarias', categoria: 'despesa' },
  { cod: 'DDH', nome: 'Despesas de hospedagem', descricao: 'DESPESAS DE HOSPEDAGEM', valor: 0, tipoCobranca: 'diarias', categoria: 'despesa' },
  { cod: 'DCC', nome: 'Despesas com combustível', descricao: 'DESPESAS COM COMBUSTIVEL', valor: 0, tipoCobranca: 'extras', categoria: 'despesa' },
]

const COD_ORDEM_PADRAO = ['HTT', 'HVI', 'HVR', 'KRC', 'DFC', 'DDT', 'DDH', 'DCC']

export function formatServicoValorExibicao(v: unknown): string {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '0').replace(',', '.'))
  if (Number.isNaN(n)) return '0,00'
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function servicoCodParaExibicao(s: { cod?: string; nome: string }): string {
  const c = (typeof s.cod === 'string' ? s.cod : '').trim()
  if (c) return c
  const m = (s.nome || '').trim().match(/^([A-Za-z0-9]{2,8})[-–]/)
  return m ? m[1].toUpperCase() : ''
}

export function labelTipoCobranca(
  tipo: ServicoCadastroItem['tipoCobranca'],
  safeT: Record<string, string | undefined>
): string {
  const map: Record<ServicoCadastroItem['tipoCobranca'], string | undefined> = {
    unidade: safeT.tipoCobrancaUnidade,
    km: safeT.tipoCobrancaKm,
    hora: safeT.tipoCobrancaHora,
    'valor-fixo': safeT.tipoCobrancaValorFixo,
    diarias: safeT.tipoCobrancaDiarias,
    extras: safeT.tipoCobrancaExtras,
  }
  return map[tipo] || tipo
}

export function labelCategoria(cat: ServicoCadastroItem['categoria'], safeT: Record<string, string | undefined>): string {
  return cat === 'despesa' ? safeT.despesa || 'DESPESA' : safeT.servico || 'SERVIÇO'
}

export function coletarCodigosMatriz(servicos: ServicoCadastroItem[]): string[] {
  const set = new Set<string>()
  servicos.forEach((s) => {
    const cod = servicoCodParaExibicao(s)
    if (cod) set.add(cod.toUpperCase())
  })
  const list = Array.from(set)
  list.sort((a, b) => {
    const ia = COD_ORDEM_PADRAO.indexOf(a)
    const ib = COD_ORDEM_PADRAO.indexOf(b)
    if (ia >= 0 && ib >= 0) return ia - ib
    if (ia >= 0) return -1
    if (ib >= 0) return 1
    return a.localeCompare(b)
  })
  return list
}

export function servicoPorCodNoGrupo(
  servicos: ServicoCadastroItem[],
  grupoId: string,
  cod: string
): ServicoCadastroItem | undefined {
  const c = cod.toUpperCase()
  return servicos.find((s) => s.grupoId === grupoId && servicoCodParaExibicao(s).toUpperCase() === c)
}

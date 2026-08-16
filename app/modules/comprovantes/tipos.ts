/** Tipo de despesa/comprovante (cliente ou pessoal NONATO SERVICE). */
export type ComprovanteDespesa = {
  id: string
  /** cliente = despesa por cliente; pessoal = Despesas da NONATO SERVICE (campo interno) */
  tipo: 'cliente' | 'pessoal'
  cliente: string
  clienteId?: string
  /** Data da transação / no recibo (YYYY-MM-DD) — aparece no PDF e na lista por dia */
  data: string
  /**
   * Mês de arquivo / IRS (YYYY-MM). Se omitido, usa-se o mês derivado de `data`.
   * Pode diferir da data (ex.: foto hoje, recibo de março).
   */
  mesCompetencia?: string
  valorUnitario: number
  quantidade: number
  valorTotal: number
  descricao?: string
  imagemBase64?: string
  /** Hash da imagem para evitar registar a mesma foto duas vezes */
  imagemHash?: string
}

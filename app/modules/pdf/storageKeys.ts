/** Chaves de persistência do modelo PDF por domínio — constantes puras, sem I/O. */

export const PDF_STORAGE_KEYS = {
  relatorios: 'nonato-relatorios-pdf-modelo',
  relatoriosPorId: 'nonato-relatorios-pdf-modelo-por-id',
  orcamentos: 'nonato-orcamentos-pdf-modelo',
  pedidoAvulso: 'nonato-pedido-avulso-pdf-modelo',
  pecasEspeciais: 'nonato-pecas-especiais-pdf-modelo',
  fechamentoDespesas: 'nonato-fechamento-despesas-pdf-modelo',
  cadastroNonato: 'nonato-cadastro-nonato-pdf-modelo',
  pagamentosContador: 'nonato-pagamentos-contador-pdf-modelo',
} as const

export type PdfStorageDomain = keyof typeof PDF_STORAGE_KEYS

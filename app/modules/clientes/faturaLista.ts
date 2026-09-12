/** Fatura na lista do detalhe do cliente (associação a equipamento). */

export type ClienteFaturaListItem = {
  id: string
  numeroFatura: string
  dataEmissao?: string
  valorTotal: number
  status: string
  equipamentoId?: string
  equipamentoTexto?: string
  arquivoAnexo?: string
  nomeArquivoOriginal?: string
}

export type ClienteFaturaEquipamentoOpt = {
  id?: string
  modelo?: string
  marca?: string
  numeroSerie?: string
  tipoEquipamento?: string
}

export function rotuloEquipamentoFatura(eq: ClienteFaturaEquipamentoOpt, index: number): string {
  const parts = [eq.marca, eq.modelo, eq.numeroSerie].filter(Boolean)
  if (parts.length) return parts.join(' · ')
  if (eq.tipoEquipamento) return eq.tipoEquipamento
  return eq.id || `#${index + 1}`
}

export function faturaSemEquipamentoUtil(f: ClienteFaturaListItem): boolean {
  return !String(f.equipamentoId || '').trim() && !String(f.equipamentoTexto || '').trim()
}

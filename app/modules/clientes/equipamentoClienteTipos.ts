/** Tipos canónicos do equipamento do cliente e das notas/relatórios anexos ao equipamento. */

/** Nota / relatório simples anexado a um equipamento do cliente (não é RelatorioServico). */
export type RelatorioEquipamento = {
  id: string
  titulo: string
  dataGeracao: string
  conteudo: string
  /** Identifica o equipamento (legado: n.º de série como referência). */
  equipamentoId?: string
}

/** Equipamento cadastrado no cliente (ficha de máquina / série / anexos). */
export type EquipamentoCliente = {
  /** ID ou código de referência (opcional). Se vazio na 1.ª gravação, gera-se um ID técnico (UUID). Distinto do n.º de série. */
  id?: string
  tipoEquipamento: string
  modelo: string
  marca: string
  numeroSerie: string
  familia: string
  grupo: string
  photo?: string
  coverPhoto?: string
  photoLibrary?: string[]
  manualPdf?: string
  itemsIncluded?: string[]
  relatorios?: RelatorioEquipamento[]
}

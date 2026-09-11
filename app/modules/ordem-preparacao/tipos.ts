/** Tipo canónico da ordem de preparação (formulário SME_UP). */

export type OrdemPreparacao = {
  id: string
  dataCriacao: string
  codiceSmeUp: string
  descrizione: string
  modello: string
  cliente: string
  testRun: boolean
  modalitaVendita: string
  marca: string
  tecnicoResponsabile: string
  nazione: string
  installazione: string
  famiglia: string
  materialeLavorato: string[]
  materialeLavoratoAltro: string
  tipologiaImpiallaggiatura: string
  tipologiaImpiallaggiaturaAltro: string
  colore: string
  coloreAltro: string
  dimensioniMax: string
  dimensioniMin: string
  dimensioniAltro: string
  tipologiaBordo: string[]
  tipologiaBordoAltro: string
  spessoreBordo: string[]
  spessoreBordoAltro: string
  tipoColla: string[]
  tipoCollaAltro: string
  griglieProtezione: string[]
  griglieProtezioneAggiunte: boolean
  utensiliFornitiCliente: boolean
  utensiliQuali: string
  utensiliFornitiPrimaTestRun: boolean
  utensiliCaricoFerwood: boolean
  tappetoEvacuazione: boolean
  ventose: string
  materialeTestRunFornitoCliente: boolean
  materialeTestRunQualiQta: string
  materialeTestRunMagazzinoFW: boolean
  linguaDestinazione: string
  manualistica: string
  adesivi: string
  noteProduzione: string
  impressoes: string
}

export type OrdemPreparacaoFormState = Omit<OrdemPreparacao, 'id' | 'dataCriacao'> & {
  id?: string
  dataCriacao?: string
}

export type FormularioChecklistFromOrdemStatus = 'pendente' | 'em-andamento' | 'concluido' | 'cancelado'

/** Formulário/checklist gerado a partir da ordem de preparação (não é checklist-gerado). */
export type FormularioChecklistFromOrdem = {
  id: string
  ordemPreparacaoId: string | null
  codiceSmeUp: string
  descrizione: string
  modello: string
  cliente: string
  marca: string
  tecnicoResponsabile: string
  familia: string
  nazione: string
  installazione: string
  testRun: boolean
  materialeLavorato: string[]
  materialeLavoratoAltro: string
  tipologiaImpiallaggiatura: string
  tipologiaImpiallaggiaturaAltro: string
  colore: string
  coloreAltro: string
  dimensioniMax: string
  dimensioniMin: string
  dimensioniAltro: string
  tipologiaBordo: string[]
  tipologiaBordoAltro: string
  spessoreBordo: string[]
  spessoreBordoAltro: string
  tipoColla: string[]
  tipoCollaAltro: string
  griglieProtezione: string[]
  griglieProtezioneAggiunte: boolean
  utensiliFornitiCliente: boolean
  utensiliQuali: string
  utensiliFornitiPrimaTestRun: boolean
  utensiliCaricoFerwood: boolean
  tappetoEvacuazione: boolean
  ventose: string
  materialeTestRunFornitoCliente: boolean
  materialeTestRunQualiQta: string
  materialeTestRunMagazzinoFW: boolean
  linguaDestinazione: string
  manualistica: string
  adesivi: string
  noteProduzione: string
  impressoes: string
  dataCriacao: string
  status: FormularioChecklistFromOrdemStatus
  checklistItens: unknown[]
  observacoesTecnico: string
}

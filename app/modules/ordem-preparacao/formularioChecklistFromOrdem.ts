/** Construtor puro do formulário/checklist a partir da ordem de preparação. */

import type { FormularioChecklistFromOrdem, OrdemPreparacaoFormState } from './tipos'

export type CreateFormularioChecklistFromOrdemOpts = {
  id?: string
  dataCriacao?: string
}

export function createFormularioChecklistFromOrdem(
  form: OrdemPreparacaoFormState,
  opts: CreateFormularioChecklistFromOrdemOpts = {}
): FormularioChecklistFromOrdem {
  return {
    id: opts.id ?? Date.now().toString() + Math.random().toString(36).substr(2, 9),
    ordemPreparacaoId: form.id || null,
    codiceSmeUp: form.codiceSmeUp,
    descrizione: form.descrizione,
    modello: form.modello,
    cliente: form.cliente,
    marca: form.marca,
    tecnicoResponsabile: form.tecnicoResponsabile,
    familia: form.famiglia,
    nazione: form.nazione,
    installazione: form.installazione,
    testRun: form.testRun,
    materialeLavorato: [...(form.materialeLavorato || [])],
    materialeLavoratoAltro: form.materialeLavoratoAltro,
    tipologiaImpiallaggiatura: form.tipologiaImpiallaggiatura,
    tipologiaImpiallaggiaturaAltro: form.tipologiaImpiallaggiaturaAltro,
    colore: form.colore,
    coloreAltro: form.coloreAltro,
    dimensioniMax: form.dimensioniMax,
    dimensioniMin: form.dimensioniMin,
    dimensioniAltro: form.dimensioniAltro,
    tipologiaBordo: [...(form.tipologiaBordo || [])],
    tipologiaBordoAltro: form.tipologiaBordoAltro,
    spessoreBordo: [...(form.spessoreBordo || [])],
    spessoreBordoAltro: form.spessoreBordoAltro,
    tipoColla: [...(form.tipoColla || [])],
    tipoCollaAltro: form.tipoCollaAltro,
    griglieProtezione: [...(form.griglieProtezione || [])],
    griglieProtezioneAggiunte: form.griglieProtezioneAggiunte,
    utensiliFornitiCliente: form.utensiliFornitiCliente,
    utensiliQuali: form.utensiliQuali,
    utensiliFornitiPrimaTestRun: form.utensiliFornitiPrimaTestRun,
    utensiliCaricoFerwood: form.utensiliCaricoFerwood,
    tappetoEvacuazione: form.tappetoEvacuazione,
    ventose: form.ventose,
    materialeTestRunFornitoCliente: form.materialeTestRunFornitoCliente,
    materialeTestRunQualiQta: form.materialeTestRunQualiQta,
    materialeTestRunMagazzinoFW: form.materialeTestRunMagazzinoFW,
    linguaDestinazione: form.linguaDestinazione,
    manualistica: form.manualistica,
    adesivi: form.adesivi,
    noteProduzione: form.noteProduzione,
    impressoes: form.impressoes,
    dataCriacao: opts.dataCriacao ?? new Date().toISOString(),
    status: 'pendente',
    checklistItens: [],
    observacoesTecnico: '',
  }
}

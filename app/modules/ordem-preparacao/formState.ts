/** Formulário vazio e mapeamento da ordem de preparação. */

import type { OrdemPreparacao, OrdemPreparacaoFormState } from './tipos'

export function emptyOrdemPreparacaoForm(): OrdemPreparacaoFormState {
  return {
    codiceSmeUp: '',
    descrizione: '',
    modello: '',
    cliente: '',
    testRun: false,
    modalitaVendita: '',
    marca: '',
    tecnicoResponsabile: '',
    nazione: '',
    installazione: '',
    famiglia: '',
    materialeLavorato: [],
    materialeLavoratoAltro: '',
    tipologiaImpiallaggiatura: '',
    tipologiaImpiallaggiaturaAltro: '',
    colore: '',
    coloreAltro: '',
    dimensioniMax: '',
    dimensioniMin: '',
    dimensioniAltro: '',
    tipologiaBordo: [],
    tipologiaBordoAltro: '',
    spessoreBordo: [],
    spessoreBordoAltro: '',
    tipoColla: [],
    tipoCollaAltro: '',
    griglieProtezione: [],
    griglieProtezioneAggiunte: false,
    utensiliFornitiCliente: false,
    utensiliQuali: '',
    utensiliFornitiPrimaTestRun: false,
    utensiliCaricoFerwood: false,
    tappetoEvacuazione: false,
    ventose: '',
    materialeTestRunFornitoCliente: false,
    materialeTestRunQualiQta: '',
    materialeTestRunMagazzinoFW: false,
    linguaDestinazione: '',
    manualistica: '',
    adesivi: '',
    noteProduzione: '',
    impressoes: '',
  }
}

export function ordemPreparacaoToForm(ordem: OrdemPreparacao): OrdemPreparacaoFormState {
  return {
    ...emptyOrdemPreparacaoForm(),
    ...ordem,
    materialeLavorato: [...(ordem.materialeLavorato || [])],
    tipologiaBordo: [...(ordem.tipologiaBordo || [])],
    spessoreBordo: [...(ordem.spessoreBordo || [])],
    tipoColla: [...(ordem.tipoColla || [])],
    griglieProtezione: [...(ordem.griglieProtezione || [])],
  }
}

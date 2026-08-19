/** Formulário vazio do equipamento do cliente (funções puras). */

import type { EquipamentoCliente } from './equipamentoClienteTipos'

/** Estado inicial / limpo do formulário de equipamento do cliente. */
export function createEmptyEquipamentoClienteForm(): EquipamentoCliente {
  return {
    id: '',
    tipoEquipamento: '',
    modelo: '',
    marca: '',
    numeroSerie: '',
    familia: '',
    grupo: '',
    photo: '',
    coverPhoto: '',
    photoLibrary: [],
    manualPdf: '',
    itemsIncluded: [],
  }
}

/** Campos do modal de nota/relatório do equipamento (antes de gravar id/data). */
export type RelatorioEquipamentoFormFields = {
  titulo: string
  conteudo: string
}

export function createEmptyRelatorioEquipamentoForm(): RelatorioEquipamentoFormFields {
  return {
    titulo: '',
    conteudo: '',
  }
}

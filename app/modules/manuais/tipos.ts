/** Tipos de Manuais e Informações Técnicas (e Bíblia alinhada). */

import type { BibliaAnexo, BibliaSecao } from '../../components/bibliaNonatoTypes'

export type ManuaisGrupo = { id: string; nome: string; familia: string }

export type ManuaisDocumento = {
  id: string
  nome: string
  tipo: string
  dados: string
  /** Caminho dentro da pasta importada (ex.: movecho manual/Index.PDF) */
  caminhoRelativo?: string
  /** Secção da Bíblia (Software / Mecânica / Elétrica / Notas) */
  secao?: BibliaSecao
}

export type ManuaisImagem = {
  id: string
  nome: string
  dados: string
  secao?: BibliaSecao
}

export type ManuaisModelo = {
  id: string
  nome: string
  grupoId: string
  documentos?: ManuaisDocumento[]
  /** Ficha Bíblia — software / PLC */
  software?: string
  infoTecnicas?: string
  infoMecanicas?: string
  infoEletricas?: string
  /** Notas gerais da ficha Bíblia */
  notas?: string
  /** Anexos técnicos (ficha Bíblia) */
  anexos?: BibliaAnexo[]
  imagens?: ManuaisImagem[]
  /** IDs legados da Bíblia para sincronização bidirecional */
  bibliaModeloId?: string
  bibliaLinhaId?: string
  bibliaFamiliaId?: string
}

export type EquipamentoManuaisRef = {
  id: string
  tipoEquipamento: string
  modelo: string
  marca: string
  numeroSerie?: string
  status?: string
  modeloManuaisId?: string
}

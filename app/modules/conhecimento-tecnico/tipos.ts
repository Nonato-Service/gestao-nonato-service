/** Tipos de conhecimento do técnico por tipo de equipamento. */

/** Área de competência (nível 0–4 + descrição opcional). */
export type ConhecimentoSkillField = 'mecanico' | 'eletrico' | 'software' | 'programacao'

/**
 * Conhecimento do técnico por tipo de equipamento
 * (mecânico, elétrico, software, programação).
 * Níveis: 0 = nenhum, 1 = básico, 2 = médio, 3 = avançado, 4 = especialista.
 * Descrição por área: só faz sentido quando o nível > 0.
 */
export type ConhecimentoTecnicoEntry = {
  id: string
  tecnicoId: string
  equipamentoTipoId: string
  equipamentoTipoNome: string
  mecanico: number
  eletrico: number
  software: number
  programacao: number
  descricaoMecanico?: string
  descricaoEletrico?: string
  descricaoSoftware?: string
  descricaoProgramacao?: string
}

/** Agregado de níveis de um técnico (lista filtrada). */
export type ConhecimentoTecnicoStats = {
  equipamentos: number
  media: number
  expert: number
  totalSkills: number
}

/** Opção de tipo de equipamento (família › grupo) para o formulário. */
export type TipoEquipamentoOpcao = {
  id: string
  nome: string
}

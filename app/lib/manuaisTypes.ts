export type ManuaisGrupo = { id: string; nome: string; familia: string }

export type ManuaisDocumento = { id: string; nome: string; tipo: string; dados: string }

export type ManuaisImagem = { id: string; nome: string; dados: string }

export type ManuaisModelo = {
  id: string
  nome: string
  grupoId: string
  documentos?: ManuaisDocumento[]
  infoTecnicas?: string
  infoMecanicas?: string
  infoEletricas?: string
  imagens?: ManuaisImagem[]
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

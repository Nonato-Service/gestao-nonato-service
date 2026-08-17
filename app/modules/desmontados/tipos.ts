/** Tipos do domínio Desmontados (grupos e peças). */

export type LocalizacaoDesmontado = {
  rua: string
  numeroEspaco: string
  numeroGrupoPrateleira: string
}

export type GrupoDesmontado = {
  id: string
  numeroGrupo: string
  familia: string
  idFabricante?: string
  imagem?: string
  localizacao: LocalizacaoDesmontado
  nome: string
  descricao?: string
  dataCriacao: string
}

export type PecaDesmontadaStatusFuncional = 'funciona' | 'nao-funciona' | 'nao-testado'

export type PecaDesmontada = {
  id: string
  numeroPeca: string
  familia: string
  grupoId: string
  grupoNome: string
  nome: string
  codigo?: string
  marca?: string
  modelo?: string
  tipoEquipamento?: string
  observacoes?: string
  quantidade: number
  imagens?: string[]
  statusFuncional?: PecaDesmontadaStatusFuncional
  foiRecuperada?: boolean
  foiTestada?: boolean
  tecnicoTeste?: string
  descricaoTeste?: string
  localizacao: LocalizacaoDesmontado
  dataCriacao: string
}

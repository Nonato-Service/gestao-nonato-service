/** Formulário vazio e mapeamento entidade → form (Desmontados). */

import type {
  GrupoDesmontado,
  LocalizacaoDesmontado,
  PecaDesmontada,
  PecaDesmontadaStatusFuncional,
} from './tipos'

export type GrupoDesmontadoFormState = {
  numeroGrupo: string
  familia: string
  idFabricante: string
  imagem: string
  localizacao: LocalizacaoDesmontado
  nome: string
  descricao: string
}

export type PecaDesmontadaFormState = {
  numeroPeca: string
  familia: string
  grupoId: string
  nome: string
  codigo: string
  marca: string
  modelo: string
  tipoEquipamento: string
  observacoes: string
  quantidade: number
  imagens: string[]
  statusFuncional: PecaDesmontadaStatusFuncional
  foiRecuperada: boolean
  foiTestada: boolean
  tecnicoTeste: string
  descricaoTeste: string
  localizacao: LocalizacaoDesmontado
}

export function emptyLocalizacaoDesmontado(): LocalizacaoDesmontado {
  return { rua: '', numeroEspaco: '', numeroGrupoPrateleira: '' }
}

export function createEmptyGrupoDesmontadoForm(): GrupoDesmontadoFormState {
  return {
    numeroGrupo: '',
    familia: '',
    idFabricante: '',
    imagem: '',
    localizacao: emptyLocalizacaoDesmontado(),
    nome: '',
    descricao: '',
  }
}

export function createEmptyPecaDesmontadaForm(): PecaDesmontadaFormState {
  return {
    numeroPeca: '',
    familia: '',
    grupoId: '',
    nome: '',
    codigo: '',
    marca: '',
    modelo: '',
    tipoEquipamento: '',
    observacoes: '',
    quantidade: 1,
    imagens: [],
    statusFuncional: 'nao-testado',
    foiRecuperada: false,
    foiTestada: false,
    tecnicoTeste: '',
    descricaoTeste: '',
    localizacao: emptyLocalizacaoDesmontado(),
  }
}

export function grupoDesmontadoToFormState(grupo: GrupoDesmontado): GrupoDesmontadoFormState {
  return {
    numeroGrupo: grupo.numeroGrupo,
    familia: grupo.familia,
    idFabricante: grupo.idFabricante || '',
    imagem: grupo.imagem || '',
    localizacao: grupo.localizacao || emptyLocalizacaoDesmontado(),
    nome: grupo.nome || '',
    descricao: grupo.descricao || '',
  }
}

export function pecaDesmontadaToFormState(peca: PecaDesmontada): PecaDesmontadaFormState {
  return {
    numeroPeca: peca.numeroPeca,
    familia: peca.familia,
    grupoId: peca.grupoId,
    nome: peca.nome,
    codigo: peca.codigo || '',
    marca: peca.marca || '',
    modelo: peca.modelo || '',
    tipoEquipamento: peca.tipoEquipamento || '',
    observacoes: peca.observacoes || '',
    quantidade: peca.quantidade,
    imagens: peca.imagens || [],
    statusFuncional: peca.statusFuncional || 'nao-testado',
    foiRecuperada: peca.foiRecuperada || false,
    foiTestada: peca.foiTestada || false,
    tecnicoTeste: peca.tecnicoTeste || '',
    descricaoTeste: peca.descricaoTeste || '',
    localizacao: peca.localizacao || emptyLocalizacaoDesmontado(),
  }
}

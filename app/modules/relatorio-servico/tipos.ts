/** Tipos mínimos do relatório de serviço (funções puras). */

export type DiaTrabalho = {
  id?: string
  data: string
  idaHora: string
  idaChegada: string
  idaDuracao: string
  horasInicio: string
  horasFim: string
  horasDuracao: string
  retornoSaida: string
  retornoChegada: string
  retornoDuracao: string
  kmIda: string
  kmRetorno: string
  kmTotal: string
  pausa: string
  tempoPausa?: string
  descricaoTrabalho: string
}

export type RelatorioServicoNumeroLike = {
  id: string
  numero?: string
  data?: string
  cliente?: string
  clienteId?: string
  servicoConcluido?: boolean
}

export type ClienteRelatorioLookup = {
  id: string
  nomeEmpresa?: string
  relatorios?: Record<string, RelatorioServicoNumeroLike[] | undefined>
}

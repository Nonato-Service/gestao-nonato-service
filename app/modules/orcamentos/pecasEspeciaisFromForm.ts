/** Validação e mapeamento puro do orçamento de peças especiais gravado. */

import { newPecasEspeciaisEntityId } from './pecasEspeciaisForm'
import type {
  LinhaOrcamentoPecasEsp,
  ModoCalculoTotalPecasEsp,
  OrcamentoPecasEspeciaisSalvo,
} from './pecasEspeciaisTipos'

export function isLinhaOrcamentoPecasEspPreenchida(l: Pick<LinhaOrcamentoPecasEsp, 'titulo' | 'numeroArtigo'>): boolean {
  return Boolean(l.titulo.trim() || l.numeroArtigo.trim())
}

export function linhasOrcamentoPecasEspPreenchidas(
  linhas: readonly LinhaOrcamentoPecasEsp[]
): LinhaOrcamentoPecasEsp[] {
  return linhas.filter(isLinhaOrcamentoPecasEspPreenchida)
}

export function isOrcamentoPecasEspeciaisLinhasValid(linhas: readonly LinhaOrcamentoPecasEsp[]): boolean {
  return linhasOrcamentoPecasEspPreenchidas(linhas).length > 0
}

export type OrcamentoPecasEspeciaisFormPayload = {
  numeroOferta: string
  dataIso: string
  clienteId: string
  clienteNome: string
  clienteCodigo: string
  contactoNome: string
  contactoTelefone: string
  contactoEmail: string
  linhas: LinhaOrcamentoPecasEsp[]
  linhaEmbalagemTitulo: string
  linhaEmbalagemDescricao: string
  condicoesPagamento: string
  notasRodape: string
  totalLiquido: string
  totalIva: string
  totalComIva: string
  incluirIva: boolean
  taxaIva: number
  modoCalculoTotal: ModoCalculoTotalPecasEsp
  valorFinalComIva: string
}

export type CreateOrcamentoPecasEspeciaisFromFormOpts = {
  id?: string
  dataCriacao?: string
}

export function createOrcamentoPecasEspeciaisFromForm(
  form: OrcamentoPecasEspeciaisFormPayload,
  opts: CreateOrcamentoPecasEspeciaisFromFormOpts = {}
): OrcamentoPecasEspeciaisSalvo {
  return {
    id: opts.id ?? newPecasEspeciaisEntityId(),
    numeroOferta: form.numeroOferta,
    dataIso: form.dataIso,
    clienteId: form.clienteId,
    clienteNome: form.clienteNome,
    clienteCodigo: form.clienteCodigo,
    contactoNome: form.contactoNome,
    contactoTelefone: form.contactoTelefone,
    contactoEmail: form.contactoEmail,
    linhas: form.linhas,
    linhaEmbalagemTitulo: form.linhaEmbalagemTitulo,
    linhaEmbalagemDescricao: form.linhaEmbalagemDescricao,
    condicoesPagamento: form.condicoesPagamento,
    notasRodape: form.notasRodape,
    totalLiquido: form.totalLiquido,
    totalIva: form.totalIva,
    totalComIva: form.totalComIva,
    incluirIva: form.incluirIva,
    taxaIva: form.taxaIva,
    modoCalculoTotal: form.incluirIva ? form.modoCalculoTotal : 'linhas',
    valorFinalComIva: form.incluirIva && form.modoCalculoTotal === 'valor-final' ? form.valorFinalComIva : '',
    dataCriacao: opts.dataCriacao ?? new Date().toISOString(),
  }
}

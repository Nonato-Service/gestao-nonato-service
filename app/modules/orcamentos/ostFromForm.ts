/** Validação e mapeamento puro da proposta de orçamento de serviço técnico. */

import { newOstEntityId } from './ostForm'
import type { OstPropostaLinha, OstPropostaPayload, OstPropostaSalva } from './ostTipos'

export function resolveOstPropostaNome(propostaNome: string, refDoc: string, dataDoc: string): string {
  return (propostaNome.trim() || refDoc.trim() || `OST ${dataDoc}`).trim().slice(0, 200)
}

export function createOstPropostaPayloadFromForm(form: OstPropostaPayload): OstPropostaPayload {
  return {
    clienteId: form.clienteId,
    clienteManual: form.clienteManual,
    refDoc: form.refDoc,
    localServico: form.localServico,
    dataDoc: form.dataDoc,
    validade: form.validade,
    intro: form.intro,
    clausulas: form.clausulas,
    linhas: form.linhas.map(({ rowId, servicoId, quantidadeStr }) => ({
      rowId,
      servicoId,
      quantidadeStr,
    })),
  }
}

export type CreateOstPropostaFromFormOpts = {
  id?: string
  criadoEm?: string
  atualizadoEm?: string
}

export function createOstPropostaFromForm(
  form: OstPropostaPayload,
  nome: string,
  opts: CreateOstPropostaFromFormOpts = {}
): OstPropostaSalva {
  const now = opts.atualizadoEm ?? new Date().toISOString()
  return {
    id: opts.id ?? newOstEntityId(),
    nome,
    criadoEm: opts.criadoEm ?? now,
    atualizadoEm: now,
    payload: createOstPropostaPayloadFromForm(form),
  }
}

export function isOstPropostaLinhaServicoValid(linha: Pick<OstPropostaLinha, 'servicoId'>): boolean {
  return Boolean(linha.servicoId)
}

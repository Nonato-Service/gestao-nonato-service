/** Validação e mapeamento puro do protocolo de serviço. */

import { clampProtocoloPdfModelo } from '../../utils/protocoloServicoPdfThemes'
import type { ProtocoloServicoFormState } from './formState'
import type { ProtocoloServico } from './tipos'

export type ProtocoloServicoFormMissing = 'cliente' | 'ident' | null

export function protocoloServicoFormMissing(
  form: Pick<ProtocoloServicoFormState, 'clienteId' | 'equipamentoNumeroSerie' | 'situacaoDescricao'>
): ProtocoloServicoFormMissing {
  if (!form.clienteId) return 'cliente'
  const temEq = Boolean(form.equipamentoNumeroSerie?.trim())
  const temSit = Boolean((form.situacaoDescricao || '').trim())
  if (!temEq && !temSit) return 'ident'
  return null
}

export function isProtocoloServicoFormValid(
  form: Pick<ProtocoloServicoFormState, 'clienteId' | 'equipamentoNumeroSerie' | 'situacaoDescricao'>
): boolean {
  return protocoloServicoFormMissing(form) === null
}

export type CreateProtocoloServicoFromFormOpts = {
  id?: string
  dataCriacao?: string
  relatorioServicoIdFallback?: string
}

export function createProtocoloServicoFromForm(
  form: ProtocoloServicoFormState,
  opts: CreateProtocoloServicoFromFormOpts = {}
): ProtocoloServico {
  const temEq = Boolean(form.equipamentoNumeroSerie?.trim())
  const sitTrim = (form.situacaoDescricao || '').trim()
  return {
    id: opts.id ?? `proto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    clienteId: form.clienteId,
    equipamentoNumeroSerie: temEq ? form.equipamentoNumeroSerie.trim() : '',
    situacaoDescricao: temEq ? undefined : sitTrim || undefined,
    textoInicial: form.textoInicial,
    blocos: form.blocos,
    pecasTrocadasCodigos: form.pecasTrocadasCodigos.filter((c) => c.trim()),
    dataCriacao: opts.dataCriacao ?? new Date().toISOString(),
    pdfModelo: clampProtocoloPdfModelo(form.pdfModelo),
    relatorioServicoId: (form.relatorioServicoId || opts.relatorioServicoIdFallback || '').trim() || undefined,
    status: 'em_execucao',
    condicaoGeral: (form.condicaoGeral || '').trim() || undefined,
    ativoSeguroUso:
      form.ativoSeguroUso === 'sim' || form.ativoSeguroUso === 'nao' ? form.ativoSeguroUso : undefined,
    manutencaoNecessaria:
      form.manutencaoNecessaria === 'sim' || form.manutencaoNecessaria === 'nao'
        ? form.manutencaoNecessaria
        : undefined,
    observacaoCondicoes: (form.observacaoCondicoes || '').trim() || undefined,
  }
}

export function updateProtocoloServicoFromForm(
  existing: ProtocoloServico,
  form: ProtocoloServicoFormState,
  opts: Omit<CreateProtocoloServicoFromFormOpts, 'id' | 'dataCriacao'> = {}
): ProtocoloServico {
  const next = createProtocoloServicoFromForm(form, {
    ...opts,
    id: existing.id,
    dataCriacao: existing.dataCriacao,
  })
  const executado = existing.status === 'executado_enviado'
  return {
    ...next,
    status: executado ? 'executado_enviado' : 'em_execucao',
    dataConclusao: executado ? existing.dataConclusao : undefined,
    enviadoVia: executado ? existing.enviadoVia : undefined,
  }
}

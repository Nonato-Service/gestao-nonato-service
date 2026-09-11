/** Validação e mapeamento puro da solicitação de serviço técnico. */

import { emptySolicitacaoServicoTecnicoFormState } from './formState'
import type { SolicitacaoServicoTecnico, SolicitacaoServicoTecnicoFormState } from './tipos'

export function solicitacaoServicoTecnicoToForm(
  s: SolicitacaoServicoTecnico
): SolicitacaoServicoTecnicoFormState {
  return {
    ...emptySolicitacaoServicoTecnicoFormState(),
    clienteId: s.clienteId,
    nomeCliente: s.nomeCliente,
    identificacaoFiscal: s.identificacaoFiscal,
    emailContato: s.emailContato,
    departamento: s.departamento,
    tipoServico: s.tipoServico,
    localServico: s.localServico,
    horarioPreferido: s.horarioPreferido,
    equipamentoClienteChave: s.equipamentoClienteChave,
    tipoEquipamento: s.tipoEquipamento,
    marca: s.marca,
    modelo: s.modelo,
    numeroSerie: s.numeroSerie,
    problemasApresentados: s.problemasApresentados,
    endereco: s.endereco,
    telefone: s.telefone,
    responsavel: s.responsavel,
    nivelUrgencia: s.nivelUrgencia,
    assinaturaCliente: s.assinaturaCliente,
    dataAssinaturaCliente: s.dataAssinaturaCliente,
    dataRecebimento: s.dataRecebimento,
    documentoDevolvido: s.documentoDevolvido,
  }
}

export function solicitacaoServicoTecnicoFormFromModelo(
  modelo: SolicitacaoServicoTecnicoFormState
): SolicitacaoServicoTecnicoFormState {
  return {
    ...modelo,
    clienteId: undefined,
    assinaturaCliente: undefined,
    dataAssinaturaCliente: undefined,
    dataRecebimento: undefined,
    documentoDevolvido: undefined,
  }
}

export function createSolicitacaoServicoTecnicoFromForm(
  form: SolicitacaoServicoTecnicoFormState,
  opts?: { id?: string; dataCriacao?: string }
): SolicitacaoServicoTecnico {
  return {
    ...form,
    id: opts?.id ?? `sst-${Date.now()}`,
    dataCriacao: opts?.dataCriacao ?? new Date().toISOString(),
  }
}

export function updateSolicitacaoServicoTecnicoFromForm(
  existing: SolicitacaoServicoTecnico,
  form: SolicitacaoServicoTecnicoFormState
): SolicitacaoServicoTecnico {
  return {
    ...existing,
    ...form,
    id: existing.id,
    dataCriacao: existing.dataCriacao,
  }
}

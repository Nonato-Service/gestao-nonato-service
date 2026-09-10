/** Estado vazio e mapeamento Agendamento → formulário. */

import {
  normalizeCategoriaAgendamento,
  normalizeStatusAgendamento,
  normalizeTipoAgendamento,
} from './normalize'
import type { Agendamento } from './tipos'

export type AgendamentoFormState = Agendamento

/** Formulário inicial (serviço ou pessoal). Datas no call-site via overrides se precisar de um instante fixo. */
export function emptyAgendamentoFormState(
  overrides?: Partial<Agendamento>
): Agendamento {
  const categoria = overrides?.categoria === 'pessoal' ? 'pessoal' : 'servico'
  return {
    id: '',
    tipo: 'pre-agendamento',
    tecnico: '',
    cliente: '',
    clienteId: '',
    equipamento: '',
    equipamentoId: '',
    data: new Date().toISOString().split('T')[0],
    hora: '09:00',
    duracaoEstimada: categoria === 'pessoal' ? '1' : '2',
    diasSelecionados: undefined,
    tipoServico: '',
    observacoesTecnicas: '',
    necessidadePecas: false,
    codigoNotaFiscal: '',
    pecasAnexadas: [],
    status: 'pendente',
    telefone: '',
    endereco: '',
    cidade: '',
    dataCriacao: new Date().toISOString(),
    relatorioTrabalhoExecutado: '',
    dataRegistoConclusao: undefined,
    categoria,
    subtipoPessoal: 'pessoal',
    assunto: '',
    ...overrides,
  }
}

/** Edição: normaliza tipo/status/categoria e aplica cliente/equipamento já resolvidos. */
export function agendamentoToFormState(
  agendamento: Agendamento,
  resolved?: Pick<Agendamento, 'clienteId' | 'equipamentoId'>
): Agendamento {
  return {
    ...agendamento,
    ...resolved,
    tipo: normalizeTipoAgendamento(agendamento),
    status: normalizeStatusAgendamento(agendamento),
    categoria: normalizeCategoriaAgendamento(agendamento),
    subtipoPessoal: agendamento.subtipoPessoal || 'pessoal',
    assunto: agendamento.assunto || '',
  }
}

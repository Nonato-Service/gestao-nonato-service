import type { SolicitacaoServicoTecnicoFormState } from './tipos'

/** Estado vazio do formulário / modelo base SST. */
export function emptySolicitacaoServicoTecnicoFormState(): SolicitacaoServicoTecnicoFormState {
  return {
    clienteId: undefined,
    nomeCliente: '',
    identificacaoFiscal: '',
    emailContato: '',
    departamento: '',
    tipoServico: '',
    localServico: '',
    horarioPreferido: '',
    equipamentoClienteChave: '',
    tipoEquipamento: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    problemasApresentados: '',
    endereco: '',
    telefone: '',
    responsavel: '',
    assinaturaCliente: undefined,
    dataAssinaturaCliente: undefined,
    dataRecebimento: undefined,
    documentoDevolvido: undefined,
  }
}

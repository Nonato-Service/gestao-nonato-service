import type {
  ClienteSstLike,
  EquipamentoClienteSstLike,
  SolicitacaoServicoTecnico,
  SolicitacaoServicoTecnicoFormState,
} from './tipos'

/** Preenche campos em falta a partir do cliente cadastrado (não sobrescreve valores já preenchidos). */
export function enriquecerSolicitacaoComClienteCadastrado(
  rec: SolicitacaoServicoTecnico,
  clientes: ClienteSstLike[]
): SolicitacaoServicoTecnico {
  if (!rec.clienteId) return rec
  const c = clientes.find((x) => x.id === rec.clienteId)
  if (!c) return rec
  const morada = [c.morada, c.codigoPostal].filter(Boolean).join(', ')
  const tel = String(c.telefones || '').split(/[;,]/)[0]?.trim() || ''
  const email = String(c.email || '').trim()
  const nif = String(c.numeroContribuicaoFiscal || '').trim()
  const contato = String(c.contato || '').trim()
  return {
    ...rec,
    nomeCliente: String(rec.nomeCliente || '').trim() || c.nomeEmpresa || rec.nomeCliente,
    telefone: String(rec.telefone || '').trim() || tel || rec.telefone,
    endereco: String(rec.endereco || '').trim() || morada || rec.endereco,
    identificacaoFiscal: String(rec.identificacaoFiscal || '').trim() || nif || rec.identificacaoFiscal,
    emailContato: String(rec.emailContato || '').trim() || email || rec.emailContato,
    responsavel: String(rec.responsavel || '').trim() || contato || rec.responsavel,
  }
}

/** Ao escolher/limpar cliente no formulário SST — preenche contactos e limpa equipamento. */
export function mergeClienteSelecionadoSst(
  prev: SolicitacaoServicoTecnicoFormState,
  clienteId: string | undefined,
  clientes: ClienteSstLike[]
): SolicitacaoServicoTecnicoFormState {
  if (!clienteId) {
    return { ...prev, clienteId: undefined, equipamentoClienteChave: '' }
  }
  const c = clientes.find((x) => x.id === clienteId)
  if (!c) return { ...prev, clienteId }
  const morada = [c.morada, c.codigoPostal].filter(Boolean).join(', ')
  const tel = String(c.telefones || '').split(/[;,]/)[0]?.trim() || ''
  return {
    ...prev,
    clienteId,
    nomeCliente: (c.nomeEmpresa || prev.nomeCliente || '').trim(),
    endereco: morada || prev.endereco || '',
    telefone: tel || prev.telefone || '',
    emailContato: String(c.email || '').trim() || prev.emailContato || '',
    identificacaoFiscal: String(c.numeroContribuicaoFiscal || '').trim() || prev.identificacaoFiscal || '',
    responsavel: String(c.contato || '').trim() || prev.responsavel || '',
    equipamentoClienteChave: '',
    tipoEquipamento: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
  }
}

/** Ao escolher equipamento do cliente — copia tipo/marca/modelo/série para o formulário. */
export function patchEquipamentoClienteChave(
  base: SolicitacaoServicoTecnicoFormState,
  chave: string,
  clienteId: string | undefined,
  clientes: ClienteSstLike[]
): SolicitacaoServicoTecnicoFormState {
  if (!chave) {
    return { ...base, equipamentoClienteChave: '', tipoEquipamento: '', marca: '', modelo: '', numeroSerie: '' }
  }
  if (!clienteId) return { ...base, equipamentoClienteChave: chave }
  const c = clientes.find((x) => x.id === clienteId)
  const list = c?.equipamentos
  if (!list?.length) return { ...base, equipamentoClienteChave: chave }
  let eq: EquipamentoClienteSstLike | undefined
  if (chave.startsWith('idx:')) {
    const i = parseInt(chave.slice(4), 10)
    eq = Number.isFinite(i) ? list[i] : undefined
  } else {
    eq = list.find((e) => e.id === chave)
  }
  if (!eq) return { ...base, equipamentoClienteChave: chave }
  return {
    ...base,
    equipamentoClienteChave: chave,
    tipoEquipamento: eq.tipoEquipamento || '',
    marca: eq.marca || '',
    modelo: eq.modelo || '',
    numeroSerie: eq.numeroSerie || '',
  }
}

/** Formulário vazio do comprovante de despesa. */

import { horaAtualLocal } from './clientesAtivos'
import type { ClienteAtivoComprovante, MotivoAssociacaoRecibo } from './clientesAtivos'

export type ComprovanteDespesaFormState = {
  tipo: 'cliente' | 'pessoal'
  cliente: string
  data: string
  horaUsada: string
  mesCompetencia: string
  valorUnitario: number
  quantidade: number
  descricao: string
  imagemBase64: string
  clientesSugeridos: ClienteAtivoComprovante[]
  motivoAssociacao: MotivoAssociacaoRecibo
}

export function emptyComprovanteDespesaForm(): ComprovanteDespesaFormState {
  return {
    tipo: 'cliente',
    cliente: '',
    data: new Date().toISOString().slice(0, 10),
    horaUsada: horaAtualLocal(),
    mesCompetencia: new Date().toISOString().slice(0, 7),
    valorUnitario: 0,
    quantidade: 1,
    descricao: '',
    imagemBase64: '',
    clientesSugeridos: [],
    motivoAssociacao: 'perguntar',
  }
}

/** Estado de associação cliente/hora usado para pré-preencher o formulário. */
export type EstadoClienteParaFormComp = {
  tipoSelecionado: 'cliente' | 'pessoal'
  clienteSelecionado: string
  horaUsada?: string | null
  clientesSugeridos: ClienteAtivoComprovante[]
  motivoAssociacao: MotivoAssociacaoRecibo
}

/**
 * Monta o form de comprovante com cliente sugerido (data + hora).
 * O resolver de estado fica no handler (precisa de relatórios/agenda).
 */
export function formCompComClienteSugerido(
  dataIso: string,
  horaIso: string | null | undefined,
  base: Partial<ComprovanteDespesaFormState> | undefined,
  resolverEstado: (data: string, hora: string) => EstadoClienteParaFormComp
): ComprovanteDespesaFormState {
  const data = String(dataIso || '').slice(0, 10)
  const hora = horaIso?.trim() || horaAtualLocal()
  const estado = resolverEstado(data, hora)
  return {
    tipo: (estado.tipoSelecionado === 'pessoal' ? 'pessoal' : 'cliente') as 'cliente' | 'pessoal',
    cliente: base?.cliente?.trim() ? base.cliente : estado.clienteSelecionado || '',
    data: data || new Date().toISOString().slice(0, 10),
    horaUsada: estado.horaUsada || hora,
    mesCompetencia:
      typeof base?.mesCompetencia === 'string' && /^\d{4}-\d{2}$/.test(base.mesCompetencia)
        ? base.mesCompetencia
        : (data || new Date().toISOString().slice(0, 10)).slice(0, 7),
    valorUnitario: base?.valorUnitario ?? 0,
    quantidade: base?.quantidade ?? 1,
    descricao: base?.descricao ?? '',
    imagemBase64: base?.imagemBase64 ?? '',
    clientesSugeridos: estado.clientesSugeridos,
    motivoAssociacao: estado.motivoAssociacao,
  }
}

import type { Agendamento } from './tipos'
import { isAgendamentoPessoal } from './normalize'

type EquipamentoAgendaLike = {
  id?: string
  numeroSerie?: string
  modelo?: string
  marca?: string
  tipoEquipamento?: string
  familia?: string
  grupo?: string
}

type ClienteAgendaLike = {
  id: string
  nomeEmpresa?: string
  equipamentos?: EquipamentoAgendaLike[]
}

/** Ao editar, preencher selects de cliente/equipamento quando o registo antigo só tinha texto livre. */
export function resolveClienteEEquipamentoParaFormularioAgenda(
  ag: Agendamento,
  clientes: ClienteAgendaLike[]
): Pick<Agendamento, 'clienteId' | 'equipamentoId'> {
  let clienteId = String(ag.clienteId ?? '').trim()
  if (!clienteId || !clientes.some((c) => c.id === clienteId)) {
    const nome = (ag.cliente || '').trim().toLowerCase()
    if (nome) {
      const exato = clientes.find((c) => (c.nomeEmpresa || '').trim().toLowerCase() === nome)
      const parcial =
        exato ||
        clientes.find(
          (c) =>
            nome.includes((c.nomeEmpresa || '').trim().toLowerCase()) ||
            (c.nomeEmpresa || '').trim().toLowerCase().includes(nome)
        )
      clienteId = parcial?.id || ''
    }
  }
  let equipamentoId = String(ag.equipamentoId ?? '').trim()
  const cli = clientes.find((c) => c.id === clienteId)
  if (cli?.equipamentos?.length) {
    const equipDoCliente = (id: string) =>
      cli.equipamentos!.find((e) => e.id === id || e.numeroSerie === id)
    const valid = equipamentoId && equipDoCliente(equipamentoId)
    if (!valid && (ag.equipamento || '').trim()) {
      const label = (ag.equipamento || '').trim().toLowerCase()
      const m =
        cli.equipamentos.find((e) => {
          const blob = `${e.modelo || ''} ${e.numeroSerie || ''} ${e.tipoEquipamento || ''}`.toLowerCase()
          return (
            blob.includes(label) ||
            label.includes((e.modelo || '').toLowerCase()) ||
            (e.numeroSerie && label.includes(String(e.numeroSerie).toLowerCase()))
          )
        }) || null
      equipamentoId = (m?.numeroSerie || m?.id || equipamentoId) as string
    }
    // O formulário da agenda usa `value={eq.numeroSerie}` no select — alinhar id interno ao n.º série.
    if (equipamentoId) {
      const me = equipDoCliente(equipamentoId)
      if (me) {
        const serial = String(me.numeroSerie || '').trim()
        equipamentoId = serial || String(me.id || '').trim() || equipamentoId
      }
    }
  }
  return { clienteId, equipamentoId }
}

/** Resolve equipamento do agendamento para exibição (estado visual, lista, etc.). */
export function resolverEquipamentoAgendamentoParaExibicao(
  ag: Agendamento,
  clientes: ClienteAgendaLike[]
): { equipamento: EquipamentoAgendaLike | null; rotulo: string } {
  if (isAgendamentoPessoal(ag)) return { equipamento: null, rotulo: '' }

  const { clienteId, equipamentoId } = resolveClienteEEquipamentoParaFormularioAgenda(ag, clientes)
  const cli = clientes.find((c) => c.id === clienteId)
  const equipamentos = cli?.equipamentos || []

  const encontrarPorId = (id: string) =>
    equipamentos.find((e) => e.numeroSerie === id || e.id === id) || null

  let eq: EquipamentoAgendaLike | null = null
  if (equipamentoId) eq = encontrarPorId(equipamentoId)

  if (!eq && (ag.equipamento || '').trim() && equipamentos.length) {
    const label = (ag.equipamento || '').trim().toLowerCase()
    eq =
      equipamentos.find((e) => {
        const blob = `${e.tipoEquipamento || ''} ${e.marca || ''} ${e.modelo || ''} ${e.numeroSerie || ''}`.toLowerCase()
        return (
          blob.includes(label) ||
          label.includes((e.modelo || '').toLowerCase()) ||
          (e.numeroSerie && label.includes(String(e.numeroSerie).toLowerCase()))
        )
      }) || null
  }

  if (!eq && equipamentos.length === 1) eq = equipamentos[0]

  const rotuloEq = eq
    ? [eq.tipoEquipamento, eq.marca, eq.modelo].filter((p) => String(p || '').trim()).join(' · ') ||
      String(eq.modelo || '').trim()
    : ''
  const serie = eq?.numeroSerie ? ` (${eq.numeroSerie})` : ''
  const rotulo = rotuloEq ? `${rotuloEq}${serie}` : String(ag.equipamento || '').trim()

  return { equipamento: eq, rotulo }
}

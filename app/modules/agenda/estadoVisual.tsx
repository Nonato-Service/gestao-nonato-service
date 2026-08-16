import type { ReactNode } from 'react'
import type { Agendamento } from './tipos'
import { isAgendamentoPessoal } from './normalize'
import {
  resolverEquipamentoAgendamentoParaExibicao,
  type ClienteAgendaLike,
} from './clienteEquipamento'

/** Bloco de equipamento/tipo de serviço no cartão «estado visual» da agenda. */
export function renderBlocoEquipamentoAgendamentoEstadoVisual(
  ag: Agendamento,
  clientes: ClienteAgendaLike[],
  tr?: Record<string, string | undefined>
): ReactNode {
  if (isAgendamentoPessoal(ag)) return null

  const { equipamento: eq, rotulo } = resolverEquipamentoAgendamentoParaExibicao(ag, clientes)
  const tipoServico = String(ag.tipoServico || '').trim()

  if (!rotulo && !eq && !tipoServico) {
    return (
      <p
        style={{
          margin: '8px 0 0 0',
          fontSize: '10px',
          opacity: 0.7,
          fontStyle: 'italic',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}
      >
        {(tr?.equipamentoNaoEncontrado || 'Equipamento não indicado na agenda').toUpperCase()}
      </p>
    )
  }

  const detalhes: string[] = []
  if (eq) {
    if (eq.tipoEquipamento?.trim()) detalhes.push(`${tr?.tipoEquipamento || 'Tipo'}: ${eq.tipoEquipamento}`)
    if (eq.marca?.trim()) detalhes.push(`${tr?.marca || 'Marca'}: ${eq.marca}`)
    if (eq.modelo?.trim()) detalhes.push(`${tr?.modelo || 'Modelo'}: ${eq.modelo}`)
    if (eq.numeroSerie?.trim()) detalhes.push(`${tr?.numeroSerie || 'N.º Série'}: ${eq.numeroSerie}`)
    if (eq.familia?.trim()) detalhes.push(`${tr?.familia || 'Família'}: ${eq.familia}`)
    if (eq.grupo?.trim()) detalhes.push(`${tr?.grupo || 'Grupo'}: ${eq.grupo}`)
  }

  return (
    <div
      style={{
        marginTop: '8px',
        padding: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.28)',
        borderRadius: '5px',
        border: '1px solid rgba(255, 213, 79, 0.35)',
      }}
    >
      {rotulo ? (
        <p
          style={{
            margin: 0,
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#ffd54f',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            lineHeight: 1.35,
          }}
        >
          🔧 {(tr?.equipamento || 'Equipamento').toUpperCase()}: {rotulo.toUpperCase()}
        </p>
      ) : null}
      {detalhes.map((linha, idx) => (
        <p
          key={`eq-d-${idx}`}
          style={{
            margin: idx === 0 && !rotulo ? 0 : '4px 0 0 0',
            fontSize: '10px',
            opacity: 0.9,
            textTransform: 'uppercase',
            letterSpacing: '0.35px',
            lineHeight: 1.35,
          }}
        >
          {linha.toUpperCase()}
        </p>
      ))}
      {tipoServico ? (
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '10px',
            opacity: 0.88,
            textTransform: 'uppercase',
            letterSpacing: '0.35px',
            lineHeight: 1.35,
          }}
        >
          {(tr?.tipoServico || 'Tipo de Serviço').toUpperCase()}: {tipoServico.toUpperCase()}
        </p>
      ) : null}
    </div>
  )
}

/** Observação de agendamento pessoal no cartão «estado visual». */
export function renderBlocoAssuntoPessoalEstadoVisual(
  ag: Agendamento,
  tr?: Record<string, string | undefined>
): ReactNode {
  if (!isAgendamentoPessoal(ag)) return null
  const obs = String(ag.observacoesTecnicas || '').trim()
  if (!obs) return null
  return (
    <p
      style={{
        margin: '6px 0 0 0',
        fontSize: '10px',
        opacity: 0.88,
        textTransform: 'uppercase',
        letterSpacing: '0.35px',
        lineHeight: 1.35,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {(tr?.observacaoTecnica || 'Observação').toUpperCase()}: {obs.toUpperCase()}
    </p>
  )
}

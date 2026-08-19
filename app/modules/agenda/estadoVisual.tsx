import type { CSSProperties, ReactNode } from 'react'
import type { Agendamento } from './tipos'
import { isAgendamentoPessoal } from './normalize'
import {
  resolverEquipamentoAgendamentoParaExibicao,
  type ClienteAgendaLike,
} from './clienteEquipamento'
import { corFundoMarcadorLegendaAgenda, type ChaveLegendaAgendaVisual } from './estilo'

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

/** Bloco de observação de agendamento pessoal no cartão «estado visual». */
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

const SWATCH_SIZE = 14

function swatchLegendaAgenda(chave: ChaveLegendaAgendaVisual, label: string): ReactNode {
  return (
    <div
      key={chave}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        boxSizing: 'border-box',
        minHeight: 32,
        padding: '6px 10px',
        borderRadius: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.32)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <span
        style={{
          display: 'block',
          width: SWATCH_SIZE,
          height: SWATCH_SIZE,
          borderRadius: 3,
          backgroundColor: corFundoMarcadorLegendaAgenda(chave),
          border: '1px solid rgba(255,255,255,0.28)',
          flexShrink: 0,
        }}
        aria-hidden
      />
      <span
        style={{
          fontSize: 12,
          lineHeight: 1.2,
          color: '#fff',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function secaoLegendaAgenda(
  titulo: string,
  itens: { chave: ChaveLegendaAgendaVisual; label: string }[],
  tituloEstilo: CSSProperties
): ReactNode {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        textAlign: 'left',
      }}
    >
      <p style={tituloEstilo}>{titulo}</p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 8,
          width: '100%',
        }}
      >
        {itens.map(({ chave, label }) => swatchLegendaAgenda(chave, label))}
      </div>
    </div>
  )
}

/**
 * Legenda completa (calendário / estado visual) — alinhada aos marcadores reais.
 * Estados e tipos separados para não misturar «Pessoal» com status operacional.
 * Layout left-aligned e chips uniformes (não herda text-align:center do hero).
 */
export function renderLegendaEstadosAgenda(tr?: Record<string, string | undefined>): ReactNode {
  const estados: { chave: ChaveLegendaAgendaVisual; label: string }[] = [
    { chave: 'confirmado', label: tr?.confirmado || 'Confirmado' },
    { chave: 'em-andamento', label: tr?.emAndamento || 'Em Andamento' },
    { chave: 'pendente', label: tr?.pendente || 'Pendente' },
    { chave: 'concluido', label: tr?.concluido || 'Concluído' },
    { chave: 'cancelado', label: tr?.cancelado || 'Cancelado' },
  ]
  const tipos: { chave: ChaveLegendaAgendaVisual; label: string }[] = [
    { chave: 'pre-agendamento', label: tr?.preAgendamento || 'Pré-agendamento' },
    { chave: 'pessoal', label: tr?.agendaPessoal || 'Pessoal' },
  ]
  const tituloEstilo: CSSProperties = {
    margin: 0,
    width: '100%',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    textAlign: 'left',
    color: 'rgba(0, 255, 122, 0.88)',
    lineHeight: 1.3,
  }
  return (
    <div
      role="group"
      aria-label={tr?.legenda || 'Legenda'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 14,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        textAlign: 'left',
        padding: '12px 14px',
        backgroundColor: 'rgba(0, 0, 0, 0.28)',
        border: '1px solid rgba(0, 200, 83, 0.22)',
        borderRadius: 8,
      }}
    >
      {secaoLegendaAgenda(tr?.agendaLegendaSecaoEstados || 'Estados', estados, tituloEstilo)}
      <div
        aria-hidden
        style={{
          height: 1,
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        }}
      />
      {secaoLegendaAgenda(tr?.agendaLegendaSecaoTipos || 'Tipos', tipos, tituloEstilo)}
    </div>
  )
}

'use client'

import type { ReactNode } from 'react'
import type { AgendaListaSecaoId } from '../modules/agenda'

type ToolbarProps = {
  hint: string
  labelExpandir: string
  labelRetrair: string
  onExpandirTodos: () => void
  onRetrairTodos: () => void
}

/** Barra «Expandir todos / Retrair todos» — mesmo padrão da lista da Agenda. */
export function AgendaListaToolbar({
  hint,
  labelExpandir,
  labelRetrair,
  onExpandirTodos,
  onRetrairTodos,
}: ToolbarProps) {
  return (
    <div className="agenda-lista-toolbar">
      <p className="agenda-lista-toolbar__hint">{hint}</p>
      <div className="agenda-lista-toolbar__actions">
        <button type="button" className="agenda-lista-toolbar__btn" onClick={onExpandirTodos}>
          {labelExpandir}
        </button>
        <button
          type="button"
          className="agenda-lista-toolbar__btn agenda-lista-toolbar__btn--muted"
          onClick={onRetrairTodos}
        >
          {labelRetrair}
        </button>
      </div>
    </div>
  )
}

type SecaoProps = {
  secaoId: AgendaListaSecaoId
  titulo: string
  cor: string
  aberta: boolean
  onToggle: (id: AgendaListaSecaoId) => void
  contagem: number
  hint?: string
  pulse?: 'pendencias' | 'pre'
  collapsedHint: string
  children: ReactNode
  /** Se false, não renderiza (ex.: secção vazia). Default true só quando contagem > 0. */
  forceRender?: boolean
}

/**
 * Cabeçalho de secção recolhível (ponto colorido + título + hint + badge)
 * e corpo com cartões ou mensagem «N registo(s) oculto(s)».
 */
export function AgendaSecaoRecolhivel({
  secaoId,
  titulo,
  cor,
  aberta,
  onToggle,
  contagem,
  hint,
  pulse,
  collapsedHint,
  children,
  forceRender = false,
}: SecaoProps) {
  if (!forceRender && contagem <= 0) return null

  const headerPulseClass =
    pulse === 'pendencias'
      ? 'agenda-section-header agenda-section-header--pulse-pendencias'
      : pulse === 'pre'
        ? 'agenda-section-header agenda-section-header--pulse-pre'
        : 'agenda-section-header'
  const dotPulseClass =
    pulse === 'pendencias'
      ? 'agenda-section-dot agenda-section-dot--pulse-pendencias'
      : pulse === 'pre'
        ? 'agenda-section-dot agenda-section-dot--pulse-pre'
        : undefined

  return (
    <div
      className={`agenda-section-block${aberta ? ' agenda-section-block--open' : ' agenda-section-block--closed'}`}
    >
      <button
        type="button"
        className={`${headerPulseClass} agenda-section-header--toggle`}
        aria-expanded={aberta}
        onClick={() => onToggle(secaoId)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          width: '100%',
          padding: '12px 14px',
          borderRadius: '12px',
          backgroundColor: 'rgba(20,20,20,0.92)',
          border: `1px solid ${cor}55`,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span className="agenda-section-header__left">
          <span className="ui-expand-chevron agenda-section-header__chevron" aria-hidden>
            {aberta ? '▼' : '▶'}
          </span>
          <span
            className={dotPulseClass}
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: cor,
              ...(dotPulseClass ? {} : { boxShadow: `0 0 16px ${cor}55` }),
            }}
            aria-hidden
          />
          <span className="agenda-section-header__title">{titulo}</span>
          {hint ? <span className="agenda-section-header__hint">{hint}</span> : null}
        </span>
        <span
          className="agenda-section-header__badge"
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            backgroundColor: `${cor}22`,
            border: `1px solid ${cor}55`,
            color: '#fff',
            fontSize: '12px',
            fontWeight: 800,
          }}
        >
          {contagem}
        </span>
      </button>
      {aberta ? (
        <div className="agenda-section-cards">{children}</div>
      ) : (
        <p className="agenda-section-collapsed-hint">
          {collapsedHint.replace('{n}', String(contagem))}
        </p>
      )}
    </div>
  )
}

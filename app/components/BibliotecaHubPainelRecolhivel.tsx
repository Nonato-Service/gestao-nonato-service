'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type HubPainelModulo = 'biblioteca' | 'relatorio-servico' | 'relatorio-especial'

const LS_PREFIX_BY_MODULO: Record<HubPainelModulo, string> = {
  biblioteca: 'nonato-biblioteca-painel-',
  'relatorio-servico': 'nonato-relatorio-servico-painel-',
  'relatorio-especial': 'nonato-relatorio-especial-painel-',
}

function lsPrefix(modulo: HubPainelModulo): string {
  return LS_PREFIX_BY_MODULO[modulo]
}

export function readBibliotecaPainelAberto(
  id: string,
  defaultAberto = false,
  modulo: HubPainelModulo = 'biblioteca'
): boolean {
  if (typeof window === 'undefined') return defaultAberto
  try {
    const v = localStorage.getItem(`${lsPrefix(modulo)}${id}`)
    if (v === '1') return true
    if (v === '0') return false
  } catch {
    /* ignorar */
  }
  return defaultAberto
}

export function setBibliotecaPainelAbertoPersist(
  id: string,
  aberto: boolean,
  modulo: HubPainelModulo = 'biblioteca'
): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${lsPrefix(modulo)}${id}`, aberto ? '1' : '0')
  } catch {
    /* ignorar */
  }
}

export function fecharTodosBibliotecaPaineis(
  ids: string[],
  modulo: HubPainelModulo = 'biblioteca'
): void {
  for (const id of ids) setBibliotecaPainelAbertoPersist(id, false, modulo)
}

export type HubPainelStatus = 'ok' | 'incomplete' | 'empty'

type Props = {
  id: string
  titulo: string
  resumo?: string
  icone?: string
  defaultAberto?: boolean
  /** Incrementa ao activar modo compacto — fecha painéis uma vez, sem bloquear reabrir. */
  resetToken?: number
  variant?: 'default' | 'wizard' | 'toolbar' | 'stats'
  className?: string
  labelExpandir?: string
  labelRetrair?: string
  modulo?: HubPainelModulo
  /** Chip visual opcional (ok / incompleto / vazio) — não altera a lógica do painel. */
  status?: HubPainelStatus
  statusLabel?: string
  /** Mostrar o resumo também com o painel aberto (útil em cartões/passos). */
  sempreMostrarResumo?: boolean
  children: React.ReactNode
}

export function BibliotecaHubPainelRecolhivel({
  id,
  titulo,
  resumo,
  icone = '◫',
  defaultAberto = false,
  resetToken = 0,
  variant = 'default',
  className = '',
  labelExpandir = 'Expandir',
  labelRetrair = 'Retrair',
  modulo = 'biblioteca',
  status,
  statusLabel,
  sempreMostrarResumo = false,
  children,
}: Props) {
  const [aberto, setAberto] = useState(() => readBibliotecaPainelAberto(id, defaultAberto, modulo))
  const ultimoResetRef = useRef(resetToken)

  useEffect(() => {
    if (resetToken <= 0 || resetToken === ultimoResetRef.current) return
    ultimoResetRef.current = resetToken
    setAberto(false)
  }, [resetToken])

  useEffect(() => {
    setBibliotecaPainelAbertoPersist(id, aberto, modulo)
  }, [id, aberto, modulo])

  const toggle = useCallback(() => {
    setAberto((v) => !v)
  }, [])

  const fechado = !aberto
  const panelDomId = `${modulo}-painel-${id}`
  const mostrarResumo = Boolean(resumo) && (sempreMostrarResumo || fechado)

  return (
    <section
      className={[
        'biblioteca-hub-painel',
        fechado ? 'biblioteca-hub-painel--fechado' : 'biblioteca-hub-painel--aberto',
        `biblioteca-hub-painel--${variant}`,
        status ? `biblioteca-hub-painel--status-${status}` : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className="biblioteca-hub-painel__cabecalho"
        onClick={toggle}
        aria-expanded={!fechado}
        aria-controls={panelDomId}
        aria-label={fechado ? `${labelExpandir}: ${titulo}` : `${labelRetrair}: ${titulo}`}
      >
        <span className="biblioteca-hub-painel__chevron ui-expand-chevron" aria-hidden>
          {fechado ? '▶' : '▼'}
        </span>
        <span className="biblioteca-hub-painel__icone" aria-hidden>
          {icone}
        </span>
        <span className="biblioteca-hub-painel__titulo">{titulo}</span>
        {status && statusLabel ? (
          <span
            className={`biblioteca-hub-painel__status biblioteca-hub-painel__status--${status}`}
            aria-label={statusLabel}
          >
            {statusLabel}
          </span>
        ) : null}
        {mostrarResumo ? <span className="biblioteca-hub-painel__resumo">{resumo}</span> : null}
      </button>
      <div
        id={panelDomId}
        className={`biblioteca-hub-painel__corpo-wrap${fechado ? ' biblioteca-hub-painel__corpo-wrap--fechado' : ''}`}
        aria-hidden={fechado}
      >
        <div className="biblioteca-hub-painel__corpo">{children}</div>
      </div>
    </section>
  )
}

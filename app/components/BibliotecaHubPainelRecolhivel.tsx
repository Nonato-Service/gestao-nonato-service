'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const LS_PREFIX = 'nonato-biblioteca-painel-'

export function readBibliotecaPainelAberto(id: string, defaultAberto = false): boolean {
  if (typeof window === 'undefined') return defaultAberto
  try {
    const v = localStorage.getItem(`${LS_PREFIX}${id}`)
    if (v === '1') return true
    if (v === '0') return false
  } catch {
    /* ignorar */
  }
  return defaultAberto
}

export function setBibliotecaPainelAbertoPersist(id: string, aberto: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${LS_PREFIX}${id}`, aberto ? '1' : '0')
  } catch {
    /* ignorar */
  }
}

export function fecharTodosBibliotecaPaineis(ids: string[]): void {
  for (const id of ids) setBibliotecaPainelAbertoPersist(id, false)
}

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
  children,
}: Props) {
  const [aberto, setAberto] = useState(() => readBibliotecaPainelAberto(id, defaultAberto))
  const ultimoResetRef = useRef(resetToken)

  useEffect(() => {
    if (resetToken <= 0 || resetToken === ultimoResetRef.current) return
    ultimoResetRef.current = resetToken
    setAberto(false)
  }, [resetToken])

  useEffect(() => {
    setBibliotecaPainelAbertoPersist(id, aberto)
  }, [id, aberto])

  const toggle = useCallback(() => {
    setAberto((v) => !v)
  }, [])

  const fechado = !aberto

  return (
    <section
      className={[
        'biblioteca-hub-painel',
        fechado ? 'biblioteca-hub-painel--fechado' : 'biblioteca-hub-painel--aberto',
        `biblioteca-hub-painel--${variant}`,
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
        aria-controls={`biblioteca-painel-${id}`}
        aria-label={fechado ? `${labelExpandir}: ${titulo}` : `${labelRetrair}: ${titulo}`}
      >
        <span className="biblioteca-hub-painel__chevron" aria-hidden>
          {fechado ? '▸' : '▾'}
        </span>
        <span className="biblioteca-hub-painel__icone" aria-hidden>
          {icone}
        </span>
        <span className="biblioteca-hub-painel__titulo">{titulo}</span>
        {fechado && resumo ? <span className="biblioteca-hub-painel__resumo">{resumo}</span> : null}
      </button>
      <div
        id={`biblioteca-painel-${id}`}
        className={`biblioteca-hub-painel__corpo-wrap${fechado ? ' biblioteca-hub-painel__corpo-wrap--fechado' : ''}`}
        aria-hidden={fechado}
      >
        <div className="biblioteca-hub-painel__corpo">{children}</div>
      </div>
    </section>
  )
}

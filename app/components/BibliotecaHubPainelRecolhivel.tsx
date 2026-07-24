'use client'

import { useCallback, useEffect, useState } from 'react'

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
  forcarFechado?: boolean
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
  forcarFechado = false,
  variant = 'default',
  className = '',
  labelExpandir = 'Expandir',
  labelRetrair = 'Retrair',
  children,
}: Props) {
  const [aberto, setAberto] = useState(() => readBibliotecaPainelAberto(id, defaultAberto))

  useEffect(() => {
    if (forcarFechado && aberto) setAberto(false)
  }, [forcarFechado, aberto])

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
      >
        <span className="biblioteca-hub-painel__icone" aria-hidden>
          {icone}
        </span>
        <span className="biblioteca-hub-painel__titulo">{titulo}</span>
        {fechado && resumo ? <span className="biblioteca-hub-painel__resumo">{resumo}</span> : null}
        <span className="biblioteca-hub-painel__toggle" aria-hidden>
          {fechado ? labelExpandir : labelRetrair}
        </span>
      </button>
      {!fechado ? (
        <div id={`biblioteca-painel-${id}`} className="biblioteca-hub-painel__corpo">
          {children}
        </div>
      ) : null}
    </section>
  )
}

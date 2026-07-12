'use client'

export const BIBLIOTECA_MOSTRAR_PRECOS_KEY = 'nonato-biblioteca-mostrar-precos'

export function lerMostrarPrecosBiblioteca(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(BIBLIOTECA_MOSTRAR_PRECOS_KEY) === '1'
  } catch {
    return false
  }
}

export function gravarMostrarPrecosBiblioteca(visivel: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(BIBLIOTECA_MOSTRAR_PRECOS_KEY, visivel ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function formatPrecoBibliotecaExibicao(preco?: string | null, visivel = false): string {
  const v = String(preco ?? '').trim()
  if (!v) return '—'
  if (!visivel) return '•••'
  return v.includes('€') ? v : `${v}€`
}

type BibliotecaPrecoOlhoToggleProps = {
  ativo: boolean
  onToggle: () => void
  labelMostrar?: string
  labelOcultar?: string
  compacto?: boolean
}

export function BibliotecaPrecoOlhoToggle({
  ativo,
  onToggle,
  labelMostrar = 'Ver preços',
  labelOcultar = 'Ocultar preços',
  compacto = false,
}: BibliotecaPrecoOlhoToggleProps) {
  return (
    <button
      type="button"
      className={`biblioteca-preco-olho-btn${ativo ? ' biblioteca-preco-olho-btn--on' : ''}${compacto ? ' biblioteca-preco-olho-btn--compact' : ''}`}
      onClick={onToggle}
      title={ativo ? labelOcultar : labelMostrar}
      aria-pressed={ativo}
      aria-label={ativo ? labelOcultar : labelMostrar}
    >
      <span className="biblioteca-preco-olho-btn__icon" aria-hidden="true">
        {ativo ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17.94 17.94C16.22 19.27 14.18 20 12 20C5 20 1 12 1 12C2.18 9.29 4.01 7.03 6.24 5.34M9.9 4.24C10.58 4.08 11.28 4 12 4C19 4 23 12 23 12C22.43 13.23 21.66 14.32 20.74 15.24M14.12 14.12C13.79 14.45 13.41 14.71 13 14.89M9.88 9.88C9.55 10.21 9.29 10.59 9.11 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </span>
      {!compacto ? (
        <span className="biblioteca-preco-olho-btn__text">{ativo ? labelOcultar : labelMostrar}</span>
      ) : null}
    </button>
  )
}

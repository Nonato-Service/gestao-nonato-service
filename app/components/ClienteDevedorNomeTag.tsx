'use client'

type Props = {
  label?: string
  className?: string
  variant?: 'inline' | 'card' | 'profile'
}

/** Etiqueta visível «DEVEDOR» junto ao nome da empresa. */
export function ClienteDevedorNomeTag({
  label = 'DEVEDOR',
  className = '',
  variant = 'inline',
}: Props) {
  const text = String(label || 'DEVEDOR').trim().toUpperCase()
  return (
    <span
      className={`cliente-devedor-nome-tag cliente-devedor-nome-tag--${variant}${className ? ` ${className}` : ''}`}
      aria-label={text}
    >
      {text}
    </span>
  )
}

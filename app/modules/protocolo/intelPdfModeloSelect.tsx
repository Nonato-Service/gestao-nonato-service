/** Select do modelo PDF do protocolo (impressão). */

import { clampProtocoloPdfModelo } from './pdfModelo'
import { rotuloProtocoloPdfModelo, type ProtocoloUiCopy } from './intelLabels'

export type ProtocoloPdfModeloSelectProps = {
  value: number
  max: number
  className?: string
  ariaLabel?: string
  title?: string
  optionStyle?: 'label' | 'mn'
  labels?: ProtocoloUiCopy
  onChange: (n: number) => void
}

export function ProtocoloPdfModeloSelect({
  value,
  max,
  className,
  ariaLabel,
  title,
  optionStyle = 'label',
  labels,
  onChange,
}: ProtocoloPdfModeloSelectProps) {
  return (
    <select
      className={className}
      value={String(value)}
      aria-label={ariaLabel || 'Modelo PDF'}
      title={title}
      onChange={(e) => onChange(clampProtocoloPdfModelo(parseInt(e.target.value, 10) || 1))}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n}>
          {optionStyle === 'mn' ? `M${n}` : rotuloProtocoloPdfModelo(n, labels)}
        </option>
      ))}
    </select>
  )
}

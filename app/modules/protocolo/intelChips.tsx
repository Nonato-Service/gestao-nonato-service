import type { ProtocoloIntelFiltroChip } from './intelFiltro'
import { PROTOCOLO_FILTRO_CHIPS } from './intelFiltro'
import { rotuloProtocoloIntelFiltroChip, type ProtocoloUiCopy } from './intelLabels'

export type ProtocoloIntelFiltroChipsProps = {
  selected: ProtocoloIntelFiltroChip
  labels?: ProtocoloUiCopy
  ariaLabel?: string
  onSelect: (chip: ProtocoloIntelFiltroChip) => void
}

/** Chips de filtro inteligente da lista de protocolos. */
export function ProtocoloIntelFiltroChips({
  selected,
  labels,
  ariaLabel,
  onSelect,
}: ProtocoloIntelFiltroChipsProps) {
  return (
    <div className="proto-intel-chips" role="group" aria-label={ariaLabel || 'Filtros'}>
      {PROTOCOLO_FILTRO_CHIPS.map((chip) => (
        <button
          key={chip}
          type="button"
          className={`proto-intel-chip${selected === chip ? ' is-active' : ''}`}
          onClick={() => onSelect(chip)}
        >
          {rotuloProtocoloIntelFiltroChip(chip, labels)}
        </button>
      ))}
    </div>
  )
}

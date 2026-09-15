/** Tags de resumo no cartão do cockpit de protocolo. */

export type ProtocoloCockpitCardTagsProps = {
  modeloLabel: string
  resumoBlocos: string
  resumoPecas: string
  viaLabel?: string
}

export function ProtocoloCockpitCardTags({
  modeloLabel,
  resumoBlocos,
  resumoPecas,
  viaLabel,
}: ProtocoloCockpitCardTagsProps) {
  return (
    <div className="proto-cockpit-card__tags">
      <span className="proto-cockpit-tag proto-cockpit-tag--model">{modeloLabel}</span>
      <span className="proto-cockpit-tag">{resumoBlocos}</span>
      <span className="proto-cockpit-tag">{resumoPecas}</span>
      {viaLabel ? <span className="proto-cockpit-tag proto-cockpit-tag--via">{viaLabel}</span> : null}
    </div>
  )
}

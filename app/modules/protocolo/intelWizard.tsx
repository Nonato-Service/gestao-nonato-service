/** Passos do wizard no rail do editor de protocolo. */

export type ProtocoloCockpitWizardStepsProps = {
  labels: string[]
  passoAtivo: number
  ariaLabel?: string
  onSelect: (passo: number) => void
}

export function ProtocoloCockpitWizardSteps({
  labels,
  passoAtivo,
  ariaLabel,
  onSelect,
}: ProtocoloCockpitWizardStepsProps) {
  return (
    <div className="proto-cockpit-rail__steps" role="tablist" aria-label={ariaLabel || 'Passos'}>
      {labels.map((lab, wi) => (
        <button
          key={lab + wi}
          type="button"
          role="tab"
          aria-selected={passoAtivo === wi + 1}
          className={`proto-cockpit-rail__step${passoAtivo === wi + 1 ? ' is-active' : ''}`}
          onClick={() => onSelect(wi + 1)}
        >
          <span className="proto-cockpit-rail__num">{wi + 1}</span>
          <span>{lab}</span>
        </button>
      ))}
    </div>
  )
}

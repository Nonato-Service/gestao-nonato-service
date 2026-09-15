/** Acções rápidas (PDF / email / WA / reabrir) no rail do cartão. */

export type ProtocoloCockpitCardLane = 'exec' | 'arquivo'

export type ProtocoloCockpitCardQuickProps = {
  lane: ProtocoloCockpitCardLane
  pdfLabel?: string
  emailLabel?: string
  waLabel?: string
  reabrirLabel?: string
  onPdf: () => void
  onEmail?: () => void
  onWhatsApp?: () => void
  onReabrir?: () => void
}

export function ProtocoloCockpitCardQuick({
  lane,
  pdfLabel = 'PDF',
  emailLabel = 'Email',
  waLabel = 'WA',
  reabrirLabel = 'Reabrir',
  onPdf,
  onEmail,
  onWhatsApp,
  onReabrir,
}: ProtocoloCockpitCardQuickProps) {
  return (
    <div className={`proto-cockpit-card__quick${lane === 'arquivo' ? ' proto-cockpit-card__quick--dual' : ''}`}>
      <button type="button" className="proto-action-btn proto-cockpit-btn proto-cockpit-btn--pdf" onClick={onPdf}>
        {pdfLabel}
      </button>
      {lane === 'exec' ? (
        <>
          <button
            type="button"
            className="proto-action-btn proto-cockpit-btn proto-cockpit-btn--email"
            onClick={onEmail}
          >
            {emailLabel}
          </button>
          <button
            type="button"
            className="proto-action-btn proto-cockpit-btn proto-cockpit-btn--wa"
            onClick={onWhatsApp}
          >
            {waLabel}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="proto-action-btn proto-cockpit-btn proto-cockpit-btn--ghost"
          onClick={onReabrir}
        >
          ↩ {reabrirLabel}
        </button>
      )}
    </div>
  )
}

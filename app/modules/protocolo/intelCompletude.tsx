/** Barra de completude do formulário de protocolo. */

export type ProtocoloCompletudeBarProps = {
  percent: number
  pronto: boolean
  titulo: string
}

export function ProtocoloCompletudeBar({ percent, pronto, titulo }: ProtocoloCompletudeBarProps) {
  const pct = Number.isFinite(percent) ? Math.max(0, Math.min(100, Math.round(percent))) : 0
  return (
    <div className="proto-completude" aria-live="polite">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          marginBottom: 6,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {titulo}
        </span>
        <span style={{ fontSize: 12, fontWeight: 900, color: pronto ? '#4ade80' : '#fbbf24' }}>
          {pct}%
        </span>
      </div>
      <div className="proto-completude__bar">
        <div className="proto-completude__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

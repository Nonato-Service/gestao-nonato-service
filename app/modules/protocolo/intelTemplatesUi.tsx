import { PROTOCOLO_TEMPLATE_IDS, type ProtocoloTemplateId } from './intelTemplates'
import { rotuloProtocoloTemplate, type ProtocoloUiCopy } from './intelLabels'

export type ProtocoloTemplateGridProps = {
  labels?: ProtocoloUiCopy
  onSelect: (id: ProtocoloTemplateId) => void
}

/** Grelha de modelos rápidos no editor de protocolo. */
export function ProtocoloTemplateGrid({ labels, onSelect }: ProtocoloTemplateGridProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: '#5eead4',
          marginBottom: 8,
          textTransform: 'uppercase',
        }}
      >
        {labels?.protocolosServicoTemplatesTitulo || 'Modelos rápidos'}
      </div>
      {labels?.protocolosServicoTemplatesHint ? (
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#64748b' }}>{labels.protocolosServicoTemplatesHint}</p>
      ) : null}
      <div className="proto-template-grid">
        {PROTOCOLO_TEMPLATE_IDS.map((tid) => (
          <button key={tid} type="button" className="proto-template-btn" onClick={() => onSelect(tid)}>
            + {rotuloProtocoloTemplate(tid, labels)}
          </button>
        ))}
      </div>
    </div>
  )
}

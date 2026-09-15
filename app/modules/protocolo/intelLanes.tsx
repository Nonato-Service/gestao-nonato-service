import type { ProtocoloUiCopy } from './intelLabels'

export type ProtocoloHubVista = 'exec' | 'arquivo'

export type ProtocoloCockpitLanesProps = {
  vista: ProtocoloHubVista
  countExec: number
  countArquivo: number
  labels?: ProtocoloUiCopy
  onChange: (vista: ProtocoloHubVista) => void
}

/** Separador «Em execução» / «Arquivo» do cockpit de protocolos. */
export function ProtocoloCockpitLanes({
  vista,
  countExec,
  countArquivo,
  labels,
  onChange,
}: ProtocoloCockpitLanesProps) {
  return (
    <div className="proto-cockpit-lanes" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={vista === 'exec'}
        className={`proto-cockpit-lane${vista === 'exec' ? ' is-active' : ''}`}
        onClick={() => onChange('exec')}
      >
        {labels?.protocolosServicoListaTituloEmExecucao || 'Em execução'}
        <span className="proto-cockpit-lane__count">{countExec}</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={vista === 'arquivo'}
        className={`proto-cockpit-lane${vista === 'arquivo' ? ' is-active is-active--done' : ''}`}
        onClick={() => onChange('arquivo')}
      >
        {labels?.protocolosServicoExecutadosTitulo || 'Arquivo'}
        <span className="proto-cockpit-lane__count">{countArquivo}</span>
      </button>
    </div>
  )
}

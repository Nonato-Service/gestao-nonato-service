/** Grupo por cliente no feed «Em execução» do cockpit. */

export type ProtocoloCockpitGroupProps = {
  title: string
  count: number
  children: React.ReactNode
}

export function ProtocoloCockpitGroup({ title, count, children }: ProtocoloCockpitGroupProps) {
  return (
    <section className="proto-cockpit-group">
      <div className="proto-cockpit-group__head">
        <h3 className="proto-cockpit-group__title">{title}</h3>
        <span className="proto-cockpit-group__sub">{count}</span>
      </div>
      <div className="proto-cockpit-feed">{children}</div>
    </section>
  )
}

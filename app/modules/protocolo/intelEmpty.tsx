/** Estado vazio do feed do cockpit de protocolos. */

export type ProtocoloCockpitEmptyProps = {
  children?: React.ReactNode
  ariaHidden?: boolean
}

export function ProtocoloCockpitEmpty({ children, ariaHidden }: ProtocoloCockpitEmptyProps) {
  return (
    <div className="proto-cockpit-empty" aria-hidden={ariaHidden || undefined}>
      {children}
    </div>
  )
}

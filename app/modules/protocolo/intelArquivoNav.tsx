/** Navegação rápida por cliente no arquivo de protocolos (puro; scroll fica no caller). */

export type ProtocoloArquivoNavItem = {
  id: string
  nome: string
  count: number
}

export function encurtarNomeProtocoloArquivoNav(nome: string, max = 28): string {
  const t = (nome || '').trim()
  return t.length > max ? `${t.slice(0, max)}…` : t
}

export type ProtocoloArquivoNavProps = {
  items: ProtocoloArquivoNavItem[]
  ariaLabel?: string
  moreLabel?: string
  onSelect: (id: string) => void
  onMore?: () => void
}

export function ProtocoloArquivoNav({
  items,
  ariaLabel,
  moreLabel,
  onSelect,
  onMore,
}: ProtocoloArquivoNavProps) {
  return (
    <nav className="proto-arquivo-nav" aria-label={ariaLabel || 'Ir para cliente'}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="proto-arquivo-nav__pill"
          onClick={() => onSelect(item.id)}
        >
          {encurtarNomeProtocoloArquivoNav(item.nome)}
          <span className="proto-arquivo-nav__count">{item.count}</span>
        </button>
      ))}
      {onMore && moreLabel ? (
        <button
          type="button"
          className="proto-arquivo-nav__pill"
          style={{ fontWeight: 700 }}
          onClick={onMore}
        >
          {moreLabel}
        </button>
      ) : null}
    </nav>
  )
}

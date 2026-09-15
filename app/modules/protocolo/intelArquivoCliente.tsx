/** Cabeçalho e secção de cliente no arquivo de protocolos. */

export type ProtocoloArquivoClienteHeadProps = {
  nome: string
  meta: string
  accordion?: boolean
  aberto?: boolean
  onToggle?: () => void
}

export function ProtocoloArquivoClienteHead({
  nome,
  meta,
  accordion,
  aberto,
  onToggle,
}: ProtocoloArquivoClienteHeadProps) {
  if (accordion) {
    return (
      <button
        type="button"
        className="proto-arquivo-cliente__head"
        aria-expanded={aberto}
        onClick={onToggle}
      >
        <span className="proto-arquivo-cliente__name">{nome}</span>
        <span className="proto-arquivo-cliente__meta">{meta}</span>
        <span className="proto-arquivo-cliente__chev" aria-hidden="true">
          {aberto ? '▾' : '▸'}
        </span>
      </button>
    )
  }
  return (
    <div className="proto-arquivo-cliente__head proto-arquivo-cliente__head--static">
      <span className="proto-arquivo-cliente__name">{nome}</span>
      <span className="proto-arquivo-cliente__meta">{meta}</span>
    </div>
  )
}

export type ProtocoloArquivoClienteSectionProps = {
  id: string
  aberto?: boolean
  children: React.ReactNode
}

export function ProtocoloArquivoClienteSection({
  id,
  aberto,
  children,
}: ProtocoloArquivoClienteSectionProps) {
  return (
    <section id={id} className={`proto-arquivo-cliente${aberto ? ' is-open' : ''}`}>
      {children}
    </section>
  )
}

import Link from 'next/link'

export default function DemoLinkInvalidoPage() {
  return (
    <div className="ns-init-shell">
      <div className="ns-init-card ns-init-card--error">
        <div className="ns-init-icon" aria-hidden>
          !
        </div>
        <h1 className="ns-init-title ns-init-title--error">Link inválido</h1>
        <p className="ns-init-lead">
          Este link de demonstração não existe, expirou ou já foi utilizado. Solicite um novo acesso ao administrador.
        </p>
        <Link href="/" className="ns-init-cta">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}

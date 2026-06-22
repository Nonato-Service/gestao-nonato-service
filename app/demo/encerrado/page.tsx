import Link from 'next/link'

export default function DemoEncerradoPage() {
  return (
    <div className="ns-init-shell">
      <div className="ns-init-card">
        <div className="ns-init-icon" aria-hidden>
          ✓
        </div>
        <h1 className="ns-init-title">Demonstração encerrada</h1>
        <p className="ns-init-lead">
          Obrigado por experimentar o Gestor Demo da Nonato Service. A versão de produção completa não está disponível
          neste ambiente de teste.
        </p>
        <p className="ns-init-note">
          Para continuar a utilizar o sistema com todos os módulos, contacte a Nonato Service e solicite acesso
          definitivo.
        </p>
        <Link href="/" className="ns-init-cta">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}

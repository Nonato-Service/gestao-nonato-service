'use client'

import type { AbrirEnvioDocumentoClienteOpts } from '../context/DocumentoEnvioClienteContext'

type Props = {
  abrirEnvio: (opts: AbrirEnvioDocumentoClienteOpts) => void
  subject: string
  body: string
  clienteId?: string
  clienteNome?: string
  relatorio?: { clienteId?: string; cliente?: string }
  onOpenPdf?: () => void
  title?: string
  className?: string
  emailLabel?: string
  whatsLabel?: string
  compact?: boolean
}

export function DocumentoEnvioAcoes({
  abrirEnvio,
  subject,
  body,
  clienteId,
  clienteNome,
  relatorio,
  onOpenPdf,
  title,
  className = '',
  emailLabel = 'E-mail',
  whatsLabel = 'WhatsApp',
  compact = false,
}: Props) {
  const base = {
    title,
    subject,
    body,
    clienteId,
    clienteNome,
    relatorio,
    onOpenPdf,
  }
  if (compact) {
    return (
      <span className={`doc-envio-acoes doc-envio-acoes--compact${className ? ` ${className}` : ''}`}>
        <button
          type="button"
          className="doc-envio-acoes__btn doc-envio-acoes__btn--email"
          title={emailLabel}
          onClick={() => abrirEnvio({ ...base, defaultChannel: 'email' })}
        >
          📧
        </button>
        <button
          type="button"
          className="doc-envio-acoes__btn doc-envio-acoes__btn--wa"
          title={whatsLabel}
          onClick={() => abrirEnvio({ ...base, defaultChannel: 'whatsapp' })}
        >
          💬
        </button>
      </span>
    )
  }
  return (
    <span className={`doc-envio-acoes${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="doc-envio-acoes__btn doc-envio-acoes__btn--email"
        onClick={() => abrirEnvio({ ...base, defaultChannel: 'email' })}
      >
        📧 {emailLabel}
      </button>
      <button
        type="button"
        className="doc-envio-acoes__btn doc-envio-acoes__btn--wa"
        onClick={() => abrirEnvio({ ...base, defaultChannel: 'whatsapp' })}
      >
        💬 {whatsLabel}
      </button>
    </span>
  )
}

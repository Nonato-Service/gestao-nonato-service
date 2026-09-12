/** Configuração do modal de envio de documento ao cliente (e-mail / WhatsApp). */

export type DocumentoEnvioCanal = 'email' | 'whatsapp'

export type DocumentoEnvioClienteConfig = {
  title?: string
  subject: string
  body: string
  initialClienteId?: string
  defaultChannel?: DocumentoEnvioCanal
  pdfHint?: string
  onOpenPdf?: () => void
}

export type AbrirEnvioDocumentoClienteOpts = {
  title?: string
  subject: string
  body: string
  clienteId?: string
  clienteNome?: string
  relatorio?: { clienteId?: string; cliente?: string }
  defaultChannel?: DocumentoEnvioCanal
  pdfHint?: string
  onOpenPdf?: () => void
}

export function buildDocumentoEnvioClienteConfig(
  opts: AbrirEnvioDocumentoClienteOpts,
  clienteIdResolvido?: string
): DocumentoEnvioClienteConfig {
  return {
    title: opts.title,
    subject: opts.subject,
    body: opts.body,
    initialClienteId: clienteIdResolvido ?? opts.clienteId,
    defaultChannel: opts.defaultChannel,
    pdfHint: opts.pdfHint,
    onOpenPdf: opts.onOpenPdf,
  }
}

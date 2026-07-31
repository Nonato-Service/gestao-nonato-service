'use client'

import { useEffect, useMemo, useState } from 'react'
import { ClienteAlfabetoPicker } from './ClienteAlfabetoPicker'
import type { ClienteAlfabetoRow } from '../lib/clienteAlfabetoBusca'
import {
  abrirEmailCliente,
  abrirWhatsAppCliente,
  prefillContactFromCliente,
} from '../lib/clienteContactEnvio'

export type DocumentoEnvioClienteConfig = {
  title?: string
  subject: string
  body: string
  initialClienteId?: string
  defaultChannel?: 'email' | 'whatsapp'
  pdfHint?: string
  onOpenPdf?: () => void
}

type Props = {
  open: boolean
  onClose: () => void
  config: DocumentoEnvioClienteConfig | null
  clientes: ClienteAlfabetoRow[]
  language?: string
  labels?: Record<string, string | undefined>
}

export function DocumentoEnvioClienteModal({
  open,
  onClose,
  config,
  clientes,
  language = 'pt-BR',
  labels: L = {},
}: Props) {
  const [canal, setCanal] = useState<'email' | 'whatsapp'>(config?.defaultChannel ?? 'email')
  const [clienteId, setClienteId] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')

  const clienteSelecionado = useMemo(
    () => (clienteId ? clientes.find((c) => c.id === clienteId) : undefined),
    [clienteId, clientes]
  )

  useEffect(() => {
    if (!open || !config) return
    setCanal(config.defaultChannel ?? 'email')
    const inicial = config.initialClienteId
      ? clientes.find((c) => c.id === config.initialClienteId)
      : null
    if (inicial) {
      const pre = prefillContactFromCliente(inicial)
      setClienteId(pre.clienteId)
      setEmail(pre.email)
      setTelefone(pre.telefoneWhatsApp)
    } else {
      setClienteId('')
      setEmail('')
      setTelefone('')
    }
  }, [open, config, clientes])

  if (!open || !config) return null

  const aplicarCliente = (c: ClienteAlfabetoRow) => {
    const pre = prefillContactFromCliente(c)
    setClienteId(pre.clienteId)
    setEmail(pre.email)
    setTelefone(pre.telefoneWhatsApp)
  }

  const limparCliente = () => {
    setClienteId('')
    setEmail('')
    setTelefone('')
  }

  const handleEnviarEmail = () => {
    if (!email.trim()) {
      window.alert(L.envioInformeEmail || 'Indique o e-mail do cliente.')
      return
    }
    abrirEmailCliente({ email, subject: config.subject, body: config.body })
  }

  const handleEnviarWhatsApp = () => {
    if (!telefone.trim()) {
      window.alert(L.envioInformeTelefone || 'Indique o telemóvel do cliente para WhatsApp.')
      return
    }
    abrirWhatsAppCliente({ telefone, text: config.body })
  }

  return (
    <div className="doc-envio-modal__backdrop" role="presentation" onClick={onClose}>
      <div
        className="doc-envio-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-envio-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="doc-envio-modal__head">
          <h2 id="doc-envio-modal-title" className="doc-envio-modal__title">
            {config.title || L.envioDocumentoTitulo || 'Enviar documento ao cliente'}
          </h2>
          <p className="doc-envio-modal__hint">
            {config.pdfHint ||
              L.envioDocumentoPdfHint ||
              'Gere o PDF e anexe manualmente ao e-mail ou à conversa WhatsApp.'}
          </p>
        </header>

        <div className="doc-envio-modal__cliente">
          <p className="doc-envio-modal__section-label">
            {L.cliente || 'Cliente'} — {L.envioSelecioneCliente || 'selecione para preencher contactos'}
          </p>
          {clienteSelecionado ? (
            <div className="doc-envio-modal__selected">
              <strong>{clienteSelecionado.nomeEmpresa}</strong>
              <button type="button" className="doc-envio-modal__clear" onClick={limparCliente}>
                {L.limpar || 'Limpar'}
              </button>
            </div>
          ) : null}
          <ClienteAlfabetoPicker
            clientes={clientes}
            selectedId={clienteId}
            onSelect={aplicarCliente}
            onClear={limparCliente}
            language={language}
            showSelectedChip={false}
            listMaxHeight={220}
            labels={{
              buscar: L.buscarCliente,
              nenhumEncontrado: L.nenhumEncontrado,
              toqueFiltrar: L.envioToqueFiltrar,
              clientes: L.clientes,
              de: L.de,
              mostrando: L.mostrando,
            }}
          />
        </div>

        <div className="doc-envio-modal__canais" role="tablist" aria-label={L.envioCanal || 'Canal de envio'}>
          <button
            type="button"
            role="tab"
            aria-selected={canal === 'email'}
            className={`doc-envio-modal__canal${canal === 'email' ? ' is-active' : ''}`}
            onClick={() => setCanal('email')}
          >
            📧 {L.enviarPorEmail || 'E-mail'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={canal === 'whatsapp'}
            className={`doc-envio-modal__canal doc-envio-modal__canal--wa${canal === 'whatsapp' ? ' is-active' : ''}`}
            onClick={() => setCanal('whatsapp')}
          >
            💬 {L.enviarPorWhatsApp || 'WhatsApp'}
          </button>
        </div>

        {canal === 'email' ? (
          <label className="doc-envio-modal__field">
            <span>{L.email || 'E-mail do cliente'}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setClienteId('')
              }}
              placeholder={L.envioEmailPlaceholder || 'cliente@empresa.com'}
            />
          </label>
        ) : (
          <label className="doc-envio-modal__field">
            <span>{L.envioWhatsCliente || 'Telemóvel — WhatsApp'}</span>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => {
                setTelefone(e.target.value.replace(/\D/g, ''))
                setClienteId('')
              }}
              placeholder={L.envioTelefonePlaceholder || '351912345678'}
            />
          </label>
        )}

        <div className="doc-envio-modal__preview">
          <span className="doc-envio-modal__section-label">{L.assunto || 'Assunto / mensagem'}</span>
          <p className="doc-envio-modal__subject">{config.subject}</p>
          <textarea readOnly value={config.body} rows={6} className="doc-envio-modal__body" />
        </div>

        <footer className="doc-envio-modal__actions">
          <button type="button" className="doc-envio-modal__btn doc-envio-modal__btn--ghost" onClick={onClose}>
            {L.cancelar || L.cancel || 'Cancelar'}
          </button>
          <div className="doc-envio-modal__actions-right">
            {config.onOpenPdf ? (
              <button
                type="button"
                className="doc-envio-modal__btn doc-envio-modal__btn--pdf"
                onClick={() => config.onOpenPdf?.()}
              >
                📄 {L.gerarPDF || 'Gerar PDF'}
              </button>
            ) : null}
            {canal === 'email' ? (
              <button
                type="button"
                className="doc-envio-modal__btn doc-envio-modal__btn--email"
                onClick={handleEnviarEmail}
              >
                📧 {L.abrirEmail || 'Abrir e-mail'}
              </button>
            ) : (
              <button
                type="button"
                className="doc-envio-modal__btn doc-envio-modal__btn--wa"
                onClick={handleEnviarWhatsApp}
              >
                💬 {L.abrirWhatsApp || 'Abrir WhatsApp'}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}

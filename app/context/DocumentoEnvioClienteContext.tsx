'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import {
  DocumentoEnvioClienteModal,
  type DocumentoEnvioClienteConfig,
} from '../components/DocumentoEnvioClienteModal'
import { findClienteParaEnvio } from '../lib/clienteContactEnvio'
import type { ClienteAlfabetoRow } from '../lib/clienteAlfabetoBusca'

export type AbrirEnvioDocumentoClienteOpts = {
  title?: string
  subject: string
  body: string
  clienteId?: string
  clienteNome?: string
  relatorio?: { clienteId?: string; cliente?: string }
  defaultChannel?: 'email' | 'whatsapp'
  pdfHint?: string
  onOpenPdf?: () => void
}

type AbrirEnvioFn = (opts: AbrirEnvioDocumentoClienteOpts) => void

const DocumentoEnvioCtx = createContext<AbrirEnvioFn | null>(null)

type ProviderProps = {
  children: ReactNode
  clientes: ClienteAlfabetoRow[]
  language?: string
  labels?: Record<string, string | undefined>
  /** Permite ao componente pai (NonatoMainApp) chamar abrirEnvio sem hook */
  apiRef?: MutableRefObject<AbrirEnvioFn | null>
}

export function DocumentoEnvioClienteProvider({
  children,
  clientes,
  language = 'pt-BR',
  labels = {},
  apiRef,
}: ProviderProps) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<DocumentoEnvioClienteConfig | null>(null)
  const clientesRef = useRef(clientes)
  clientesRef.current = clientes

  const abrirEnvioDocumentoCliente = useCallback<AbrirEnvioFn>((opts) => {
    const c = findClienteParaEnvio(clientesRef.current, {
      clienteId: opts.clienteId,
      clienteNome: opts.clienteNome,
      relatorio: opts.relatorio,
    })
    setConfig({
      title: opts.title,
      subject: opts.subject,
      body: opts.body,
      initialClienteId: c?.id ?? opts.clienteId,
      defaultChannel: opts.defaultChannel,
      pdfHint: opts.pdfHint,
      onOpenPdf: opts.onOpenPdf,
    })
    setOpen(true)
  }, [])

  useEffect(() => {
    if (apiRef) apiRef.current = abrirEnvioDocumentoCliente
    return () => {
      if (apiRef) apiRef.current = null
    }
  }, [apiRef, abrirEnvioDocumentoCliente])

  return (
    <DocumentoEnvioCtx.Provider value={abrirEnvioDocumentoCliente}>
      {children}
      <DocumentoEnvioClienteModal
        open={open}
        onClose={() => {
          setOpen(false)
          setConfig(null)
        }}
        config={config}
        clientes={clientes}
        language={language}
        labels={labels}
      />
    </DocumentoEnvioCtx.Provider>
  )
}

export function useDocumentoEnvioCliente(): AbrirEnvioFn {
  const fn = useContext(DocumentoEnvioCtx)
  if (!fn) {
    throw new Error('useDocumentoEnvioCliente deve ser usado dentro de DocumentoEnvioClienteProvider')
  }
  return fn
}

/** Versão opcional — não lança erro se provider ausente */
export function useDocumentoEnvioClienteOptional(): AbrirEnvioFn | null {
  return useContext(DocumentoEnvioCtx)
}

export function buildTextoEnvioRelatorioServico(rel: {
  numero?: string
  cliente?: string
  data?: string
  maquinaModelo?: string
  numeroMaquina?: string
}) {
  return `Prezado(a),\n\nSegue em anexo o relatório de serviço n.º ${rel.numero || '—'}.\n\nCliente: ${rel.cliente || '—'}\nData: ${rel.data || '—'}\nEquipamento: ${rel.maquinaModelo || '—'}${rel.numeroMaquina ? ` (${rel.numeroMaquina})` : ''}\n\nAtenciosamente,\nNonato Service`
}

export function buildTextoEnvioRelatorioEspecial(rel: {
  numero?: string
  cliente?: string
  data?: string
  horasTrabalho?: string
  kmsPercorridos?: string
  equipamentos?: Array<{ equipamentoId?: string; maquinaModelo?: string; numeroMaquina?: string }>
}) {
  const linhasEquip = (rel.equipamentos || [])
    .map((e) => {
      const partes = [e.equipamentoId, e.maquinaModelo, e.numeroMaquina].filter(Boolean)
      return partes.length ? `• ${partes.join(' · ')}` : ''
    })
    .filter(Boolean)
    .join('\n')
  return `Prezado(a),\n\nSegue em anexo o relatório de serviço n.º ${rel.numero || '—'}.\n\nCliente: ${rel.cliente || '—'}\nData: ${rel.data || '—'}${
    linhasEquip ? `\nEquipamentos:\n${linhasEquip}` : ''
  }\nHoras de trabalho: ${rel.horasTrabalho || '—'}\nKM: ${rel.kmsPercorridos || '—'}\n\nAtenciosamente,\nNonato Service`
}

export function buildTextoEnvioOrcamento(orc: { numeroOrcamento?: string; clienteNome?: string }) {
  return `Prezado(a),\n\nSegue em anexo o orçamento ${orc.numeroOrcamento || '—'}${orc.clienteNome ? ` — ${orc.clienteNome}` : ''}.\n\nAtenciosamente,\nNonato Service`
}

export function buildTextoEnvioGenerico(titulo: string, detalhe?: string) {
  return `Prezado(a),\n\nSegue em anexo: ${titulo}${detalhe ? `\n\n${detalhe}` : ''}\n\nAtenciosamente,\nNonato Service`
}

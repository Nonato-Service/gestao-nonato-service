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

type EnvioTextoLabels = Record<string, string | undefined> | null | undefined

function Lenvio(labels: EnvioTextoLabels, key: string, fallback: string): string {
  const v = labels?.[key]
  return v != null && String(v).trim() !== '' ? String(v) : fallback
}

export function buildTextoEnvioRelatorioServico(
  rel: {
    numero?: string
    cliente?: string
    data?: string
    maquinaModelo?: string
    numeroMaquina?: string
  },
  labels?: EnvioTextoLabels
) {
  const prezado = Lenvio(labels, 'envioDocPrezado', 'Prezado(a),')
  const anexo = Lenvio(
    labels,
    'envioAnexoRelatorioServicoNumero',
    'Segue em anexo o relatório de serviço n.º {numero}.'
  ).replace('{numero}', rel.numero || '—')
  const cliente = Lenvio(labels, 'cliente', 'Cliente')
  const data = Lenvio(labels, 'data', 'Data')
  const equipamento = Lenvio(labels, 'equipamento', 'Equipamento')
  const atenciosamente = Lenvio(labels, 'envioDocAtenciosamente', 'Atenciosamente,')
  return `${prezado}\n\n${anexo}\n\n${cliente}: ${rel.cliente || '—'}\n${data}: ${rel.data || '—'}\n${equipamento}: ${rel.maquinaModelo || '—'}${rel.numeroMaquina ? ` (${rel.numeroMaquina})` : ''}\n\n${atenciosamente}\nNonato Service`
}

export function buildTextoEnvioRelatorioEspecial(
  rel: {
    numero?: string
    cliente?: string
    data?: string
    horasTrabalho?: string
    kmsPercorridos?: string
    equipamentos?: Array<{ equipamentoId?: string; maquinaModelo?: string; numeroMaquina?: string }>
  },
  labels?: EnvioTextoLabels
) {
  const linhasEquip = (rel.equipamentos || [])
    .map((e) => {
      const partes = [e.equipamentoId, e.maquinaModelo, e.numeroMaquina].filter(Boolean)
      return partes.length ? `• ${partes.join(' · ')}` : ''
    })
    .filter(Boolean)
    .join('\n')
  const prezado = Lenvio(labels, 'envioDocPrezado', 'Prezado(a),')
  const anexo = Lenvio(
    labels,
    'envioAnexoRelatorioServicoNumero',
    'Segue em anexo o relatório de serviço n.º {numero}.'
  ).replace('{numero}', rel.numero || '—')
  const cliente = Lenvio(labels, 'cliente', 'Cliente')
  const data = Lenvio(labels, 'data', 'Data')
  const equipamentosTitulo = Lenvio(labels, 'equipamentosTitulo', 'Equipamentos')
  const horas = Lenvio(labels, 'horasTrabalho', 'Horas de Trabalho')
  const km = Lenvio(labels, 'km', 'KM')
  const atenciosamente = Lenvio(labels, 'envioDocAtenciosamente', 'Atenciosamente,')
  return `${prezado}\n\n${anexo}\n\n${cliente}: ${rel.cliente || '—'}\n${data}: ${rel.data || '—'}${
    linhasEquip ? `\n${equipamentosTitulo}:\n${linhasEquip}` : ''
  }\n${horas}: ${rel.horasTrabalho || '—'}\n${km}: ${rel.kmsPercorridos || '—'}\n\n${atenciosamente}\nNonato Service`
}

export function buildTextoEnvioOrcamento(
  orc: { numeroOrcamento?: string; clienteNome?: string },
  labels?: EnvioTextoLabels
) {
  const prezado = Lenvio(labels, 'envioDocPrezado', 'Prezado(a),')
  const anexo = Lenvio(labels, 'envioAnexoOrcamento', 'Segue em anexo o orçamento {numero}.').replace(
    '{numero}',
    orc.numeroOrcamento || '—'
  )
  const atenciosamente = Lenvio(labels, 'envioDocAtenciosamente', 'Atenciosamente,')
  const clienteParte = orc.clienteNome ? ` — ${orc.clienteNome}` : ''
  return `${prezado}\n\n${anexo}${clienteParte}\n\n${atenciosamente}\nNonato Service`
}

export function buildTextoEnvioGenerico(titulo: string, detalhe?: string, labels?: EnvioTextoLabels) {
  const prezado = Lenvio(labels, 'envioDocPrezado', 'Prezado(a),')
  const anexo = Lenvio(labels, 'envioAnexoGenerico', 'Segue em anexo: {titulo}').replace(
    '{titulo}',
    titulo
  )
  const atenciosamente = Lenvio(labels, 'envioDocAtenciosamente', 'Atenciosamente,')
  return `${prezado}\n\n${anexo}${detalhe ? `\n\n${detalhe}` : ''}\n\n${atenciosamente}\nNonato Service`
}

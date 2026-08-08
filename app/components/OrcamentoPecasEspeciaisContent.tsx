'use client'

import React, { useState, useMemo, useEffect, useId, useCallback, useRef } from 'react'
import { filtrarPecasBibliotecaPorBusca } from '../lib/pecaCodigoBusca'
import {
  calcularTotaisDesdeValorFinalComIva,
  calcularTotaisIvaPecasEspeciais,
  formatarPrecoOrcamentoEur,
  gerarNumeroOfertaPecasEspeciais,
  openOrcamentoPecasEspeciaisPdf,
  type OrcamentoPecasEspeciaisLinhaPdf,
} from '../lib/orcamentoPecasEspeciaisPdf'

export type ModoCalculoTotalPecasEsp = 'linhas' | 'valor-final'
import { codigoClienteExibicao } from '../lib/clienteCodigoUtils'
import { formatClienteIdentidadeTexto } from './ClienteIdentidadeChips'
import { PdfModeloPickerField } from './PdfModeloPickerField'
import { loadPdfModeloPadrao, persistPdfModeloPadrao } from '../lib/pdfModelStorage'
import { ClienteAlfabetoPicker } from './ClienteAlfabetoPicker'
import {
  useDocumentoEnvioCliente,
  buildTextoEnvioOrcamento,
} from '../context/DocumentoEnvioClienteContext'

export type ClienteOrcamentoPecasEsp = {
  id: string
  nomeEmpresa: string
  morada?: string
  localidade?: string
  codigoPostal?: string
  pais?: string
  telefones?: string
  email?: string
  contato?: string
  codigoCliente?: string
}

export type PecaBibliotecaPecasEsp = {
  id: string
  codigo: string
  nome: string
  descricao?: string
  imagem?: string
  preco?: string
}

export type LinhaOrcamentoPecasEsp = {
  rowId: string
  numeroArtigo: string
  quantidade: string
  precoUnitario: string
  titulo: string
  descricao: string
  descricaoOriginal: string
  infoExtra: string
  imagem: string
  pecaId: string
}

export type OrcamentoPecasEspeciaisSalvo = {
  id: string
  numeroOferta: string
  dataIso: string
  clienteId: string
  clienteNome: string
  clienteCodigo: string
  contactoNome: string
  contactoTelefone: string
  contactoEmail: string
  linhas: LinhaOrcamentoPecasEsp[]
  linhaEmbalagemTitulo: string
  linhaEmbalagemDescricao: string
  condicoesPagamento: string
  notasRodape: string
  totalLiquido: string
  totalIva?: string
  totalComIva?: string
  incluirIva?: boolean
  taxaIva?: number
  modoCalculoTotal?: ModoCalculoTotalPecasEsp
  valorFinalComIva?: string
  dataCriacao: string
}

const STORAGE_KEY = 'nonato-orcamentos-pecas-especiais'
const DRAFT_STORAGE_KEY = 'nonato-orcamentos-pecas-especiais-draft'

type FormDraft = {
  clienteId: string
  dataIso: string
  numeroOferta: string
  numeroManual: boolean
  incluirIva: boolean
  taxaIva: number
  contactoNome: string
  contactoTelefone: string
  contactoEmail: string
  linhas: LinhaOrcamentoPecasEsp[]
  linhaEmbalagemTitulo: string
  linhaEmbalagemDescricao: string
  condicoesPagamento: string
  condicoesPagamentoManual: boolean
  notasRodape: string
  modoCalculoTotal: ModoCalculoTotalPecasEsp
  valorFinalComIva: string
}

function newRowId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function novaLinhaVazia(): LinhaOrcamentoPecasEsp {
  return {
    rowId: newRowId(),
    numeroArtigo: '',
    quantidade: '1',
    precoUnitario: '',
    titulo: '',
    descricao: '',
    descricaoOriginal: '',
    infoExtra: '',
    imagem: '',
    pecaId: '',
  }
}

function normalizarLinhaSalva(l: Partial<LinhaOrcamentoPecasEsp>): LinhaOrcamentoPecasEsp {
  const descOriginal = String(l.descricaoOriginal ?? l.descricao ?? '').trim()
  return {
    rowId: l.rowId || newRowId(),
    numeroArtigo: String(l.numeroArtigo ?? ''),
    quantidade: String(l.quantidade ?? '1'),
    precoUnitario: String(l.precoUnitario ?? ''),
    titulo: String(l.titulo ?? ''),
    descricao: String(l.descricao ?? descOriginal),
    descricaoOriginal: descOriginal,
    infoExtra: String(l.infoExtra ?? ''),
    imagem: String(l.imagem ?? ''),
    pecaId: String(l.pecaId ?? ''),
  }
}

function parsePrecoEuro(s: string): number {
  const t = String(s ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')
  const n = parseFloat(t)
  return Number.isFinite(n) ? n : 0
}

function enderecoCliente(c: ClienteOrcamentoPecasEsp): string {
  return [c.morada, [c.codigoPostal, c.localidade].filter(Boolean).join(' '), c.pais]
    .filter(Boolean)
    .join('\n')
}

function condicoesPagamentoPadrao(
  t: Record<string, string | undefined>,
  incluirIva: boolean,
  taxaIva: number
): string {
  if (incluirIva) {
    return (
      t.orcamentoPecasEspCondicoesPagamentoComIva ||
      `Pagamento antecipado, sem desconto.\nPreços em Euros, com IVA de ${taxaIva}% incluído.`
    ).replace(/\{\{taxa\}\}/g, String(taxaIva))
  }
  return (
    t.orcamentoPecasEspCondicoesPagamentoPadrao ||
    t.orcamentoPecasEspCondicoesSemIva ||
    'Pagamento antecipado, sem desconto.\nPreços em Euros, sem IVA.'
  )
}

type EmpresaOrcamentoPecasEsp = {
  nomeEmpresa?: string
  morada?: string
  nif?: string
  telefone?: string
  email?: string
}

type Props = {
  clientes: ClienteOrcamentoPecasEsp[]
  pecasBiblioteca: PecaBibliotecaPecasEsp[]
  safeT: Record<string, string | undefined>
  closeTab: (tabId: string) => void
  activeTabId: string
  voltarPaginaInicial: () => void
  LogoComponent: React.ComponentType<{ size?: 'small' | 'medium' | 'large' }>
  saveData?: (
    key: string,
    data: unknown,
    saveToLocalStorage?: boolean,
    awaitServer?: boolean
  ) => Promise<boolean>
  loadData?: (key: string) => Promise<unknown>
  logoHtml?: string
  empresaInfo?: EmpresaOrcamentoPecasEsp
}

export function OrcamentoPecasEspeciaisContent({
  clientes,
  pecasBiblioteca,
  safeT,
  closeTab,
  activeTabId,
  voltarPaginaInicial,
  LogoComponent,
  saveData,
  loadData,
  logoHtml = '',
  empresaInfo = {},
}: Props) {
  const t = safeT
  const abrirEnvio = useDocumentoEnvioCliente()
  const hoje = new Date().toISOString().slice(0, 10)

  const [salvos, setSalvos] = useState<OrcamentoPecasEspeciaisSalvo[]>([])
  const [clienteId, setClienteId] = useState('')
  const [dataIso, setDataIso] = useState(hoje)
  const [numeroOferta, setNumeroOferta] = useState('')
  const [numeroManual, setNumeroManual] = useState(false)
  const [incluirIva, setIncluirIva] = useState(false)
  const [taxaIva, setTaxaIva] = useState(23)
  const [modoCalculoTotal, setModoCalculoTotal] = useState<ModoCalculoTotalPecasEsp>('linhas')
  const [valorFinalComIva, setValorFinalComIva] = useState('')
  const [contactoNome, setContactoNome] = useState('')
  const [contactoTelefone, setContactoTelefone] = useState('')
  const [contactoEmail, setContactoEmail] = useState('')
  const [linhas, setLinhas] = useState<LinhaOrcamentoPecasEsp[]>([novaLinhaVazia()])
  const [pdfModelo, setPdfModelo] = useState(() => loadPdfModeloPadrao('pecasEspeciais'))
  const [linhaEmbalagemTitulo, setLinhaEmbalagemTitulo] = useState(
    () => t.orcamentoPecasEspEmbalagemTituloPadrao || 'Embalagem e envio'
  )
  const [linhaEmbalagemDescricao, setLinhaEmbalagemDescricao] = useState('')
  const [condicoesPagamento, setCondicoesPagamento] = useState(() =>
    condicoesPagamentoPadrao(t, false, 23)
  )
  const [condicoesPagamentoManual, setCondicoesPagamentoManual] = useState(false)
  const [notasRodape, setNotasRodape] = useState(
    () =>
      t.orcamentoPecasEspNotasRodapePadrao ||
      'Aplicam-se os nossos Termos e Condições Gerais e a Política de Privacidade.'
  )
  const [buscaCliente, setBuscaCliente] = useState('')
  const [buscaPecaPorLinha, setBuscaPecaPorLinha] = useState<Record<string, string>>({})
  const [formDirty, setFormDirty] = useState(false)
  const [gravando, setGravando] = useState(false)
  const [rascunhoAviso, setRascunhoAviso] = useState(false)
  const imagemInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const draftRestoredRef = useRef(false)
  const suppressDirtyRef = useRef(true)

  const estadoFormularioVazio = useCallback((): FormDraft => {
    return {
      clienteId: '',
      dataIso: hoje,
      numeroOferta: '',
      numeroManual: false,
      incluirIva: false,
      taxaIva: 23,
      contactoNome: '',
      contactoTelefone: '',
      contactoEmail: '',
      linhas: [novaLinhaVazia()],
      linhaEmbalagemTitulo: t.orcamentoPecasEspEmbalagemTituloPadrao || 'Embalagem e envio',
      linhaEmbalagemDescricao: '',
      condicoesPagamento: condicoesPagamentoPadrao(t, false, 23),
      condicoesPagamentoManual: false,
      notasRodape:
        t.orcamentoPecasEspNotasRodapePadrao ||
        'Aplicam-se os nossos Termos e Condições Gerais e a Política de Privacidade.',
      modoCalculoTotal: 'linhas',
      valorFinalComIva: '',
    }
  }, [hoje, t])

  const aplicarEstadoFormulario = useCallback((draft: FormDraft) => {
    setClienteId(draft.clienteId)
    setDataIso(draft.dataIso)
    setNumeroOferta(draft.numeroOferta)
    setNumeroManual(draft.numeroManual)
    setIncluirIva(draft.incluirIva)
    setTaxaIva(draft.taxaIva)
    setContactoNome(draft.contactoNome)
    setContactoTelefone(draft.contactoTelefone)
    setContactoEmail(draft.contactoEmail)
    setLinhas(draft.linhas.length ? draft.linhas.map(normalizarLinhaSalva) : [novaLinhaVazia()])
    setLinhaEmbalagemTitulo(draft.linhaEmbalagemTitulo)
    setLinhaEmbalagemDescricao(draft.linhaEmbalagemDescricao)
    setCondicoesPagamento(draft.condicoesPagamento)
    setCondicoesPagamentoManual(draft.condicoesPagamentoManual)
    setNotasRodape(draft.notasRodape)
    setModoCalculoTotal(draft.modoCalculoTotal === 'valor-final' ? 'valor-final' : 'linhas')
    setValorFinalComIva(draft.valorFinalComIva)
    setBuscaCliente('')
    setBuscaPecaPorLinha({})
  }, [])

  const limparRascunhoSessao = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      /* ignorar */
    }
  }, [])

  const resetarFormularioNovo = useCallback(() => {
    suppressDirtyRef.current = true
    aplicarEstadoFormulario(estadoFormularioVazio())
    setFormDirty(false)
    limparRascunhoSessao()
    setRascunhoAviso(false)
    window.setTimeout(() => {
      suppressDirtyRef.current = false
    }, 0)
  }, [aplicarEstadoFormulario, estadoFormularioVazio, limparRascunhoSessao])

  useEffect(() => {
    const tid = window.setTimeout(() => {
      suppressDirtyRef.current = false
    }, 120)
    return () => window.clearTimeout(tid)
  }, [])

  useEffect(() => {
    if (suppressDirtyRef.current) return
    setFormDirty(true)
  }, [
    clienteId,
    dataIso,
    numeroOferta,
    numeroManual,
    incluirIva,
    taxaIva,
    contactoNome,
    contactoTelefone,
    contactoEmail,
    linhas,
    linhaEmbalagemTitulo,
    linhaEmbalagemDescricao,
    condicoesPagamento,
    condicoesPagamentoManual,
    notasRodape,
    modoCalculoTotal,
    valorFinalComIva,
  ])

  useEffect(() => {
    if (!loadData) return
    loadData(STORAGE_KEY)
      .then((data) => {
        if (Array.isArray(data)) setSalvos(data as OrcamentoPecasEspeciaisSalvo[])
      })
      .catch(() => {})
  }, [loadData])

  useEffect(() => {
    if (typeof window === 'undefined' || draftRestoredRef.current) return
    draftRestoredRef.current = true
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<FormDraft>
      if (!parsed || typeof parsed !== 'object') return
      aplicarEstadoFormulario({
        ...estadoFormularioVazio(),
        ...parsed,
        linhas: Array.isArray(parsed.linhas)
          ? parsed.linhas.map((l) => normalizarLinhaSalva(l as Partial<LinhaOrcamentoPecasEsp>))
          : [novaLinhaVazia()],
      })
      suppressDirtyRef.current = true
      setFormDirty(true)
      setRascunhoAviso(true)
      window.setTimeout(() => {
        suppressDirtyRef.current = false
      }, 0)
    } catch {
      /* ignorar */
    }
  }, [aplicarEstadoFormulario, estadoFormularioVazio])

  useEffect(() => {
    if (typeof window === 'undefined' || !formDirty) return
    const draft: FormDraft = {
      clienteId,
      dataIso,
      numeroOferta,
      numeroManual,
      incluirIva,
      taxaIva,
      contactoNome,
      contactoTelefone,
      contactoEmail,
      linhas,
      linhaEmbalagemTitulo,
      linhaEmbalagemDescricao,
      condicoesPagamento,
      condicoesPagamentoManual,
      notasRodape,
      modoCalculoTotal,
      valorFinalComIva,
    }
    const tid = window.setTimeout(() => {
      try {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
      } catch {
        /* ignorar quota */
      }
    }, 600)
    return () => window.clearTimeout(tid)
  }, [
    formDirty,
    clienteId,
    dataIso,
    numeroOferta,
    numeroManual,
    incluirIva,
    taxaIva,
    contactoNome,
    contactoTelefone,
    contactoEmail,
    linhas,
    linhaEmbalagemTitulo,
    linhaEmbalagemDescricao,
    condicoesPagamento,
    condicoesPagamentoManual,
    notasRodape,
    modoCalculoTotal,
    valorFinalComIva,
  ])

  useEffect(() => {
    if (numeroManual) return
    setNumeroOferta(gerarNumeroOfertaPecasEspeciais(salvos, dataIso))
  }, [dataIso, salvos, numeroManual])

  useEffect(() => {
    if (condicoesPagamentoManual) return
    setCondicoesPagamento(condicoesPagamentoPadrao(t, incluirIva, taxaIva))
  }, [incluirIva, taxaIva, condicoesPagamentoManual, t])

  const clienteSel = useMemo(
    () => clientes.find((c) => c.id === clienteId) ?? null,
    [clientes, clienteId]
  )

  const clientesFiltrados = useMemo(() => {
    const q = buscaCliente.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(
      (c) =>
        c.nomeEmpresa?.toLowerCase().includes(q) ||
        codigoClienteExibicao(c).toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.telefones?.toLowerCase().includes(q)
    )
  }, [clientes, buscaCliente])

  const totalLiquidoNum = useMemo(() => {
    let sum = 0
    for (const l of linhas) {
      const qtd = parsePrecoEuro(l.quantidade) || 1
      sum += parsePrecoEuro(l.precoUnitario) * qtd
    }
    return sum
  }, [linhas])

  const totaisIva = useMemo(() => {
    if (incluirIva && modoCalculoTotal === 'valor-final') {
      const finalNum = parsePrecoEuro(valorFinalComIva)
      if (finalNum > 0) {
        const d = calcularTotaisDesdeValorFinalComIva(finalNum, taxaIva)
        return { ...d, incluir: true as const }
      }
    }
    return calcularTotaisIvaPecasEspeciais(totalLiquidoNum, incluirIva, taxaIva)
  }, [totalLiquidoNum, incluirIva, taxaIva, modoCalculoTotal, valorFinalComIva])

  const totalLiquidoFmt = useMemo(() => formatarPrecoOrcamentoEur(totaisIva.liquido), [totaisIva.liquido])
  const totalIvaFmt = useMemo(() => formatarPrecoOrcamentoEur(totaisIva.iva), [totaisIva.iva])
  const totalComIvaFmt = useMemo(() => formatarPrecoOrcamentoEur(totaisIva.comIva), [totaisIva.comIva])

  const filtrarPecasBiblioteca = useCallback(
    (q: string) => filtrarPecasBibliotecaPorBusca(pecasBiblioteca, q, 8),
    [pecasBiblioteca]
  )

  const aplicarPecaBiblioteca = useCallback((rowId: string, peca: PecaBibliotecaPecasEsp) => {
    const descOriginal = String(peca.descricao || '').trim()
    setLinhas((p) =>
      p.map((x) =>
        x.rowId === rowId
          ? {
              ...x,
              pecaId: peca.id,
              numeroArtigo: peca.codigo || x.numeroArtigo,
              titulo: peca.nome || x.titulo,
              descricaoOriginal: descOriginal,
              descricao: descOriginal,
              imagem: peca.imagem || x.imagem,
              precoUnitario: peca.preco?.trim() ? peca.preco : x.precoUnitario,
            }
          : x
      )
    )
    setBuscaPecaPorLinha((prev) => ({ ...prev, [rowId]: '' }))
  }, [])

  const handleImagemLinha = useCallback((rowId: string, file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) return
      setLinhas((p) => p.map((x) => (x.rowId === rowId ? { ...x, imagem: result } : x)))
    }
    reader.readAsDataURL(file)
  }, [])

  const montarLinhasPdf = useCallback((): OrcamentoPecasEspeciaisLinhaPdf[] => {
    return linhas
      .filter((l) => l.titulo.trim() || l.numeroArtigo.trim())
      .map((l, i) => {
        const qtd = parsePrecoEuro(l.quantidade) || 1
        const unit = parsePrecoEuro(l.precoUnitario)
        const total = unit * qtd
        return {
          pos: i + 1,
          numeroArtigo: l.numeroArtigo.trim(),
          quantidade: String(l.quantidade || '1').trim() || '1',
          precoUnitario: l.precoUnitario.trim() || formatarPrecoOrcamentoEur(unit),
          precoTotal: formatarPrecoOrcamentoEur(total),
          titulo: l.titulo.trim(),
          descricao: l.descricao.trim(),
          descricaoOriginal: l.descricaoOriginal.trim(),
          infoExtra: l.infoExtra.trim(),
          imagem: l.imagem.trim(),
        }
      })
  }, [linhas])

  const labelsPdf = useMemo(
    () => ({
      titulo: t.orcamentoPecasEspPdfTitulo || 'Orçamento de peças especiais',
      ofertaLabel: t.orcamentoPecasEspOferta || 'Oferta',
      dataLabel: t.data || 'Data',
      codClienteLabel: t.orcamentoPecasEspCodCliente || 'Cod. cliente',
      contactoLabel: t.contato || 'Pessoa de contacto',
      telefoneLabel: t.telefone || t.telefones || 'Telefone',
      emailLabel: t.email || 'E-mail',
      colPos: t.orcamentoPecasEspColPos || 'Pos.',
      colArtigo: t.orcamentoPecasEspColArtigo || 'N.º artigo',
      colQtd: t.quantidade || 'Qtd.',
      colUnit: t.orcamentoPecasEspColUnit || 'Preço unit.',
      colTotal: t.orcamentoPecasEspColTotal || 'Preço EUR',
      totalLiquidoLabel: t.orcamentoPecasEspTotalLiquido || 'Total EUR líquido',
      valorIvaLabel: t.valorIva || 'IVA',
      totalComIvaLabel: t.totalComIva || 'Total com IVA',
      condicoesPagamentoLabel: t.orcamentoPecasEspCondicoesPagamento || 'Condições de pagamento',
      embalagemTitulo: t.orcamentoPecasEspEmbalagem || 'Embalagem e envio',
      imprimir: t.imprimirGuardarPdf || t.gerarPDF || 'Imprimir / Guardar PDF',
      fechar: t.fechar || 'Fechar',
      previewBanner: t.orcamentoPecasEspPreviewBanner || 'Pré-visualização',
      badgeSemIva: t.orcamentoPecasEspBadgeSemIva || 'Preços sem IVA',
      badgeComIva: t.orcamentoPecasEspBadgeComIva || 'Preços com IVA a {{taxa}}%',
      maisInfoLabel: t.orcamentoPecasEspInfoExtra || 'Mais informação',
      empresaNifLabel: t.identificacaoFiscal || t.nif || 'NIF',
      empresaTelefoneLabel: t.telefone || t.telefones || 'Telefone',
      empresaEmailLabel: t.email || 'E-mail',
      empresaNomeFallback: t.nonatoService || t.boaTrade || 'NONATO SERVICE',
    }),
    [t]
  )

  const empresaPdf = useMemo(
    () => ({
      nomeEmpresa: empresaInfo.nomeEmpresa,
      morada: empresaInfo.morada,
      nif: empresaInfo.nif,
      telefone: empresaInfo.telefone,
      email: empresaInfo.email,
    }),
    [empresaInfo]
  )

  const empresaNomeExibicao = (empresaInfo.nomeEmpresa || t.nonatoService || t.boaTrade || '').trim()

  const montarPayloadPdf = (preview: boolean) => ({
    numeroOferta: numeroOferta.trim() || gerarNumeroOfertaPecasEspeciais(salvos, dataIso),
    dataIso,
    clienteNome: clienteSel!.nomeEmpresa,
    clienteMorada: enderecoCliente(clienteSel!),
    clienteCodigo: codigoClienteExibicao(clienteSel!),
    contactoNome: contactoNome.trim() || clienteSel!.contato || '',
    contactoTelefone: contactoTelefone.trim() || clienteSel!.telefones || '',
    contactoEmail: contactoEmail.trim() || clienteSel!.email || '',
    linhas: montarLinhasPdf(),
    linhaEmbalagemTitulo: linhaEmbalagemTitulo.trim(),
    linhaEmbalagemDescricao: linhaEmbalagemDescricao.trim(),
    totalLiquido: totalLiquidoFmt,
    totalIva: totalIvaFmt,
    totalComIva: totalComIvaFmt,
    incluirIva,
    taxaIva,
    condicoesPagamento: condicoesPagamento.trim(),
    notasRodape: notasRodape.trim(),
    logoHtml,
    empresa: empresaPdf,
    labels: labelsPdf,
    preview,
    pdfModelo,
  })

  const abrirPdf = (preview: boolean) => {
    if (!clienteSel) {
      alert(t.orcamentoPecasEspSelecioneCliente || 'Selecione um cliente.')
      return
    }
    const linhasPdf = montarLinhasPdf()
    if (linhasPdf.length === 0) {
      alert(t.orcamentoPecasEspLinhaObrigatoria || 'Adicione pelo menos uma linha com descrição ou código.')
      return
    }
    openOrcamentoPecasEspeciaisPdf(montarPayloadPdf(preview))
  }

  const numeroOfertaAtual = numeroOferta.trim() || gerarNumeroOfertaPecasEspeciais(salvos, dataIso)

  const abrirEnvioOrcamentoPecas = (canal: 'email' | 'whatsapp', preview = false) => {
    if (!clienteSel) {
      alert(t.orcamentoPecasEspSelecioneCliente || 'Selecione um cliente.')
      return
    }
    if (montarLinhasPdf().length === 0) {
      alert(t.orcamentoPecasEspLinhaObrigatoria || 'Adicione pelo menos uma linha com descrição ou código.')
      return
    }
    abrirEnvio({
      title: t.orcamentoPecasEspEnvioTitulo || 'Enviar orçamento de peças especiais',
      subject: `${labelsPdf.titulo} ${numeroOfertaAtual} — ${clienteSel.nomeEmpresa}`,
      body: buildTextoEnvioOrcamento(
        { numeroOrcamento: numeroOfertaAtual, clienteNome: clienteSel.nomeEmpresa },
        t as Record<string, string | undefined>
      ),
      clienteId: clienteSel.id,
      clienteNome: clienteSel.nomeEmpresa,
      defaultChannel: canal,
      onOpenPdf: () => abrirPdf(preview),
    })
  }

  const gravarOrcamento = async () => {
    if (gravando) return
    if (!clienteSel) {
      alert(t.orcamentoPecasEspSelecioneCliente || 'Selecione um cliente.')
      return
    }
    const linhasValidas = linhas.filter((l) => l.titulo.trim() || l.numeroArtigo.trim())
    if (linhasValidas.length === 0) {
      alert(t.orcamentoPecasEspLinhaObrigatoria || 'Adicione pelo menos uma linha com descrição ou código.')
      return
    }
    if (incluirIva && modoCalculoTotal === 'valor-final' && parsePrecoEuro(valorFinalComIva) <= 0) {
      alert(t.orcamentoPecasEspValorFinalObrigatorio || 'Indique o valor final acordado (com IVA).')
      return
    }
    const num = numeroOferta.trim() || gerarNumeroOfertaPecasEspeciais(salvos, dataIso)
    const reg: OrcamentoPecasEspeciaisSalvo = {
      id: newRowId(),
      numeroOferta: num,
      dataIso,
      clienteId: clienteSel.id,
      clienteNome: clienteSel.nomeEmpresa,
      clienteCodigo: codigoClienteExibicao(clienteSel),
      contactoNome,
      contactoTelefone,
      contactoEmail,
      linhas,
      linhaEmbalagemTitulo,
      linhaEmbalagemDescricao,
      condicoesPagamento,
      notasRodape,
      totalLiquido: totalLiquidoFmt,
      totalIva: totalIvaFmt,
      totalComIva: totalComIvaFmt,
      incluirIva,
      taxaIva,
      modoCalculoTotal: incluirIva ? modoCalculoTotal : 'linhas',
      valorFinalComIva: incluirIva && modoCalculoTotal === 'valor-final' ? valorFinalComIva : '',
      dataCriacao: new Date().toISOString(),
    }
    const next = [reg, ...salvos]
    setGravando(true)
    try {
      let serverOk = true
      if (saveData) {
        serverOk = (await saveData(STORAGE_KEY, next, true, true)) === true
      }
      setSalvos(next)
      if (!serverOk) {
        alert(
          t.orcamentoPecasEspGravadoServidorFalha ||
            'Gravado neste aparelho, mas não foi possível enviar ao servidor. Verifique a ligação e toque em Gravar outra vez.'
        )
        return
      }
      limparRascunhoSessao()
      setFormDirty(false)
      setRascunhoAviso(false)
      alert(
        t.orcamentoPecasEspGravadoServidor ||
          'Orçamento gravado e enviado ao servidor. Os outros aparelhos passam a vê-lo após sincronizar.'
      )
    } finally {
      setGravando(false)
    }
  }

  const cancelarFormulario = () => {
    if (
      formDirty &&
      !window.confirm(
        t.orcamentoPecasEspCancelarConfirm ||
          'Descartar as alterações deste orçamento em edição? (O rascunho neste aparelho será apagado.)'
      )
    ) {
      return
    }
    resetarFormularioNovo()
  }

  const carregarSalvo = (o: OrcamentoPecasEspeciaisSalvo) => {
    suppressDirtyRef.current = true
    setClienteId(o.clienteId)
    setDataIso(o.dataIso)
    setNumeroOferta(o.numeroOferta)
    setNumeroManual(true)
    setIncluirIva(Boolean(o.incluirIva))
    setTaxaIva(Number.isFinite(Number(o.taxaIva)) ? Number(o.taxaIva) : 23)
    setModoCalculoTotal(o.modoCalculoTotal === 'valor-final' ? 'valor-final' : 'linhas')
    setValorFinalComIva(String(o.valorFinalComIva ?? ''))
    setContactoNome(o.contactoNome)
    setContactoTelefone(o.contactoTelefone)
    setContactoEmail(o.contactoEmail)
    setLinhas(o.linhas.length ? o.linhas.map(normalizarLinhaSalva) : [novaLinhaVazia()])
    setLinhaEmbalagemTitulo(o.linhaEmbalagemTitulo)
    setLinhaEmbalagemDescricao(o.linhaEmbalagemDescricao)
    setCondicoesPagamento(o.condicoesPagamento)
    setCondicoesPagamentoManual(true)
    setNotasRodape(o.notasRodape)
    limparRascunhoSessao()
    setFormDirty(false)
    setRascunhoAviso(false)
    window.setTimeout(() => {
      suppressDirtyRef.current = false
    }, 0)
  }

  return (
    <div className="orc-pro orcamentos-avulso-page orcamento-pecas-especiais-page">
      <div className="orcamentos-avulso-header-card">
        <div className="orcamentos-avulso-header-inner">
          <div className="orcamentos-avulso-header-brand">
            <div className="orcamentos-avulso-header-logo">
              {logoHtml ? (
                <div className="orcamentos-avulso-header-logo-html" dangerouslySetInnerHTML={{ __html: logoHtml }} />
              ) : (
                <LogoComponent size="small" />
              )}
            </div>
            <div className="orcamentos-avulso-header-empresa">
              {empresaNomeExibicao ? <strong className="orcamentos-avulso-header-empresa-nome">{empresaNomeExibicao}</strong> : null}
              {empresaInfo.morada?.trim() ? (
                <span className="orcamentos-avulso-header-empresa-line">{empresaInfo.morada.trim()}</span>
              ) : null}
              {empresaInfo.nif?.trim() ? (
                <span className="orcamentos-avulso-header-empresa-line">
                  {(t.identificacaoFiscal || t.nif || 'NIF') + ': ' + empresaInfo.nif.trim()}
                </span>
              ) : null}
              {empresaInfo.telefone?.trim() ? (
                <span className="orcamentos-avulso-header-empresa-line">
                  {(t.telefone || t.telefones || 'Telefone') + ': ' + empresaInfo.telefone.trim()}
                </span>
              ) : null}
              {empresaInfo.email?.trim() ? (
                <span className="orcamentos-avulso-header-empresa-line">
                  {(t.email || 'E-mail') + ': ' + empresaInfo.email.trim()}
                </span>
              ) : null}
              {!empresaInfo.morada?.trim() && !empresaInfo.nif?.trim() && !empresaInfo.telefone?.trim() && !empresaInfo.email?.trim() ? (
                <span className="orcamentos-avulso-header-empresa-aviso">
                  {t.orcamentoPecasEspEmpresaIncompleta ||
                    'Preencha os dados da empresa em «Cadastro da Nonato Service» para aparecerem no orçamento.'}
                </span>
              ) : null}
            </div>
          </div>
          <div className="orcamentos-avulso-header-title">
            <h1>{t.orcamentoPecasEspeciaisTitle || 'ORÇAMENTOS DE PEÇAS ESPECIAIS'}</h1>
            <p>
              {t.orcamentoPecasEspeciaisDesc ||
                'Propostas comerciais para peças especiais (modelo tipo oferta internacional), com logo Nonato Service e código do cliente.'}
            </p>
          </div>
          <div className="orcamentos-avulso-header-actions">
            <button type="button" className="btn-primary" onClick={() => closeTab(activeTabId || '')}>
              ↶ {t.voltar || 'Voltar'}
            </button>
            <button type="button" className="btn-primary" onClick={voltarPaginaInicial}>
              🏠 {t.paginaInicial || 'Início'}
            </button>
          </div>
        </div>
      </div>

      <div className="orc-pro__panel orcamento-pecas-especiais-form">
        {rascunhoAviso ? (
          <p className="orcamento-pecas-especiais-hint orcamento-pecas-especiais-rascunho-aviso" role="status">
            {t.orcamentoPecasEspRascunhoRestaurado ||
              'Rascunho recuperado neste aparelho. Toque em Gravar para enviar ao servidor.'}
          </p>
        ) : null}
        {formDirty && !gravando ? (
          <p className="orcamento-pecas-especiais-hint orcamento-pecas-especiais-rascunho-aviso">
            {t.orcamentoPecasEspRascunhoAuto ||
              'Alterações guardadas temporariamente neste aparelho — use Gravar para enviar ao servidor.'}
          </p>
        ) : null}
        <div className="orcamento-pecas-especiais-grid-head orcamento-pecas-especiais-grid-head--2col">
          <div>
            <label className="orcamento-pecas-especiais-label">{t.orcamentoPecasEspNumero || 'N.º oferta'}</label>
            <input
              type="text"
              value={numeroOferta}
              onChange={(e) => {
                setNumeroManual(true)
                setNumeroOferta(e.target.value)
              }}
              className="orcamento-pecas-especiais-input"
            />
          </div>
          <div>
            <label className="orcamento-pecas-especiais-label">{t.data || 'Data'}</label>
            <input
              type="date"
              value={dataIso}
              onChange={(e) => setDataIso(e.target.value)}
              className="orcamento-pecas-especiais-input"
            />
          </div>
        </div>

        <div className="orcamento-pecas-especiais-section orc-pe-iva">
          <div className="orc-pe-iva-card">
            <div className="orc-pe-iva-card__header">
              <div className="orc-pe-iva-card__heading">
                <h3 className="orc-pe-iva-card__title">
                  {t.orcamentoPecasEspModoIvaTitulo || 'Preços no orçamento'}
                </h3>
                <p className={`orc-pe-iva-card__status${incluirIva ? ' orc-pe-iva-card__status--com' : ''}`}>
                  {incluirIva
                    ? (t.orcamentoPecasEspBadgeComIva || 'Modo: com IVA a {{taxa}}%').replace(
                        /\{\{taxa\}\}/g,
                        String(taxaIva)
                      )
                    : t.orcamentoPecasEspBadgeSemIva || 'Modo: sem IVA — preços líquidos'}
                </p>
              </div>
              <div className="orc-pe-iva-switch" role="group" aria-label={t.orcamentoPecasEspModoIvaTitulo || 'Preços no orçamento'}>
                <button
                  type="button"
                  className={`orc-pe-iva-switch__btn${!incluirIva ? ' is-active' : ''}`}
                  aria-pressed={!incluirIva}
                  onClick={() => {
                    setIncluirIva(false)
                    setModoCalculoTotal('linhas')
                  }}
                >
                  {t.orcamentoPecasEspSemIvaBtn || 'Sem IVA'}
                </button>
                <button
                  type="button"
                  className={`orc-pe-iva-switch__btn orc-pe-iva-switch__btn--com${incluirIva ? ' is-active' : ''}`}
                  aria-pressed={incluirIva}
                  onClick={() => setIncluirIva(true)}
                >
                  {t.orcamentoPecasEspComIvaBtn || 'Com IVA'}
                </button>
              </div>
            </div>

            <div className="orc-pe-iva-card__meta">
              {incluirIva ? (
                <label className="orc-pe-iva-card__field">
                  <span>{t.orcamentoPecasEspIvaTaxaLabel || 'Taxa de IVA (%)'}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={taxaIva}
                    onChange={(e) => setTaxaIva(parseFloat(e.target.value) || 0)}
                    className="orcamento-pecas-especiais-input orcamento-pecas-especiais-input--taxa"
                  />
                </label>
              ) : (
                <div className="orc-pe-iva-card__total">
                  <span className="orc-pe-iva-card__total-label">{t.totalSemIva || 'Total sem IVA'}</span>
                  <strong className="orc-pe-iva-card__total-value">{totalLiquidoFmt}</strong>
                </div>
              )}
            </div>
          </div>

          {incluirIva ? (
            <div className="orc-pe-iva-card orc-pe-iva-card--sub">
              <div className="orc-pe-iva-card__header orc-pe-iva-card__header--compact">
                <span className="orc-pe-iva-card__sub-label">
                  {t.orcamentoPecasEspModoCalculoTitulo || 'Como calcular o total'}
                </span>
                <div className="orc-pe-iva-switch orc-pe-iva-switch--wide" role="group" aria-label={t.orcamentoPecasEspModoCalculoTitulo || 'Como calcular o total'}>
                  <button
                    type="button"
                    className={`orc-pe-iva-switch__btn${modoCalculoTotal === 'linhas' ? ' is-active' : ''}`}
                    aria-pressed={modoCalculoTotal === 'linhas'}
                    onClick={() => setModoCalculoTotal('linhas')}
                  >
                    {t.orcamentoPecasEspModoSomaLinhas || 'Soma das linhas'}
                  </button>
                  <button
                    type="button"
                    className={`orc-pe-iva-switch__btn orc-pe-iva-switch__btn--com${modoCalculoTotal === 'valor-final' ? ' is-active' : ''}`}
                    aria-pressed={modoCalculoTotal === 'valor-final'}
                    onClick={() => {
                      setModoCalculoTotal('valor-final')
                      if (!valorFinalComIva.trim() && totaisIva.comIva > 0) {
                        setValorFinalComIva(String(Math.round(totaisIva.comIva * 100) / 100).replace('.', ','))
                      }
                    }}
                  >
                    {t.orcamentoPecasEspModoValorFinal || 'Valor final acordado'}
                  </button>
                </div>
              </div>
              {modoCalculoTotal === 'valor-final' ? (
                <label className="orc-pe-iva-card__field orc-pe-iva-card__field--block">
                  <span>{t.orcamentoPecasEspValorFinalLabel || 'Valor final com IVA (€)'}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valorFinalComIva}
                    onChange={(e) => setValorFinalComIva(e.target.value)}
                    placeholder={t.orcamentoPecasEspValorFinalPlaceholder || 'Ex.: 2500'}
                    className="orcamento-pecas-especiais-input orcamento-pecas-especiais-input--valor-final"
                  />
                </label>
              ) : null}
            </div>
          ) : null}

          {incluirIva && modoCalculoTotal === 'valor-final' ? (
            <p className="orcamento-pecas-especiais-hint orcamento-pecas-especiais-valor-final-hint">
              {t.orcamentoPecasEspValorFinalHint ||
                'Indique o preço que disse ao cliente (ex.: 2500 €). O programa calcula o valor sem IVA e o montante de IVA.'}
            </p>
          ) : null}

          {incluirIva ? (
            <div className="orcamento-pecas-especiais-iva-row orcamento-pecas-especiais-iva-row--totais">
              <div className="orcamento-pecas-especiais-total-box">
                <span className="orcamento-pecas-especiais-total-box__label">
                  {t.totalSemIva || 'Total sem IVA'}
                </span>
                <strong className="orcamento-pecas-especiais-total-box__valor">{totalLiquidoFmt}</strong>
              </div>
              <div className="orcamento-pecas-especiais-total-box orcamento-pecas-especiais-total-box--iva">
                <span className="orcamento-pecas-especiais-total-box__label">
                  {t.valorIva || 'IVA'} ({totaisIva.taxa}%)
                </span>
                <strong className="orcamento-pecas-especiais-total-box__valor">{totalIvaFmt}</strong>
              </div>
              <div className="orcamento-pecas-especiais-total-box orcamento-pecas-especiais-total-box--final">
                <span className="orcamento-pecas-especiais-total-box__label">
                  {t.totalComIva || 'Total com IVA'}
                </span>
                <strong className="orcamento-pecas-especiais-total-box__valor">{totalComIvaFmt}</strong>
              </div>
            </div>
          ) : null}
        </div>

        <div className="orcamento-pecas-especiais-section">
          <h3>{t.cliente || 'Cliente'}</h3>
          <ClienteAlfabetoPicker
            clientes={clientes}
            selectedId={clienteId}
            labels={{
              buscar: t.buscarCliente,
              nenhumEncontrado: t.nenhumClienteEncontrado,
              selecioneLetra: t.clientesAlfabetoSelecioneLetra,
              prompt: t.clientesAlfabetoPrompt,
              mostrando: t.mostrando,
              de: t.de,
              clientes: t.clientes,
              comInicial: t.clientesAlfabetoComInicial,
              outros: t.clientesAlfabetoOutros,
              semClientesLetra: t.clientesAlfabetoSemClientes,
              indiceAz: t.clientesAlfabetoIndice,
              limpar: t.limpar || t.delete,
              cliente: t.cliente,
              filtrados: t.filtrados,
            }}
            listMaxHeight={280}
            onSelect={(c) => {
              setClienteId(c.id)
              if (!contactoTelefone.trim()) setContactoTelefone(c.telefones || '')
              if (!contactoEmail.trim()) setContactoEmail(c.email || '')
              if (!contactoNome.trim()) setContactoNome(c.contato || '')
            }}
            onClear={() => setClienteId('')}
          />
          {clienteSel ? (
            <p className="orcamento-pecas-especiais-hint">
              {t.orcamentoPecasEspCodCliente || 'Cod. cliente'}: <strong>{codigoClienteExibicao(clienteSel)}</strong>
              {clienteSel.morada ? ` · ${clienteSel.morada}` : ''}
            </p>
          ) : null}
        </div>

        <div className="orcamento-pecas-especiais-grid-contact">
          <div>
            <label className="orcamento-pecas-especiais-label">{t.contato || 'Contacto'}</label>
            <input
              type="text"
              value={contactoNome}
              onChange={(e) => setContactoNome(e.target.value)}
              className="orcamento-pecas-especiais-input"
            />
          </div>
          <div>
            <label className="orcamento-pecas-especiais-label">{t.telefone || 'Telefone'}</label>
            <input
              type="tel"
              value={contactoTelefone}
              onChange={(e) => setContactoTelefone(e.target.value)}
              className="orcamento-pecas-especiais-input"
            />
          </div>
          <div>
            <label className="orcamento-pecas-especiais-label">{t.email || 'E-mail'}</label>
            <input
              type="email"
              value={contactoEmail}
              onChange={(e) => setContactoEmail(e.target.value)}
              className="orcamento-pecas-especiais-input"
            />
          </div>
        </div>

        <div className="orcamento-pecas-especiais-section">
          <div className="orcamento-pecas-especiais-section-head">
            <h3>{t.orcamentoPecasEspLinhasTitulo || 'Linhas do orçamento'}</h3>
            <button type="button" className="btn-primary" onClick={() => setLinhas((p) => [...p, novaLinhaVazia()])}>
              + {t.adicionar || 'Adicionar linha'}
            </button>
          </div>
          {linhas.map((l, idx) => {
            const pecasSugeridas = filtrarPecasBiblioteca(buscaPecaPorLinha[l.rowId] || '')
            const descPreview = (l.descricao || l.descricaoOriginal || '').trim()
            return (
              <div key={l.rowId} className="orcamento-pecas-especiais-linha">
                <div className="orcamento-pecas-especiais-linha-head">
                  <strong>
                    {t.orcamentoPecasEspColPos || 'Pos.'} {idx + 1}
                  </strong>
                  {linhas.length > 1 ? (
                    <button
                      type="button"
                      className="btn-danger"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => setLinhas((p) => p.filter((x) => x.rowId !== l.rowId))}
                    >
                      {t.remover || 'Remover'}
                    </button>
                  ) : null}
                </div>

                <div className="orcamento-pecas-especiais-biblioteca">
                  <label className="orcamento-pecas-especiais-label">
                    {t.orcamentoPecasEspBuscarPecaBiblioteca || 'Importar da biblioteca de peças'}
                  </label>
                  <input
                    type="search"
                    placeholder={t.buscarPeca || t.buscar || 'Buscar por código ou nome…'}
                    value={buscaPecaPorLinha[l.rowId] || ''}
                    onChange={(e) =>
                      setBuscaPecaPorLinha((prev) => ({ ...prev, [l.rowId]: e.target.value }))
                    }
                    className="orcamento-pecas-especiais-input"
                  />
                  {pecasSugeridas.length > 0 && (buscaPecaPorLinha[l.rowId] || '').trim() ? (
                    <ul className="orcamento-pecas-especiais-biblioteca-list">
                      {pecasSugeridas.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            className="orcamento-pecas-especiais-biblioteca-item"
                            onClick={() => aplicarPecaBiblioteca(l.rowId, p)}
                          >
                            {p.imagem ? (
                              <img src={p.imagem} alt="" className="orcamento-pecas-especiais-biblioteca-thumb" />
                            ) : (
                              <span className="orcamento-pecas-especiais-biblioteca-thumb orcamento-pecas-especiais-biblioteca-thumb--empty">
                                —
                              </span>
                            )}
                            <span>
                              <strong>{p.codigo}</strong> — {p.nome}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className="orcamento-pecas-especiais-linha-grid">
                  <input
                    placeholder={t.orcamentoPecasEspColArtigo || 'N.º artigo'}
                    value={l.numeroArtigo}
                    onChange={(e) =>
                      setLinhas((p) => p.map((x) => (x.rowId === l.rowId ? { ...x, numeroArtigo: e.target.value } : x)))
                    }
                    className="orcamento-pecas-especiais-input"
                  />
                  <input
                    placeholder={t.quantidade || 'Qtd.'}
                    value={l.quantidade}
                    onChange={(e) =>
                      setLinhas((p) => p.map((x) => (x.rowId === l.rowId ? { ...x, quantidade: e.target.value } : x)))
                    }
                    className="orcamento-pecas-especiais-input"
                  />
                  <input
                    placeholder={t.orcamentoPecasEspColUnit || 'Preço unit. (ex.: 1.700,00)'}
                    value={l.precoUnitario}
                    onChange={(e) =>
                      setLinhas((p) => p.map((x) => (x.rowId === l.rowId ? { ...x, precoUnitario: e.target.value } : x)))
                    }
                    className="orcamento-pecas-especiais-input"
                  />
                </div>

                <input
                  placeholder={t.orcamentoPecasEspTituloLinha || 'Designação / título da peça'}
                  value={l.titulo}
                  onChange={(e) =>
                    setLinhas((p) => p.map((x) => (x.rowId === l.rowId ? { ...x, titulo: e.target.value } : x)))
                  }
                  className="orcamento-pecas-especiais-input"
                />

                <div className="orcamento-pecas-especiais-imagem-row">
                  <div className="orcamento-pecas-especiais-imagem-preview">
                    {l.imagem ? (
                      <img src={l.imagem} alt="" className="orcamento-pecas-especiais-imagem-thumb" />
                    ) : (
                      <span className="orcamento-pecas-especiais-imagem-empty">
                        {t.orcamentoPecasEspSemImagem || 'Sem imagem'}
                      </span>
                    )}
                  </div>
                  <div className="orcamento-pecas-especiais-imagem-actions">
                    <input
                      ref={(el) => {
                        imagemInputRefs.current[l.rowId] = el
                      }}
                      type="file"
                      accept="image/*"
                      className="orcamento-pecas-especiais-file-input"
                      onChange={(e) => handleImagemLinha(l.rowId, e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => imagemInputRefs.current[l.rowId]?.click()}
                    >
                      📷 {t.orcamentoPecasEspAdicionarImagem || 'Adicionar imagem'}
                    </button>
                    {l.imagem ? (
                      <button
                        type="button"
                        className="btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() =>
                          setLinhas((p) => p.map((x) => (x.rowId === l.rowId ? { ...x, imagem: '' } : x)))
                        }
                      >
                        {t.orcamentoPecasEspRemoverImagem || 'Remover imagem'}
                      </button>
                    ) : null}
                  </div>
                </div>

                {l.descricaoOriginal ? (
                  <p className="orcamento-pecas-especiais-hint">
                    {t.orcamentoPecasEspDescricaoOriginal || 'Descrição original (biblioteca)'}:{' '}
                    <em>{l.descricaoOriginal.slice(0, 120)}{l.descricaoOriginal.length > 120 ? '…' : ''}</em>
                    {l.descricao !== l.descricaoOriginal ? (
                      <button
                        type="button"
                        className="orcamento-pecas-especiais-link-btn"
                        onClick={() =>
                          setLinhas((p) =>
                            p.map((x) =>
                              x.rowId === l.rowId ? { ...x, descricao: x.descricaoOriginal } : x
                            )
                          )
                        }
                      >
                        {t.orcamentoPecasEspRestaurarDescricao || 'Restaurar texto original'}
                      </button>
                    ) : null}
                  </p>
                ) : null}

                <textarea
                  placeholder={t.orcamentoPecasEspDescricaoLinha || 'Descrição técnica (copiada do original ou manual)'}
                  value={l.descricao}
                  onChange={(e) =>
                    setLinhas((p) => p.map((x) => (x.rowId === l.rowId ? { ...x, descricao: e.target.value } : x)))
                  }
                  className="orcamento-pecas-especiais-textarea"
                  rows={4}
                />

                {descPreview ? (
                  <div className="orcamento-pecas-especiais-desc-preview">
                    <strong>{t.orcamentoPecasEspDescricaoPreview || 'Leitura prévia da descrição (como no PDF)'}</strong>
                    <div className="orcamento-pecas-especiais-desc-preview__body">{descPreview}</div>
                  </div>
                ) : null}

                <textarea
                  placeholder={t.orcamentoPecasEspInfoExtra || 'Mais informação (opcional)'}
                  value={l.infoExtra}
                  onChange={(e) =>
                    setLinhas((p) => p.map((x) => (x.rowId === l.rowId ? { ...x, infoExtra: e.target.value } : x)))
                  }
                  className="orcamento-pecas-especiais-textarea"
                  rows={2}
                />
              </div>
            )
          })}
        </div>

        <div className="orcamento-pecas-especiais-section">
          <h3>{t.orcamentoPecasEspEmbalagem || 'Embalagem e envio'}</h3>
          <input
            type="text"
            value={linhaEmbalagemTitulo}
            onChange={(e) => setLinhaEmbalagemTitulo(e.target.value)}
            className="orcamento-pecas-especiais-input"
          />
          <textarea
            value={linhaEmbalagemDescricao}
            onChange={(e) => setLinhaEmbalagemDescricao(e.target.value)}
            className="orcamento-pecas-especiais-textarea"
            rows={4}
            placeholder={t.orcamentoPecasEspEmbalagemPlaceholder || 'Texto do pacote de envio…'}
          />
        </div>

        <div className="orcamento-pecas-especiais-section">
          <h3>{t.orcamentoPecasEspCondicoesPagamento || 'Condições de pagamento'}</h3>
          <textarea
            value={condicoesPagamento}
            onChange={(e) => {
              setCondicoesPagamentoManual(true)
              setCondicoesPagamento(e.target.value)
            }}
            className="orcamento-pecas-especiais-textarea"
            rows={3}
          />
          <h3 style={{ marginTop: '14px' }}>{t.orcamentoPecasEspNotasRodape || 'Notas / rodapé'}</h3>
          <textarea
            value={notasRodape}
            onChange={(e) => setNotasRodape(e.target.value)}
            className="orcamento-pecas-especiais-textarea"
            rows={2}
          />
        </div>

        <div className="orcamento-pecas-especiais-pdf-modelo">
          <PdfModeloPickerField
            value={pdfModelo}
            onChange={(model) =>
              setPdfModelo(persistPdfModeloPadrao('pecasEspeciais', model, saveData))
            }
            labels={t as Record<string, string>}
            label={t.selecioneModeloPDF || 'Modelo de PDF'}
            hint={
              (t as Record<string, string | undefined>).orcamentoPdfModeloHint ||
              'Estilo visual do orçamento (mesmas opções dos relatórios).'
            }
            compact
          />
        </div>

        <div className="orcamento-pecas-especiais-actions">
          <button type="button" className="btn-primary" onClick={() => abrirPdf(true)}>
            👁️ {t.visualizar || 'Pré-visualizar PDF'}
          </button>
          <button type="button" className="btn-primary" onClick={() => abrirPdf(false)}>
            📄 {t.gerarPDF || 'Gerar PDF'}
          </button>
          <button type="button" className="btn-primary" onClick={() => abrirEnvioOrcamentoPecas('email')}>
            📧 {t.enviarPorEmail || 'E-mail'}
          </button>
          <button type="button" className="btn-primary" onClick={() => abrirEnvioOrcamentoPecas('whatsapp')}>
            💬 {t.enviarPorWhatsApp || 'WhatsApp'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={gravando}
            onClick={() => void gravarOrcamento()}
          >
            {gravando
              ? t.orcamentoPecasEspSalvando || 'A gravar…'
              : `💾 ${t.save || 'Gravar'}`}
          </button>
          <button
            type="button"
            className="btn-danger orcamento-pecas-especiais-btn-cancelar"
            disabled={gravando}
            onClick={cancelarFormulario}
          >
            ✕ {t.cancel || 'Cancelar'}
          </button>
        </div>

        {salvos.length > 0 ? (
          <div className="orcamento-pecas-especiais-section">
            <h3>{t.orcamentoPecasEspGravadosTitulo || 'Orçamentos gravados'}</h3>
            <ul className="orcamento-pecas-especiais-salvos">
              {salvos.slice(0, 20).map((o) => (
                <li key={o.id}>
                  <button type="button" className="orcamento-pecas-especiais-salvo-btn" onClick={() => carregarSalvo(o)}>
                    <strong>{o.numeroOferta}</strong> — {o.clienteNome} (
                    {o.incluirIva ? o.totalComIva || o.totalLiquido : o.totalLiquido}
                    {o.incluirIva ? ` ${t.comIvaAbrev || 'c/ IVA'}` : ` ${t.semIvaAbrev || 's/ IVA'}`}) · {o.dataIso}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}

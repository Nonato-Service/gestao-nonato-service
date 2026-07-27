'use client'

import React, { useState, useMemo, useEffect, useId, useCallback } from 'react'
import { ClienteAlfabetoPicker } from './ClienteAlfabetoPicker'
import { useBuscaPecaBibliotecaComServidor } from '../lib/useBuscaPecaBibliotecaComServidor'
import { openPedidoOrcamentoAvulsoPdf } from '../lib/pedidoOrcamentoAvulsoPdf'
import {
  enriquecerBlocoEquipamentoPedido,
  montarCamposEquipamentoPedidoPdf,
} from '../lib/pedidoOrcamentoAvulsoEquipamento'
import { PdfModeloPickerField } from './PdfModeloPickerField'
import { PecaObservacaoToggle } from './PecaObservacaoToggle'
import { loadPdfModeloPadrao, persistPdfModeloPadrao } from '../lib/pdfModelStorage'
import {
  resolverEmpresaPedidoOrcamentoPdf,
  resolverNumeroEquipamentoPdf,
  resolverSerieEquipamentoPdf,
  type OrcamentoPdfEmpresa,
} from '../lib/orcamentoPdfPro'
import { resolverIdEquipamentoCliente } from '../lib/relatorioServicoEquipamentos'
import { ProImageHoverPreview } from './ProImageHoverPreview'
import type { OrcamentoWorkflowStatus } from '../lib/orcamentoWorkflow'
import { notifyEquipamentoOrcamentosChanged } from '../lib/orcamentoWorkflow'

export type ClientePedido = {
  id: string
  codigoCliente?: string
  nomeEmpresa: string
  morada?: string
  conselho?: string
  codigoPostal?: string
  pais?: string
  email?: string
  telefones?: string
  contato?: string
  numeroContribuicaoFiscal?: string
  equipamentos: EquipamentoClientePedido[]
}

export type EquipamentoClientePedido = {
  id?: string
  tipoEquipamento: string
  modelo: string
  marca: string
  numeroSerie: string
  familia?: string
  grupo?: string
}

export type PecaPedido = {
  id: string
  codigo: string
  nome: string
  imagem?: string
  quantidade: number
  pecaId?: string
  incluirObservacao?: boolean
  observacao?: string
}

export type EquipamentoBlocoPedido = {
  id: string
  equipamentoIdx?: number
  equipamento: EquipamentoClientePedido | null
  equipamentoManual: string
  pecas: PecaPedido[]
}

export type StatusPedidoAvulso = 'pendente' | 'cancelado' | 'concluido' | 'aprovado' | 'entregue'

export type PedidoAvulsoGuardado = {
  codigo: string
  dataGeracao: string
  clienteNomeReal: string
  clienteId?: string
  emitirComoCliente: 'cliente' | 'nonato-service'
  equipamentoTexto: string
  equipamentoChave?: string
  equipamentoNumeroSerie?: string
  pecas: PecaPedido[]
  equipamentosBlocos?: EquipamentoBlocoPedido[]
  status?: StatusPedidoAvulso
  workflowStatus?: OrcamentoWorkflowStatus
  numeroNotaFiscalEntrega?: string
  entregaConfirmadaEm?: string
  geradoEm?: string
  cotacaoRecebidaEm?: string
}

type Props = {
  clientes: ClientePedido[]
  pecasBiblioteca: Array<{ id: string; codigo: string; nome: string; imagem?: string }>
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
  ) => Promise<void>
  loadData?: (key: string) => Promise<unknown>
  onGerarOrcamento?: () => void
  logoHtml?: string
  empresaNonato?: OrcamentoPdfEmpresa
}

const PEDIDOS_AVULSO_KEY = 'nonato-pedidos-orcamento-avulso'
const ORCAMENTOS_AVULSO_KEY = 'nonato-orcamentos-avulso'

function criarBlocoEquipamentoVazio(): EquipamentoBlocoPedido {
  return {
    id: 'bloco-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    equipamento: null,
    equipamentoManual: '',
    pecas: [],
  }
}

function textoEquipamentoBloco(
  bloco: EquipamentoBlocoPedido,
  safeT: Record<string, string | undefined>
): string {
  if (bloco.equipamento) {
    const eq = bloco.equipamento
    return [
      [eq.tipoEquipamento, eq.modelo, eq.marca].filter(Boolean).join(' ').trim(),
      eq.numeroSerie ? `${safeT?.numeroSerie || 'Nº Série'}: ${eq.numeroSerie}` : '',
      eq.familia ? `${safeT?.familia || 'Família'}: ${eq.familia}` : '',
      eq.grupo ? `${safeT?.grupo || 'Grupo'}: ${eq.grupo}` : '',
    ]
      .filter(Boolean)
      .join(' · ')
  }
  return (bloco.equipamentoManual || '').trim() || '—'
}

function detalhesEquipamentoBloco(
  bloco: EquipamentoBlocoPedido,
  safeT: Record<string, string | undefined>
): Array<{ label: string; value: string }> {
  return montarCamposEquipamentoPedidoPdf(bloco.equipamento, bloco.equipamentoManual, {
    marca: safeT?.marca,
    modelo: safeT?.modelo,
    tipoEquipamento: safeT?.tipoEquipamento,
    numeroEquipamento: safeT?.numeroEquipamento,
    numeroSerie: safeT?.numeroSerie,
    familia: safeT?.familia,
    grupo: safeT?.grupo,
    descricao: safeT?.descricao,
  })
}

function todasPecasDosBlocos(blocos: EquipamentoBlocoPedido[]): PecaPedido[] {
  return blocos.flatMap((b) => b.pecas)
}

function textoEquipamentosAgregado(
  blocos: EquipamentoBlocoPedido[],
  safeT: Record<string, string | undefined>
): string {
  return blocos
    .map((b, i) => {
      const t = textoEquipamentoBloco(b, safeT)
      if (!t || t === '—') return ''
      return `${safeT?.equipamento || 'Equipamento'} ${i + 1}: ${t}`
    })
    .filter(Boolean)
    .join('\n')
}

function normalizarPedidoCarregado(p: PedidoAvulsoGuardado): PedidoAvulsoGuardado {
  if (p.equipamentosBlocos && p.equipamentosBlocos.length > 0) return p
  return {
    ...p,
    equipamentosBlocos: [
      {
        id: 'bloco-legado-' + p.codigo,
        equipamento: null,
        equipamentoManual: p.equipamentoTexto || '',
        pecas: Array.isArray(p.pecas) ? [...p.pecas] : [],
      },
    ],
  }
}

function lerPedidosLocalStorage(): PedidoAvulsoGuardado[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PEDIDOS_AVULSO_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.map((p) => normalizarPedidoCarregado(p as PedidoAvulsoGuardado)) : []
  } catch {
    return []
  }
}

function mergePedidosArrays(
  server: PedidoAvulsoGuardado[],
  local: PedidoAvulsoGuardado[]
): PedidoAvulsoGuardado[] {
  const map = new Map<string, PedidoAvulsoGuardado>()
  for (const p of server) {
    if (p?.codigo) map.set(p.codigo, normalizarPedidoCarregado(p))
  }
  for (const p of local) {
    if (!p?.codigo) continue
    const prev = map.get(p.codigo)
    const tPrev = prev ? new Date(prev.geradoEm || prev.dataGeracao || 0).getTime() : 0
    const tNew = new Date(p.geradoEm || p.dataGeracao || 0).getTime()
    if (!prev || tNew >= tPrev) map.set(p.codigo, normalizarPedidoCarregado(p))
  }
  return [...map.values()].sort(
    (a, b) =>
      new Date(b.dataGeracao || b.geradoEm || 0).getTime() -
      new Date(a.dataGeracao || a.geradoEm || 0).getTime()
  )
}

function formatarDataPedido(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function PedidoOrcamentosAvulsoContent({
  clientes,
  pecasBiblioteca,
  safeT,
  closeTab,
  activeTabId,
  voltarPaginaInicial,
  LogoComponent,
  saveData,
  loadData,
  onGerarOrcamento,
  logoHtml = '',
  empresaNonato,
}: Props) {
  const [clienteSelecionado, setClienteSelecionado] = useState<ClientePedido | null>(null)
  const [clienteNomeManual, setClienteNomeManual] = useState('')
  const [blocosEquipamento, setBlocosEquipamento] = useState<EquipamentoBlocoPedido[]>([criarBlocoEquipamentoVazio()])
  const [blocoAtivoId, setBlocoAtivoId] = useState<string>(() => blocosEquipamento[0]?.id || '')
  const [buscaCliente, setBuscaCliente] = useState('')
  const [buscaPeca, setBuscaPeca] = useState('')
  const [codigoManualPeca, setCodigoManualPeca] = useState('')
  const [nomeManualPeca, setNomeManualPeca] = useState('')
  const [imagemManualPeca, setImagemManualPeca] = useState('')
  const [urlImagemManualPeca, setUrlImagemManualPeca] = useState('')
  const [quantidadeNovaPeca, setQuantidadeNovaPeca] = useState(1)
  const imagemManualUploadId = useId()
  const imagemPecaEditUploadId = useId()
  const [pecaEditandoImagemId, setPecaEditandoImagemId] = useState<string | null>(null)
  const [urlImagemPecaEditando, setUrlImagemPecaEditando] = useState('')
  const [mostrarFormPeca, setMostrarFormPeca] = useState(false)
  const [modoPeca, setModoPeca] = useState<'biblioteca' | 'manual' | null>(null)
  const [emitirComoCliente, setEmitirComoCliente] = useState<'cliente' | 'nonato-service'>('nonato-service')
  const [pdfModelo, setPdfModelo] = useState(() => loadPdfModeloPadrao('pedidoAvulso'))
  const [pedidosGerados, setPedidosGerados] = useState<PedidoAvulsoGuardado[]>(() => lerPedidosLocalStorage())
  const [codigoUltimoGerado, setCodigoUltimoGerado] = useState<string | null>(null)
  const [buscaHistorico, setBuscaHistorico] = useState('')
  const [historicoCarregando, setHistoricoCarregando] = useState(false)

  const carregarPedidos = useCallback(async () => {
    const local = lerPedidosLocalStorage()
    if (!loadData) {
      if (local.length > 0) setPedidosGerados(local)
      return
    }
    setHistoricoCarregando(true)
    try {
      const raw = await loadData(PEDIDOS_AVULSO_KEY)
      const server = Array.isArray(raw) ? (raw as PedidoAvulsoGuardado[]).map(normalizarPedidoCarregado) : []
      const merged = mergePedidosArrays(server, local)
      setPedidosGerados(merged)
      if (merged.length === 0 && typeof fetch !== 'undefined') {
        try {
          const res = await fetch('/api/data/recuperar-pedidos-avulsos', { method: 'POST' })
          if (res.ok) {
            const body = (await res.json()) as { ok?: boolean; pedidos?: PedidoAvulsoGuardado[] }
            if (body.ok) {
              const raw2 = await loadData(PEDIDOS_AVULSO_KEY)
              const server2 = Array.isArray(raw2)
                ? (raw2 as PedidoAvulsoGuardado[]).map(normalizarPedidoCarregado)
                : []
              setPedidosGerados(mergePedidosArrays(server2, local))
            }
          }
        } catch {
          /* ignorar — recuperação automática opcional */
        }
      }
    } catch {
      if (local.length > 0) setPedidosGerados(local)
    } finally {
      setHistoricoCarregando(false)
    }
  }, [loadData])

  const handleRecuperarPedidosBackup = async () => {
    setHistoricoCarregando(true)
    try {
      const res = await fetch('/api/data/recuperar-pedidos-avulsos', { method: 'POST' })
      const body = (await res.json()) as {
        ok?: boolean
        message?: string
        pedidos?: Array<{ codigo: string; clienteNomeReal: string }>
      }
      if (!res.ok || !body.ok) {
        alert(body.message || safeT?.poaRecuperarSemDados || 'Não foi encontrado nenhum pedido para recuperar.')
        return
      }
      await carregarPedidos()
      const lista = (body.pedidos || []).map((p) => `${p.codigo} — ${p.clienteNomeReal}`).join('\n')
      alert(
        ((safeT as Record<string, string | undefined>)?.poaRecuperarOk ||
          'Pedidos recuperados com sucesso!') +
          (lista ? '\n\n' + lista : '')
      )
    } catch (err) {
      console.error(err)
      alert(safeT?.erroRecuperarPedidos || 'Erro ao recuperar pedidos. Tente RECUPERAR-PEDIDOS-AVULSOS.bat no PC.')
    } finally {
      setHistoricoCarregando(false)
    }
  }

  useEffect(() => {
    void carregarPedidos()
  }, [carregarPedidos])

  const pedidosHistoricoFiltrados = useMemo(() => {
    const q = buscaHistorico.trim().toLowerCase()
    const lista = [...pedidosGerados]
    if (!q) return lista
    return lista.filter((p) => {
      const codigo = String(p.codigo ?? '').toLowerCase()
      const cliente = String(p.clienteNomeReal ?? '').toLowerCase()
      const equip = String(p.equipamentoTexto ?? '').toLowerCase()
      return codigo.includes(q) || cliente.includes(q) || equip.includes(q)
    })
  }, [pedidosGerados, buscaHistorico])

  const clientesFiltrados = useMemo(() => {
    if (!buscaCliente.trim()) return clientes
    const b = buscaCliente.toLowerCase()
    return clientes.filter(
      (c) =>
        c.nomeEmpresa?.toLowerCase().includes(b) ||
        c.email?.toLowerCase().includes(b) ||
        c.telefones?.toLowerCase().includes(b) ||
        c.contato?.toLowerCase().includes(b) ||
        c.codigoCliente?.toLowerCase().includes(b)
    )
  }, [clientes, buscaCliente])

  const { resultados: pecasFiltradas, servidorLoading: buscaPecaServidorLoading } =
    useBuscaPecaBibliotecaComServidor(pecasBiblioteca, buscaPeca, 50)

  const nomeClienteExibido = clienteSelecionado ? clienteSelecionado.nomeEmpresa : clienteNomeManual || '—'
  const equipamentosDoCliente = clienteSelecionado?.equipamentos || []
  const blocoAtivo = blocosEquipamento.find((b) => b.id === blocoAtivoId) || blocosEquipamento[0]
  const totalPecas = todasPecasDosBlocos(blocosEquipamento).length

  const atualizarBloco = useCallback(
    (id: string, patch: Partial<EquipamentoBlocoPedido>) => {
      setBlocosEquipamento((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
    },
    []
  )

  const adicionarBlocoEquipamento = () => {
    const novo = criarBlocoEquipamentoVazio()
    setBlocosEquipamento((prev) => [...prev, novo])
    setBlocoAtivoId(novo.id)
  }

  const removerBlocoEquipamento = (id: string) => {
    if (blocosEquipamento.length <= 1) return
    setBlocosEquipamento((prev) => {
      const filtrados = prev.filter((b) => b.id !== id)
      if (blocoAtivoId === id && filtrados.length > 0) {
        setBlocoAtivoId(filtrados[filtrados.length - 1].id)
      }
      return filtrados
    })
  }

  const selecionarEquipamentoNoBloco = (
    blocoId: string,
    eq: EquipamentoClientePedido,
    idx: number
  ) => {
    atualizarBloco(blocoId, { equipamento: eq, equipamentoIdx: idx, equipamentoManual: '' })
  }

  const adicionarPecaAoBlocoAtivo = (peca: Omit<PecaPedido, 'id'> & { id?: string }) => {
    if (!blocoAtivo) return
    const nova: PecaPedido = { ...peca, id: peca.id || 'peca-' + Date.now() }
    setBlocosEquipamento((prev) =>
      prev.map((b) => {
        if (b.id !== blocoAtivo.id) return b
        const existente = b.pecas.find((p) => p.codigo && p.codigo === nova.codigo)
        if (existente && nova.codigo) {
          return {
            ...b,
            pecas: b.pecas.map((p) =>
              p.codigo === nova.codigo ? { ...p, quantidade: p.quantidade + nova.quantidade } : p
            ),
          }
        }
        return { ...b, pecas: [...b.pecas, nova] }
      })
    )
  }

  const adicionarPecaDaBiblioteca = (peca: { id: string; codigo: string; nome: string; imagem?: string }) => {
    adicionarPecaAoBlocoAtivo({
      id: peca.id + '-' + Date.now(),
      codigo: peca.codigo,
      nome: peca.nome,
      imagem: peca.imagem,
      quantidade: 1,
      pecaId: peca.id,
    })
    setBuscaPeca('')
    setMostrarFormPeca(false)
    setModoPeca(null)
  }

  const limparFormularioPecaManual = () => {
    setCodigoManualPeca('')
    setNomeManualPeca('')
    setImagemManualPeca('')
    setUrlImagemManualPeca('')
    setQuantidadeNovaPeca(1)
  }

  const resolverImagemManualPeca = () => {
    const url = urlImagemManualPeca.trim()
    const img = imagemManualPeca.trim()
    return img || url || undefined
  }

  const handleImagemManualFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        setImagemManualPeca(result)
        setUrlImagemManualPeca('')
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const alterarImagemPeca = (blocoId: string, pecaId: string, imagem?: string) => {
    setBlocosEquipamento((prev) =>
      prev.map((b) =>
        b.id === blocoId
          ? {
              ...b,
              pecas: b.pecas.map((p) => (p.id === pecaId ? { ...p, imagem: imagem || undefined } : p)),
            }
          : b
      )
    )
  }

  const handleImagemPecaEditFile = (
    blocoId: string,
    pecaId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        alterarImagemPeca(blocoId, pecaId, result)
        setPecaEditandoImagemId(null)
        setUrlImagemPecaEditando('')
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const aplicarUrlImagemPecaEditando = (blocoId: string, pecaId: string) => {
    const url = urlImagemPecaEditando.trim()
    if (!url) return
    alterarImagemPeca(blocoId, pecaId, url)
    setPecaEditandoImagemId(null)
    setUrlImagemPecaEditando('')
  }

  const adicionarPecaManual = () => {
    const codigo = (codigoManualPeca || '').trim()
    const nome = (nomeManualPeca || '').trim() || codigo || (safeT?.pecaManual || 'Peça manual')
    const imagem = resolverImagemManualPeca()
    if (!codigo && !nome) return
    adicionarPecaAoBlocoAtivo({
      id: 'manual-' + Date.now(),
      codigo: codigo || nome.slice(0, 20),
      nome,
      imagem,
      quantidade: quantidadeNovaPeca,
    })
    limparFormularioPecaManual()
    setMostrarFormPeca(false)
    setModoPeca(null)
  }

  const removerPeca = (blocoId: string, pecaId: string) => {
    setBlocosEquipamento((prev) =>
      prev.map((b) =>
        b.id === blocoId ? { ...b, pecas: b.pecas.filter((p) => p.id !== pecaId) } : b
      )
    )
  }

  const alterarQuantidadePeca = (blocoId: string, pecaId: string, delta: number) => {
    setBlocosEquipamento((prev) =>
      prev.map((b) => {
        if (b.id !== blocoId) return b
        return {
          ...b,
          pecas: b.pecas.map((p) => {
            if (p.id !== pecaId) return p
            const nova = p.quantidade + delta
            return { ...p, quantidade: nova < 1 ? 1 : nova }
          }),
        }
      })
    )
  }

  const atualizarObservacaoPeca = (
    blocoId: string,
    pecaId: string,
    incluir: boolean,
    texto?: string
  ) => {
    setBlocosEquipamento((prev) =>
      prev.map((b) =>
        b.id !== blocoId
          ? b
          : {
              ...b,
              pecas: b.pecas.map((p) =>
                p.id === pecaId
                  ? {
                      ...p,
                      incluirObservacao: incluir,
                      observacao: incluir ? (texto ?? p.observacao ?? '') : undefined,
                    }
                  : p
              ),
            }
      )
    )
  }

  const gerarProximoCodigo = (): string => {
    const ano = new Date().getFullYear()
    const prefix = `POA-${ano}-`
    const mesmosAno = pedidosGerados.filter((p) => p.codigo.startsWith(prefix))
    const nums = mesmosAno.map((p) => {
      const n = parseInt(p.codigo.replace(prefix, ''), 10)
      return isNaN(n) ? 0 : n
    })
    const next = (nums.length ? Math.max(...nums) : 0) + 1
    return `${prefix}${String(next).padStart(4, '0')}`
  }

  const pdfLabels = {
    titulo: safeT?.pedidoOrcamentoPdfTitulo || 'PEDIDO DE ORÇAMENTO',
    previewBanner:
      safeT?.pedidoOrcamentoPreviewBanner ||
      'Pré-visualização — o número definitivo é atribuído ao gerar o pedido',
    codigo: safeT?.codigoOrcamento || 'Código',
    data: safeT?.data || 'Data',
    cliente: safeT?.cliente || 'Cliente',
    equipamento: safeT?.equipamento || 'Equipamento',
    colImagem: safeT?.imagem || 'Imagem',
    colDescricao: safeT?.descricao || 'Descrição',
    colCodigo: safeT?.codigo || 'Código',
    colQtd: (safeT as Record<string, string | undefined>)?.poaPdfColQtd || safeT?.quantidade || 'Quantia',
    imprimir: safeT?.imprimirOrcamento || 'Imprimir / Guardar PDF',
    fechar: safeT?.fechar || 'Fechar',
    equipamentoNumero: safeT?.poaEquipamentoNumero || 'Equipamento',
    numeroEquipamento: safeT?.numeroEquipamento || 'Número do Equipamento',
    numeroSerie: safeT?.numeroSerie || 'Nº Série',
    marca: safeT?.marca || 'Marca',
    modelo: safeT?.modelo || 'Modelo',
    tipoEquipamento: safeT?.tipoEquipamento || 'Tipo',
    familia: safeT?.familia || 'Família',
    grupo: safeT?.grupo || 'Grupo',
    descricao: safeT?.descricao || 'Descrição',
    metaTitulo: safeT?.pedidoOrcamentoPdfMetaTitulo || 'Dados do pedido',
    pecasSolicitadas: safeT?.pecasSolicitadas || 'Referências',
    totalPecas: safeT?.poaPdfTotalUnidades || 'Unidades',
    totalEquipamentos: safeT?.poaPdfTotalEquipamentos || 'Equipamentos',
    documentoSemValor: safeT?.poaPdfSemValores || 'Pedido sem valores — aguarda orçamento',
    rodape: safeT?.pedidoOrcamentoPdfRodape || 'NONATO SERVICE — Documento gerado automaticamente.',
    emitidoEm: safeT?.orcamentoPdfEmitidoEm || 'Emitido em',
    emitente: safeT?.poaPdfEmitente || 'Emitente / cabeçalho',
    pecaObservacao: safeT?.pecaObservacao || 'Obs.',
  }

  function resolverDadosPedidoPdf() {
    const nomeReal = nomeClienteExibido
    if (!nomeReal || nomeReal === '—') {
      alert(safeT?.selecioneOuDigiteCliente || 'Selecione ou digite o nome do cliente.')
      return null
    }
    const pecasTotais = todasPecasDosBlocos(blocosEquipamento)
    if (pecasTotais.length === 0) {
      alert(safeT?.adicionePeloMenosUmaPeca || 'Adicione pelo menos uma peça ao pedido.')
      return null
    }
    const blocosValidos = blocosEquipamento.filter(
      (b) => b.pecas.length > 0 || b.equipamento || b.equipamentoManual.trim()
    )
    return { nomeReal, blocosValidos, pecasTotais }
  }

  const resolverEmpresaPdf = (
    emitirComo: 'cliente' | 'nonato-service',
    clienteRef: ClientePedido | null,
    nomeManual: string
  ) =>
    resolverEmpresaPedidoOrcamentoPdf(emitirComo, {
      empresaNonato: empresaNonato || { nomeEmpresa: safeT?.nomeNonatoService || 'NONATO SERVICE' },
      cliente: clienteRef || undefined,
      nomeClienteFallback: clienteRef?.nomeEmpresa || nomeManual,
    })

  const empresaPdfPreview = useMemo(
    () => resolverEmpresaPdf(emitirComoCliente, clienteSelecionado, clienteNomeManual),
    [emitirComoCliente, clienteSelecionado, clienteNomeManual, empresaNonato, safeT?.nomeNonatoService]
  )

  const montarPdfPayload = (
    codigo: string,
    preview: boolean,
    dataIso: string,
    nomeClienteReal: string,
    blocos: EquipamentoBlocoPedido[],
    emitirComo: 'cliente' | 'nonato-service',
    clienteRef: ClientePedido | null,
    nomeManual: string
  ) => ({
    codigo,
    preview,
    dataIso,
    clienteNomeDoc: nomeClienteReal,
    emitirComo,
    equipamentoTexto: textoEquipamentosAgregado(blocos, safeT),
    equipamentosBlocos: blocos.map((b, i) => {
      const blocoEnriquecido = enriquecerBlocoEquipamentoPedido(
        b,
        clienteRef?.equipamentos,
        undefined
      )
      const eq = blocoEnriquecido.equipamento
      const nomeEquip = eq
        ? [eq.marca, eq.modelo].filter(Boolean).join(' ').trim() ||
          eq.tipoEquipamento
        : blocoEnriquecido.equipamentoManual.trim()
      const campos = detalhesEquipamentoBloco(blocoEnriquecido, safeT)
      return {
        titulo: `${safeT?.poaEquipamentoNumero || 'Equipamento'} ${i + 1}${nomeEquip ? ` — ${nomeEquip}` : ''}`,
        detalhes: textoEquipamentoBloco(blocoEnriquecido, safeT),
        numeroEquipamento: eq ? resolverNumeroEquipamentoPdf(eq) || undefined : undefined,
        numeroSerie: eq ? resolverSerieEquipamentoPdf(eq) || undefined : undefined,
        campos,
        pecas: b.pecas.map((p) => ({
          codigo: p.codigo,
          nome: p.nome,
          quantidade: p.quantidade,
          imagem: p.imagem,
          observacao: p.incluirObservacao && p.observacao?.trim() ? p.observacao.trim() : undefined,
        })),
      }
    }),
    pecas: todasPecasDosBlocos(blocos).map((p) => ({
      codigo: p.codigo,
      nome: p.nome,
      quantidade: p.quantidade,
      imagem: p.imagem,
      observacao: p.incluirObservacao && p.observacao?.trim() ? p.observacao.trim() : undefined,
    })),
    logoHtml,
    empresa: resolverEmpresaPdf(emitirComo, clienteRef, nomeManual),
    emitirComo,
    pdfModelo,
    labels: pdfLabels,
  })

  const handleVisualizarPdf = () => {
    const dados = resolverDadosPedidoPdf()
    if (!dados) return
    const codigoProv = gerarProximoCodigo()
    openPedidoOrcamentoAvulsoPdf(
      montarPdfPayload(
        `${codigoProv} (${safeT?.provvisorio || 'prov.'})`,
        true,
        new Date().toISOString(),
        dados.nomeReal,
        dados.blocosValidos,
        emitirComoCliente,
        clienteSelecionado,
        clienteNomeManual
      )
    )
  }

  const handleVisualizarPdfGuardado = (pedido: PedidoAvulsoGuardado) => {
    const normalizado = normalizarPedidoCarregado(pedido)
    const clientePedido =
      (pedido.clienteId ? clientes.find((c) => c.id === pedido.clienteId) : null) ||
      (pedido.clienteNomeReal
        ? clientes.find(
            (c) => c.nomeEmpresa?.trim().toLowerCase() === pedido.clienteNomeReal.trim().toLowerCase()
          ) || null
        : null)
    const blocosEnriquecidos = (normalizado.equipamentosBlocos || []).map((b) =>
      enriquecerBlocoEquipamentoPedido(b, clientePedido?.equipamentos, pedido.equipamentoChave)
    )
    openPedidoOrcamentoAvulsoPdf(
      montarPdfPayload(
        pedido.codigo,
        false,
        pedido.dataGeracao,
        pedido.clienteNomeReal,
        blocosEnriquecidos,
        pedido.emitirComoCliente || 'cliente',
        clientePedido,
        pedido.clienteNomeReal
      )
    )
  }

  const handleReabrirPedido = (pedido: PedidoAvulsoGuardado) => {
    const normalizado = normalizarPedidoCarregado(pedido)
    if (pedido.clienteId) {
      const cl = clientes.find((c) => c.id === pedido.clienteId)
      if (cl) {
        setClienteSelecionado(cl)
        setClienteNomeManual('')
      } else {
        setClienteSelecionado(null)
        setClienteNomeManual(pedido.clienteNomeReal || '')
      }
    } else {
      setClienteSelecionado(null)
      setClienteNomeManual(pedido.clienteNomeReal || '')
    }
    setEmitirComoCliente(pedido.emitirComoCliente || 'cliente')
    const blocos =
      normalizado.equipamentosBlocos && normalizado.equipamentosBlocos.length > 0
        ? normalizado.equipamentosBlocos.map((b) => ({
            ...b,
            pecas: [...(b.pecas || [])],
            id: b.id || 'bloco-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
          }))
        : [criarBlocoEquipamentoVazio()]
    setBlocosEquipamento(blocos)
    setBlocoAtivoId(blocos[0].id)
    setCodigoUltimoGerado(null)
    setMostrarFormPeca(false)
    setModoPeca(null)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleCotacaoRecebida = async (pedido: PedidoAvulsoGuardado) => {
    const msg =
      (safeT as Record<string, string | undefined>)?.poaConfirmarCotacaoRecebida ||
      `Marcar cotação recebida do fornecedor para ${pedido.codigo}?\n\nSerá criado um rascunho de orçamento com o nome do cliente «${pedido.clienteNomeReal}» e dados do equipamento.\n\nDepois aplique os valores em Orçamentos Avulso e guarde para enviar ao cliente.`
    if (!confirm(msg)) return

    const agora = new Date().toISOString()
    const atualizado: PedidoAvulsoGuardado = {
      ...pedido,
      emitirComoCliente: 'cliente',
      workflowStatus: 'cotacao_recebida',
      cotacaoRecebidaEm: agora,
    }
    const atualizados = pedidosGerados.map((p) => (p.codigo === pedido.codigo ? atualizado : p))
    setPedidosGerados(atualizados)
    if (saveData) {
      try {
        await saveData(PEDIDOS_AVULSO_KEY, atualizados, true, true)
      } catch (err) {
        console.error('Erro ao guardar pedido:', err)
      }
    }

    if (loadData && saveData) {
      try {
        const raw = await loadData(ORCAMENTOS_AVULSO_KEY)
        const lista = Array.isArray(raw) ? raw : []
        const orcId = 'avulso-' + pedido.codigo
        const pecasTotais = pedido.equipamentosBlocos?.flatMap((b) => b.pecas) ?? pedido.pecas ?? []
        const orcamentoDraft = {
          id: orcId,
          numeroOrcamento: pedido.codigo,
          data: new Date().toISOString().split('T')[0],
          validade: '',
          descricao: pedido.equipamentoTexto,
          observacoes: '',
          tipo: 'pedido-avulso' as const,
          status: 'pendente' as const,
          workflowStatus: 'cotacao_recebida' as const,
          clienteId: pedido.clienteId,
          clienteNome: pedido.clienteNomeReal,
          emitirComoCliente: 'cliente' as const,
          equipamentoChave: pedido.equipamentoChave,
          equipamentoNumeroSerie: pedido.equipamentoNumeroSerie,
          equipamentosBlocos: pedido.equipamentosBlocos,
          geradoEm: agora,
          itens: pecasTotais.map((p) => ({
            descricao: p.nome,
            quantidade: p.quantidade,
            precoUnitario: 0,
            total: 0,
            codigo: p.codigo,
            tipoItem: 'sem-valor' as const,
            iva: 0,
            pecaId: p.pecaId,
            imagem: p.imagem,
            incluirObservacao: p.incluirObservacao,
            observacao: p.incluirObservacao && p.observacao?.trim() ? p.observacao.trim() : undefined,
          })),
          total: 0,
          totalSemIva: 0,
          totalIva: 0,
          dataCriacao: agora,
        }
        const idx = lista.findIndex(
          (o: { id?: string; numeroOrcamento?: string }) =>
            o.id === orcId || o.numeroOrcamento === pedido.codigo
        )
        const novosOrc =
          idx >= 0
            ? lista.map((o, i) => (i === idx ? { ...o, ...orcamentoDraft } : o))
            : [...lista, orcamentoDraft]
        await saveData(ORCAMENTOS_AVULSO_KEY, novosOrc, true, true)
      } catch (err) {
        console.error('Erro ao criar rascunho de orçamento:', err)
      }
    }

    alert(
      (safeT as Record<string, string | undefined>)?.poaCotacaoRecebidaAbrirOrcamentos ||
        `Cotação recebida registada para ${pedido.codigo}.\n\nAbra «Orçamentos Avulso», aplique os valores do fornecedor, guarde e envie o orçamento ao cliente.`
    )
    notifyEquipamentoOrcamentosChanged()
    onGerarOrcamento?.()
  }

  const handleExcluirPedido = async (codigo: string) => {
    if (!confirm(safeT?.confirmarExcluirPedidoOrcamento || 'Excluir este pedido?')) return
    const atualizados = pedidosGerados.filter((x) => x.codigo !== codigo)
    setPedidosGerados(atualizados)
    if (saveData) {
      try {
        await saveData(PEDIDOS_AVULSO_KEY, atualizados, true, true)
      } catch (err) {
        console.error('Erro ao excluir pedido:', err)
      }
    }
    notifyEquipamentoOrcamentosChanged()
  }

  const handleGerarPedido = async () => {
    const dados = resolverDadosPedidoPdf()
    if (!dados) return
    const { nomeReal, blocosValidos, pecasTotais } = dados
    const codigo = gerarProximoCodigo()
    const primeiroComEquip = blocosValidos.find((b) => b.equipamento || b.equipamentoManual.trim())
    const eqRef = primeiroComEquip?.equipamento
    const eqIdx = primeiroComEquip?.equipamentoIdx

    const novo: PedidoAvulsoGuardado = {
      codigo,
      dataGeracao: new Date().toISOString(),
      clienteNomeReal: nomeReal,
      clienteId: clienteSelecionado?.id,
      emitirComoCliente,
      equipamentoTexto: textoEquipamentosAgregado(blocosValidos, safeT),
      equipamentoChave:
        eqRef && eqIdx !== undefined && eqIdx >= 0
          ? resolverIdEquipamentoCliente(eqRef, eqIdx)
          : undefined,
      equipamentoNumeroSerie:
        blocosValidos
          .map((b) => (b.equipamento ? resolverNumeroEquipamentoPdf(b.equipamento) : ''))
          .filter(Boolean)
          .join(' · ') || undefined,
      pecas: [...pecasTotais],
      equipamentosBlocos: blocosValidos.map((b) => ({
        ...b,
        pecas: [...b.pecas],
      })),
      status: 'pendente',
      workflowStatus:
        emitirComoCliente === 'nonato-service' ? ('enviado_fornecedor' as const) : undefined,
      geradoEm: new Date().toISOString(),
    }

    const atualizados = [...pedidosGerados, novo]
    setPedidosGerados(atualizados)
    setCodigoUltimoGerado(codigo)
    if (saveData) {
      try {
        await saveData(PEDIDOS_AVULSO_KEY, atualizados, true, true)
      } catch (err) {
        console.error('Erro ao guardar pedido avulso:', err)
      }
    }

    if (saveData && loadData && emitirComoCliente === 'cliente') {
      try {
        let localLista: any[] = []
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(ORCAMENTOS_AVULSO_KEY)
            if (raw) {
              const parsed = JSON.parse(raw)
              if (Array.isArray(parsed)) localLista = parsed
            }
          } catch {
            /* ignorar */
          }
        }
        const existentes: any[] = (await loadData(ORCAMENTOS_AVULSO_KEY)) || []
        const serverLista = Array.isArray(existentes) ? existentes : []
        const listaOrcamentos = [...serverLista]
        for (const o of localLista) {
          if (o?.id && !listaOrcamentos.some((x) => x.id === o.id)) listaOrcamentos.push(o)
        }
        const orcamentoGerado = {
          id: 'avulso-' + codigo,
          numeroOrcamento: codigo,
          data: new Date().toISOString().split('T')[0],
          validade: '',
          descricao: novo.equipamentoTexto,
          observacoes: '',
          tipo: 'pedido-avulso' as const,
          status: 'pendente' as const,
          clienteId: clienteSelecionado?.id,
          clienteNome: nomeReal,
          emitirComoCliente,
          equipamentoChave: novo.equipamentoChave,
          equipamentoNumeroSerie: novo.equipamentoNumeroSerie,
          equipamentosBlocos: novo.equipamentosBlocos,
          geradoEm: novo.geradoEm,
          itens: pecasTotais.map((p) => ({
            descricao: p.nome,
            quantidade: p.quantidade,
            precoUnitario: 0,
            total: 0,
            codigo: p.codigo,
            tipoItem: 'sem-valor' as const,
            iva: 0,
            pecaId: p.pecaId,
            imagem: p.imagem,
            incluirObservacao: p.incluirObservacao,
            observacao: p.incluirObservacao && p.observacao?.trim() ? p.observacao.trim() : undefined,
          })),
          total: 0,
          totalSemIva: 0,
          totalIva: 0,
          dataCriacao: new Date().toISOString(),
        }
        await saveData(ORCAMENTOS_AVULSO_KEY, [...listaOrcamentos, orcamentoGerado], true, true)
      } catch (err) {
        console.error('Erro ao guardar orçamento gerado:', err)
      }
    }

    openPedidoOrcamentoAvulsoPdf(
      montarPdfPayload(
        codigo,
        false,
        novo.dataGeracao,
        nomeReal,
        blocosValidos,
        emitirComoCliente,
        clienteSelecionado,
        clienteNomeManual
      )
    )

    const emitenteDoc =
      emitirComoCliente === 'nonato-service'
        ? empresaPdfPreview.nomeEmpresa || safeT?.nomeNonatoService || 'NONATO SERVICE'
        : nomeReal

    const msgExtra =
      emitirComoCliente === 'nonato-service'
        ? '\n\n' +
          ((safeT as Record<string, string | undefined>)?.poaProximoPassoFornecedor ||
            'Próximo passo: envie o PDF ao fornecedor. Quando receber a cotação, use «Cotação recebida» no histórico.')
        : '\n\n' +
          ((safeT as Record<string, string | undefined>)?.poaOrcamentoGeradoCliente ||
            'Orçamento criado — aplique valores em Orçamentos Avulso.')

    alert(
      (safeT?.orcamentoSalvoGerado || safeT?.pedidoGeradoComSucesso || 'Pedido gerado com sucesso!') +
        '\n\n' +
        (safeT?.codigoOrcamento || 'Código do orçamento') +
        ': ' +
        codigo +
        '\n\n' +
        (safeT?.cliente || 'Cliente') +
        ': ' +
        nomeReal +
        '\n\n' +
        (safeT?.nomeNoDocumento || 'Emitente no cabeçalho') +
        ': ' +
        emitenteDoc +
        msgExtra
    )

    const blocoReset = criarBlocoEquipamentoVazio()
    setBlocosEquipamento([blocoReset])
    setBlocoAtivoId(blocoReset.id)
    notifyEquipamentoOrcamentosChanged()
    onGerarOrcamento?.()
  }

  const workflowLabel = (pedido: PedidoAvulsoGuardado) => {
    if (pedido.workflowStatus === 'enviado_fornecedor')
      return (safeT as Record<string, string | undefined>)?.poaStatusEnviadoFornecedor || 'Enviado ao fornecedor'
    if (pedido.workflowStatus === 'cotacao_recebida')
      return (safeT as Record<string, string | undefined>)?.poaStatusCotacaoRecebida || 'Cotação recebida'
    return statusLabel(pedido.status)
  }

  const statusBadgeClass = (status?: StatusPedidoAvulso) => {
    if (status === 'entregue') return 'orc-pro__badge orc-pro__badge--entregue'
    if (status === 'aprovado') return 'orc-pro__badge orc-pro__badge--aprovado'
    if (status === 'concluido') return 'orc-pro__badge orc-pro__badge--concluido'
    if (status === 'cancelado') return 'orc-pro__badge orc-pro__badge--cancelado'
    return 'orc-pro__badge'
  }

  const statusLabel = (status?: StatusPedidoAvulso) => {
    if (status === 'cancelado') return safeT?.pedidoCancelado || 'Pedido Cancelado'
    if (status === 'concluido') return safeT?.concluido || 'Concluído'
    if (status === 'aprovado') return safeT?.aprovado || 'Aprovado'
    if (status === 'entregue') return safeT?.entregue || 'Entregue'
    return safeT?.pendente || 'Pendente'
  }

  const limparNovoPedido = () => {
    setClienteSelecionado(null)
    setClienteNomeManual('')
    const bloco = criarBlocoEquipamentoVazio()
    setBlocosEquipamento([bloco])
    setBlocoAtivoId(bloco.id)
    setMostrarFormPeca(false)
    setModoPeca(null)
  }

  return (
    <div className="orc-pro poa-pro">
      <section className="orc-pro__hero poa-pro__hero">
        <div className="orc-pro__hero-top">
          <div className="orc-pro__hero-brand">
            <span className="orc-pro__hero-icon poa-pro__hero-icon" aria-hidden>
              POA
            </span>
            <div>
              <p className="orc-pro__eyebrow">{safeT?.pedidoOrcamentosAvulso || 'Pedidos'}</p>
              <h1 className="orc-pro__title">
                {safeT?.pedidoOrcamentosAvulsoTitle || 'Pedido de Orçamentos Avulso'}
              </h1>
              <p className="orc-pro__lead">
                {safeT?.poaDescricaoNova ||
                  safeT?.pedidoOrcamentoAvulsoDesc ||
                  'Monte pedidos profissionais com cliente, vários equipamentos e peças por equipamento.'}
              </p>
            </div>
          </div>
          <div className="orc-pro__hero-actions">
            <LogoComponent size="small" />
            <button type="button" className="orc-pro__btn" onClick={() => closeTab(activeTabId)} title={safeT?.voltar || 'Voltar'}>
              &larr;
            </button>
            <button type="button" className="orc-pro__btn orc-pro__btn--secondary" onClick={voltarPaginaInicial} title={safeT?.voltarInicio || 'Voltar ao Início'}>
              Home
            </button>
          </div>
        </div>
        <div className="orc-pro__kpis poa-pro__kpis">
          <div className="orc-pro__kpi">
            <span>{safeT?.equipamentos || 'Equipamentos'}</span>
            <strong>{blocosEquipamento.length}</strong>
          </div>
          <div className="orc-pro__kpi">
            <span>{safeT?.pecasNoPedido || 'Peças no pedido'}</span>
            <strong>{totalPecas}</strong>
          </div>
          <div className="orc-pro__kpi">
            <span>{safeT?.ultimosPedidosGerados || 'Pedidos gerados'}</span>
            <strong>{pedidosGerados.length}</strong>
          </div>
        </div>
      </section>

      <section className="orc-pro__panel poa-pro__panel poa-pro__historico-top">
        <div className="poa-pro__section-head">
          <div>
            <h3 className="orc-pro__panel-title">
              {safeT?.ultimosPedidosGerados || 'Histórico de pedidos'}
            </h3>
            <p className="orc-pro__panel-desc">
              {(safeT as Record<string, string | undefined>)?.poaHistoricoDesc ||
                'Consulte pedidos já gerados. Pode reabrir para editar, emitir PDF, converter de NONATO SERVICE para o cliente, ou aplicar valores em Orçamentos Avulso.'}
            </p>
          </div>
          <button
            type="button"
            className="orc-pro__btn orc-pro__btn--secondary"
            onClick={() => void carregarPedidos()}
            disabled={historicoCarregando}
            title={safeT?.atualizar || 'Actualizar'}
          >
            {historicoCarregando ? '…' : '↻'} {safeT?.atualizar || 'Actualizar'}
          </button>
          <button
            type="button"
            className="orc-pro__btn orc-pro__btn--secondary"
            onClick={() => void handleRecuperarPedidosBackup()}
            disabled={historicoCarregando}
            title={
              (safeT as Record<string, string | undefined>)?.poaRecuperarTitulo ||
              'Recuperar pedidos do snapshot/backups'
            }
          >
            {(safeT as Record<string, string | undefined>)?.poaRecuperarBackup || 'Recuperar backup'}
          </button>
        </div>
        <input
          type="text"
          className="orc-pro__search poa-pro__historico-search"
          placeholder={
            (safeT as Record<string, string | undefined>)?.poaBuscarHistorico ||
            'Buscar por código, cliente ou equipamento…'
          }
          value={buscaHistorico}
          onChange={(e) => setBuscaHistorico(e.target.value)}
        />
        {pedidosHistoricoFiltrados.length === 0 ? (
          <p className="orc-pro__empty-hint">
            {historicoCarregando
              ? safeT?.carregando || 'A carregar…'
              : pedidosGerados.length === 0
                ? (safeT as Record<string, string | undefined>)?.poaHistoricoVazio ||
                  'Ainda não há pedidos guardados. Gere um pedido abaixo — ficará listado aqui.'
                : (safeT as Record<string, string | undefined>)?.poaHistoricoSemResultados ||
                  'Nenhum pedido corresponde à busca.'}
          </p>
        ) : (
          <div className="orc-pro__history-list">
            {pedidosHistoricoFiltrados.slice(0, 50).map((p) => (
              <div key={p.codigo} className="orc-pro__history-card">
                <div className="orc-pro__history-head">
                  <span className="orc-pro__history-code">{p.codigo}</span>
                  <span className="orc-pro__history-meta">{formatarDataPedido(p.dataGeracao)}</span>
                  <span className="orc-pro__history-meta">{p.clienteNomeReal}</span>
                  <span
                    className={`orc-pro__badge ${p.emitirComoCliente === 'nonato-service' ? 'orc-pro__badge--aprovado' : ''}`}
                    title={safeT?.nomeNoDocumento || 'Emitente no cabeçalho'}
                  >
                    {p.emitirComoCliente === 'nonato-service'
                      ? safeT?.nomeNonatoService || 'NONATO SERVICE'
                      : safeT?.cliente || 'Cliente'}
                  </span>
                  <span className={statusBadgeClass(p.status)}>{workflowLabel(p)}</span>
                </div>
                {p.equipamentoTexto ? (
                  <p className="orc-pro__hint poa-pro__historico-equip">{p.equipamentoTexto.split('\n')[0]}</p>
                ) : null}
                <div className="orc-pro__actions-bar orc-pro__actions-bar--sm poa-pro__historico-actions">
                  <button type="button" className="orc-pro__act" onClick={() => handleReabrirPedido(p)}>
                    ↩ {safeT?.reabrir || 'Reabrir'}
                  </button>
                  <button type="button" className="orc-pro__act" onClick={() => handleVisualizarPdfGuardado(p)}>
                    👁️ PDF
                  </button>
                  {p.emitirComoCliente === 'nonato-service' && p.workflowStatus !== 'cotacao_recebida' ? (
                    <button
                      type="button"
                      className="orc-pro__act orc-pro__act--primary"
                      onClick={() => void handleCotacaoRecebida(p)}
                    >
                      {(safeT as Record<string, string | undefined>)?.poaCotacaoRecebida ||
                        'Cotação recebida'}
                    </button>
                  ) : null}
                  {p.workflowStatus === 'cotacao_recebida' ? (
                    <button type="button" className="orc-pro__act orc-pro__act--primary" onClick={() => onGerarOrcamento?.()}>
                      {(safeT as Record<string, string | undefined>)?.poaGerarOrcamentoCliente ||
                        'Gerar orçamento cliente'}
                    </button>
                  ) : null}
                  <button type="button" className="orc-pro__act" onClick={() => onGerarOrcamento?.()}>
                    {(safeT as Record<string, string | undefined>)?.poaAbrirOrcamentosAvulso ||
                      'Orçamentos Avulso'}
                  </button>
                  <button
                    type="button"
                    className="orc-pro__act orc-pro__act--danger"
                    onClick={() => void handleExcluirPedido(p.codigo)}
                  >
                    🗑️ {safeT?.deletar || 'Deletar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="poa-pro__steps" aria-hidden>
        <span className="poa-pro__step is-done">1. {safeT?.cliente || 'Cliente'}</span>
        <span className="poa-pro__step is-active">2. {safeT?.equipamentos || 'Equipamentos'}</span>
        <span className="poa-pro__step">3. {safeT?.gerarPedido || 'Gerar'}</span>
      </div>

      <div className="poa-pro__layout">
        <aside className="poa-pro__aside">
          <section className="orc-pro__panel poa-pro__panel">
            <h3 className="orc-pro__panel-title">{safeT?.cliente || 'Cliente'}</h3>
            <p className="orc-pro__panel-desc">
              {safeT?.poaClienteBuscaDesc || safeT?.buscarClienteOuDigitar || 'Selecione um cliente cadastrado ou digite o nome.'}
            </p>
            <ClienteAlfabetoPicker
              clientes={clientes}
              selectedId={clienteSelecionado?.id || ''}
              labels={{
                buscar: safeT.buscarCliente,
                nenhumEncontrado: safeT.nenhumClienteEncontrado,
                selecioneLetra: safeT.clientesAlfabetoSelecioneLetra,
                prompt: safeT.clientesAlfabetoPrompt,
                mostrando: safeT.mostrando,
                de: safeT.de,
                clientes: safeT.clientes,
                comInicial: safeT.clientesAlfabetoComInicial,
                outros: safeT.clientesAlfabetoOutros,
                semClientesLetra: safeT.clientesAlfabetoSemClientes,
                indiceAz: safeT.clientesAlfabetoIndice,
                limpar: safeT.delete,
                cliente: safeT.cliente,
                filtrados: safeT.filtrados,
              }}
              listMaxHeight={300}
              onSelect={(cliente) => {
                setClienteSelecionado(cliente as ClientePedido)
                setClienteNomeManual('')
                const bloco = criarBlocoEquipamentoVazio()
                setBlocosEquipamento([bloco])
                setBlocoAtivoId(bloco.id)
              }}
              onClear={() => {
                setClienteSelecionado(null)
                setClienteNomeManual('')
              }}
            />
            <div className="orc-pro__field">
              <label>{safeT?.ouNomeManualCliente || 'Ou nome do cliente (avulso)'}</label>
              <input
                type="text"
                className="orc-pro__input"
                placeholder={safeT?.nomeClienteManual || 'Digite o nome do cliente'}
                value={clienteNomeManual}
                onChange={(e) => {
                  setClienteNomeManual(e.target.value)
                  if (e.target.value) setClienteSelecionado(null)
                }}
              />
            </div>
          </section>

          {(clienteSelecionado || clienteNomeManual.trim()) && (
            <section className="orc-pro__panel poa-pro__panel poa-pro__client-card">
              <h3 className="orc-pro__panel-title">{safeT?.poaDadosCliente || 'Dados do cliente'}</h3>
              <p className="poa-pro__client-card-hint">
                {safeT?.poaSemMoradaAviso || 'Contacto e identificação — sem morada no pedido.'}
              </p>
              <dl className="poa-pro__info-grid">
                <div>
                  <dt>{safeT?.empresa || 'Empresa'}</dt>
                  <dd>{nomeClienteExibido}</dd>
                </div>
                {clienteSelecionado?.codigoCliente && (
                  <div>
                    <dt>{safeT?.clienteCodigoLabel || 'Código'}</dt>
                    <dd>{clienteSelecionado.codigoCliente}</dd>
                  </div>
                )}
                {clienteSelecionado?.contato && (
                  <div>
                    <dt>{safeT?.contato || 'Contato'}</dt>
                    <dd>{clienteSelecionado.contato}</dd>
                  </div>
                )}
                {clienteSelecionado?.email && (
                  <div>
                    <dt>{safeT?.email || 'E-mail'}</dt>
                    <dd>{clienteSelecionado.email}</dd>
                  </div>
                )}
                {clienteSelecionado?.telefones && (
                  <div>
                    <dt>{safeT?.telefone || 'Telefone'}</dt>
                    <dd>{clienteSelecionado.telefones}</dd>
                  </div>
                )}
                {clienteSelecionado?.numeroContribuicaoFiscal && (
                  <div>
                    <dt>{safeT?.contribuicaoFiscal || 'NIF'}</dt>
                    <dd>{clienteSelecionado.numeroContribuicaoFiscal}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </aside>

        <main className="poa-pro__main">
          <section className="orc-pro__panel poa-pro__panel">
            <div className="poa-pro__section-head">
              <div>
                <h3 className="orc-pro__panel-title">{safeT?.poaEquipamentosTitulo || 'Equipamentos e peças'}</h3>
                <p className="orc-pro__panel-desc">
                  {safeT?.poaEquipamentosDesc ||
                    'Adicione um ou vários equipamentos. Em cada um, seleccione do cadastro ou descreva manualmente e adicione as peças necessárias.'}
                </p>
              </div>
              <button type="button" className="orc-pro__btn orc-pro__btn--primary" onClick={adicionarBlocoEquipamento}>
                + {safeT?.poaAdicionarEquipamento || 'Adicionar equipamento'}
              </button>
            </div>

            <div className="poa-pro__blocos">
              {blocosEquipamento.map((bloco, blocoIndex) => {
                const isAtivo = bloco.id === blocoAtivoId
                const detalhes = detalhesEquipamentoBloco(bloco, safeT)
                return (
                  <article
                    key={bloco.id}
                    className={`poa-pro__bloco ${isAtivo ? 'is-active' : ''}`}
                    onClick={() => setBlocoAtivoId(bloco.id)}
                  >
                    <header className="poa-pro__bloco-head">
                      <span className="poa-pro__bloco-num">
                        {safeT?.poaEquipamentoNumero || 'Equipamento'} {blocoIndex + 1}
                      </span>
                      <span className="poa-pro__bloco-meta">
                        {bloco.pecas.length} {safeT?.pecas || 'peças'}
                      </span>
                      {blocosEquipamento.length > 1 && (
                        <button
                          type="button"
                          className="poa-pro__bloco-remove"
                          onClick={(e) => {
                            e.stopPropagation()
                            removerBlocoEquipamento(bloco.id)
                          }}
                          title={safeT?.poaRemoverEquipamento || 'Remover equipamento'}
                        >
                          ✕
                        </button>
                      )}
                    </header>

                    {equipamentosDoCliente.length > 0 && (
                      <div className="poa-pro__equip-picker">
                        <p className="poa-pro__sub-label">{safeT?.selecionarEquipamentoCadastro || 'Do cadastro do cliente'}</p>
                        <div className="poa-pro__equip-grid">
                          {equipamentosDoCliente.map((eq, idx) => (
                            <button
                              type="button"
                              key={idx}
                              className={`poa-pro__equip-btn ${
                                bloco.equipamento === eq && bloco.equipamentoIdx === idx ? 'is-active' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                selecionarEquipamentoNoBloco(bloco.id, eq, idx)
                                setBlocoAtivoId(bloco.id)
                              }}
                            >
                              <strong>{[eq.marca, eq.modelo].filter(Boolean).join(' ') || eq.tipoEquipamento}</strong>
                              <small>{eq.numeroSerie || eq.tipoEquipamento}</small>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="orc-pro__field" onClick={(e) => e.stopPropagation()}>
                      <label>{safeT?.descricaoManualEquipamento || 'Descrição manual (opcional)'}</label>
                      <input
                        type="text"
                        className="orc-pro__input"
                        placeholder={safeT?.equipamentoManualPlaceholder || 'Ex: Seccionadora HPP 250'}
                        value={bloco.equipamentoManual}
                        onChange={(e) =>
                          atualizarBloco(bloco.id, {
                            equipamentoManual: e.target.value,
                          })
                        }
                        onFocus={() => setBlocoAtivoId(bloco.id)}
                      />
                    </div>

                    {detalhes.length > 0 && (
                      <div className="poa-pro__equip-detalhe">
                        <p className="poa-pro__sub-label">{safeT?.poaEquipamentoDetalhes || 'Informação do equipamento'}</p>
                        <dl className="poa-pro__info-grid poa-pro__info-grid--equip">
                          {detalhes.map((d) => (
                            <div key={d.label}>
                              <dt>{d.label}</dt>
                              <dd>{d.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}

                    {isAtivo && (
                      <div className="poa-pro__pecas-zone" onClick={(e) => e.stopPropagation()}>
                        <div className="poa-pro__pecas-head">
                          <div>
                            <h4>{safeT?.pecasDesteEquipamento || 'Peças deste equipamento'}</h4>
                            <p className="poa-pro__pecas-desc">
                              {safeT?.adicionarPecasDesc ||
                                'Busque na Biblioteca de Peças por código/nome ou digite o código manualmente.'}
                            </p>
                          </div>
                        </div>

                        <div className="orc-pro__actions-bar orc-pro__actions-bar--sm poa-pro__pecas-actions">
                          <button
                            type="button"
                            className={`orc-pro__btn orc-pro__btn--primary${
                              mostrarFormPeca && modoPeca === 'biblioteca' ? ' is-active' : ''
                            }`}
                            onClick={() => {
                              setMostrarFormPeca(true)
                              setModoPeca('biblioteca')
                              if (!buscaPeca.trim()) setBuscaPeca('')
                            }}
                          >
                            📚 {safeT?.orcamentoBuscarBibliotecaPecas || 'Buscar na Biblioteca de Peças'}
                          </button>
                          <button
                            type="button"
                            className={`orc-pro__btn orc-pro__btn--secondary${
                              mostrarFormPeca && modoPeca === 'manual' ? ' is-active' : ''
                            }`}
                            onClick={() => {
                              setMostrarFormPeca(true)
                              setModoPeca('manual')
                              limparFormularioPecaManual()
                            }}
                          >
                            ✏️ {safeT?.digitarCodigoManual || 'Digitar código / peça manual'}
                          </button>
                        </div>

                        {mostrarFormPeca ? (
                            <div className="orc-pro__form-box">
                              {modoPeca === 'biblioteca' && (
                                <>
                                  <p className="orc-pro__list-hint">
                                    {(safeT as any)?.poaBuscaPecaHint ||
                                      'Pesquise por código (com ou sem hífen) ou nome e clique em «Adicionar peça».'}
                                  </p>
                                  <input
                                    type="text"
                                    className="orc-pro__input"
                                    value={buscaPeca}
                                    onChange={(e) => setBuscaPeca(e.target.value)}
                                    placeholder={safeT?.buscarPorCodigoOuNome || 'Buscar código ou nome'}
                                    autoFocus
                                  />
                                  <div className="orc-pro__list">
                                    {buscaPecaServidorLoading ? (
                                      <p className="orc-pro__list-empty">A procurar no catálogo completo do servidor…</p>
                                    ) : null}
                                    {pecasFiltradas.length === 0 && buscaPeca.trim() && !buscaPecaServidorLoading ? (
                                      <p className="orc-pro__list-empty">
                                        {safeT?.orcamentoBibliotecaNenhumaPeca ||
                                          'Nenhuma peça encontrada. A busca aceita código com ou sem hífens (ex.: 2-029-95-0951). Se não existir na biblioteca, use «Manual» ou cadastre na Biblioteca de Peças.'}
                                      </p>
                                    ) : null}
                                    {pecasFiltradas.map((peca) => (
                                      <div
                                        key={peca.id}
                                        className="orc-pro__list-item orc-pro__list-item--peca"
                                      >
                                        <ProImageHoverPreview
                                          src={peca.imagem}
                                          alt={peca.nome}
                                          label={`${peca.codigo} — ${peca.nome}`}
                                          disablePreview={!peca.imagem}
                                          thumbClassName="orc-pro__peca-thumb"
                                        >
                                          —
                                        </ProImageHoverPreview>
                                        <div className="orc-pro__peca-info orc-pro__peca-info--grow">
                                          <strong>{peca.nome}</strong>
                                          <small>{peca.codigo}</small>
                                        </div>
                                        <button
                                          type="button"
                                          className="orc-pro__btn orc-pro__btn--primary orc-pro__btn--sm"
                                          onClick={() => adicionarPecaDaBiblioteca(peca)}
                                        >
                                          + {safeT?.adicionarPeca || 'Adicionar peça'}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                              {modoPeca === 'manual' && (
                                <>
                                  <input
                                    type="text"
                                    className="orc-pro__input"
                                    value={codigoManualPeca}
                                    onChange={(e) => setCodigoManualPeca(e.target.value)}
                                    placeholder={safeT?.codigoPecaBiblioteca || 'Código'}
                                  />
                                  <input
                                    type="text"
                                    className="orc-pro__input"
                                    value={nomeManualPeca}
                                    onChange={(e) => setNomeManualPeca(e.target.value)}
                                    placeholder={safeT?.nomePecaBiblioteca || 'Nome'}
                                  />
                                  <input
                                    type="number"
                                    min={1}
                                    className="orc-pro__input orc-pro__input--qty"
                                    value={quantidadeNovaPeca}
                                    onChange={(e) => setQuantidadeNovaPeca(parseInt(e.target.value, 10) || 1)}
                                  />
                                  <div className="orc-pro__imagem-manual">
                                    <label htmlFor={imagemManualUploadId}>
                                      {safeT?.imagem || 'Imagem da peça'} ({safeT?.opcional || 'opcional'})
                                    </label>
                                    <p className="orc-pro__imagem-manual-hint">
                                      {safeT?.poaImagemPecaHint ||
                                        'Carregue uma foto ou cole o URL da imagem para aparecer no PDF.'}
                                    </p>
                                    <input
                                      id={imagemManualUploadId}
                                      type="file"
                                      accept="image/*"
                                      className="orc-pro__imagem-manual-file"
                                      onChange={handleImagemManualFile}
                                    />
                                    <div className="orc-pro__imagem-manual-actions">
                                      <label htmlFor={imagemManualUploadId} className="orc-pro__btn orc-pro__btn--secondary">
                                        📷 {safeT?.carregarImagem || 'Carregar imagem'}
                                      </label>
                                      {(imagemManualPeca || urlImagemManualPeca) && (
                                        <button
                                          type="button"
                                          className="orc-pro__btn"
                                          onClick={() => {
                                            setImagemManualPeca('')
                                            setUrlImagemManualPeca('')
                                          }}
                                        >
                                          {safeT?.removerImagem || 'Remover imagem'}
                                        </button>
                                      )}
                                    </div>
                                    <input
                                      type="url"
                                      className="orc-pro__input"
                                      value={urlImagemManualPeca}
                                      onChange={(e) => {
                                        setUrlImagemManualPeca(e.target.value)
                                        if (e.target.value.trim()) setImagemManualPeca('')
                                      }}
                                      placeholder={safeT?.urlImagem || 'URL da imagem (https://...)'}
                                    />
                                    {(imagemManualPeca || urlImagemManualPeca) && (
                                      <div className="orc-pro__imagem-manual-preview">
                                        <ProImageHoverPreview
                                          src={resolverImagemManualPeca()}
                                          alt={nomeManualPeca || codigoManualPeca || 'Peça'}
                                          label={safeT?.imagem || 'Imagem'}
                                          thumbClassName="orc-pro__peca-thumb orc-pro__peca-thumb--lg"
                                        >
                                          —
                                        </ProImageHoverPreview>
                                      </div>
                                    )}
                                  </div>
                                  <button type="button" className="orc-pro__btn orc-pro__btn--primary" onClick={adicionarPecaManual}>
                                    + {safeT?.adicionarPeca || 'Adicionar peça'}
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                className="orc-pro__btn"
                                onClick={() => {
                                  setMostrarFormPeca(false)
                                  setModoPeca(null)
                                }}
                              >
                                {safeT?.cancel || 'Cancelar'}
                              </button>
                            </div>
                        ) : null}

                        {bloco.pecas.length === 0 && !mostrarFormPeca && (
                          <p className="poa-pro__pecas-empty">
                            {(safeT as any)?.poaNenhumaPecaEquipamento ||
                              'Nenhuma peça neste equipamento. Use «Buscar na Biblioteca de Peças» ou «Digitar código / peça manual».'}
                          </p>
                        )}

                        {bloco.pecas.length > 0 && (
                          <div className="orc-pro__pecas-stack">
                            {bloco.pecas.map((p) => (
                              <div key={p.id} className="orc-pro__peca-card">
                                <ProImageHoverPreview
                                  src={p.imagem}
                                  alt={p.nome}
                                  label={`${p.codigo} — ${p.nome}`}
                                  disablePreview={!p.imagem}
                                  thumbClassName="orc-pro__peca-thumb orc-pro__peca-thumb--lg"
                                >
                                  —
                                </ProImageHoverPreview>
                                <div className="orc-pro__peca-info">
                                  <strong>{p.nome}</strong>
                                  <small>{p.codigo}</small>
                                  <button
                                    type="button"
                                    className="orc-pro__act orc-pro__act--sm"
                                    onClick={() => {
                                      setPecaEditandoImagemId(pecaEditandoImagemId === p.id ? null : p.id)
                                      setUrlImagemPecaEditando(p.imagem?.startsWith('http') ? p.imagem : '')
                                    }}
                                  >
                                    📷 {p.imagem ? safeT?.alterarImagem || 'Alterar imagem' : safeT?.adicionarImagem || 'Adicionar imagem'}
                                  </button>
                                  {pecaEditandoImagemId === p.id && (
                                    <div className="orc-pro__imagem-manual orc-pro__imagem-manual--inline">
                                      <input
                                        id={`${imagemPecaEditUploadId}-${p.id}`}
                                        type="file"
                                        accept="image/*"
                                        className="orc-pro__imagem-manual-file"
                                        onChange={(e) => handleImagemPecaEditFile(bloco.id, p.id, e)}
                                      />
                                      <div className="orc-pro__imagem-manual-actions">
                                        <label
                                          htmlFor={`${imagemPecaEditUploadId}-${p.id}`}
                                          className="orc-pro__btn orc-pro__btn--secondary"
                                        >
                                          📷 {safeT?.carregarImagem || 'Carregar'}
                                        </label>
                                        {p.imagem && (
                                          <button
                                            type="button"
                                            className="orc-pro__btn"
                                            onClick={() => {
                                              alterarImagemPeca(bloco.id, p.id, undefined)
                                              setPecaEditandoImagemId(null)
                                            }}
                                          >
                                            {safeT?.removerImagem || 'Remover'}
                                          </button>
                                        )}
                                      </div>
                                      <input
                                        type="url"
                                        className="orc-pro__input"
                                        value={urlImagemPecaEditando}
                                        onChange={(e) => setUrlImagemPecaEditando(e.target.value)}
                                        placeholder={safeT?.urlImagem || 'URL da imagem'}
                                      />
                                      <button
                                        type="button"
                                        className="orc-pro__btn orc-pro__btn--primary"
                                        onClick={() => aplicarUrlImagemPecaEditando(bloco.id, p.id)}
                                      >
                                        {safeT?.aplicar || 'Aplicar URL'}
                                      </button>
                                    </div>
                                  )}
                                  <PecaObservacaoToggle
                                    incluir={Boolean(p.incluirObservacao)}
                                    texto={p.observacao || ''}
                                    safeT={safeT}
                                    onIncluirChange={(sim) =>
                                      atualizarObservacaoPeca(bloco.id, p.id, sim, sim ? p.observacao : '')
                                    }
                                    onTextoChange={(texto) =>
                                      atualizarObservacaoPeca(bloco.id, p.id, true, texto)
                                    }
                                  />
                                </div>
                                <div className="orc-pro__peca-actions">
                                  <div className="orc-pro__peca-qty">
                                    <button
                                      type="button"
                                      className="orc-pro__act"
                                      title={safeT?.diminuirQuantidade || 'Diminuir quantidade'}
                                      onClick={() => alterarQuantidadePeca(bloco.id, p.id, -1)}
                                    >
                                      −
                                    </button>
                                    <span>{p.quantidade}</span>
                                    <button
                                      type="button"
                                      className="orc-pro__act"
                                      title={safeT?.aumentarQuantidade || 'Aumentar quantidade'}
                                      onClick={() => alterarQuantidadePeca(bloco.id, p.id, 1)}
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    className="orc-pro__btn orc-pro__btn--danger orc-pro__btn--sm"
                                    title={safeT?.delete || 'Excluir'}
                                    onClick={() => {
                                      if (
                                        !confirm(
                                          (safeT as any)?.confirmarExcluirPecaEquipamento ||
                                            'Retirar esta peça deste equipamento?'
                                        )
                                      ) {
                                        return
                                      }
                                      removerPeca(bloco.id, p.id)
                                    }}
                                  >
                                    🗑️ {safeT?.delete || 'Excluir'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>

          <section className="orc-pro__panel poa-pro__panel poa-pro__gerar">
            <h3 className="orc-pro__panel-title">{safeT?.gerarDocumentoComo || 'Ao gerar documento'}</h3>
            <PdfModeloPickerField
              value={pdfModelo}
              onChange={(model) =>
                setPdfModelo(
                  persistPdfModeloPadrao('pedidoAvulso', model, saveData as ((k: string, d: unknown) => Promise<unknown>) | undefined)
                )
              }
              labels={safeT}
              label={safeT?.selecioneModeloPDF || 'Modelo de PDF'}
              hint={
                (safeT as Record<string, string | undefined>)?.orcamentoPdfModeloHint ||
                'Estilo visual do pedido (como nos relatórios de serviço).'
              }
              compact
              className="poa-pro__pdf-modelo"
            />
            <div className="orc-pro__radio-row">
              <label>
                <input
                  type="radio"
                  name="emitirComo"
                  checked={emitirComoCliente === 'cliente'}
                  onChange={() => setEmitirComoCliente('cliente')}
                />
                <span>{safeT?.gerarComNomeCliente || 'Com nome do cliente'}</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="emitirComo"
                  checked={emitirComoCliente === 'nonato-service'}
                  onChange={() => setEmitirComoCliente('nonato-service')}
                />
                <span>{safeT?.gerarComNomeNonatoService || 'Com nome da NONATO SERVICE'}</span>
              </label>
            </div>
            <div className="poa-pro__emitente-preview">
              {emitirComoCliente === 'cliente' ? (
                <>
                  <p className="poa-pro__emitente-preview-title">
                    {(safeT as Record<string, string | undefined>)?.poaPdfClientePedido ||
                      safeT?.cliente ||
                      'Cliente do pedido'}
                    :
                  </p>
                  <p className="poa-pro__emitente-preview-nome">
                    <strong>{nomeClienteExibido}</strong>
                  </p>
                </>
              ) : null}
              <p className="poa-pro__emitente-preview-title" style={{ marginTop: emitirComoCliente === 'cliente' ? '12px' : 0 }}>
                {safeT?.dadosEmitenteDocumento || 'Cabeçalho do documento (emitente)'}:
              </p>
              <p className="poa-pro__emitente-preview-nome">
                <strong>{empresaPdfPreview.nomeEmpresa || '—'}</strong>
              </p>
              {empresaPdfPreview.morada ? <p>{empresaPdfPreview.morada}</p> : null}
              {empresaPdfPreview.nif ? (
                <p>
                  {(safeT?.identificacaoFiscal || safeT?.nif || 'NIF') + ': ' + empresaPdfPreview.nif}
                </p>
              ) : null}
              {empresaPdfPreview.telefone ? (
                <p>{(safeT?.telefone || safeT?.telefones || 'Telefone') + ': ' + empresaPdfPreview.telefone}</p>
              ) : null}
              {empresaPdfPreview.email ? (
                <p>{(safeT?.email || 'E-mail') + ': ' + empresaPdfPreview.email}</p>
              ) : null}
            </div>
            <div className="poa-pro__gerar-actions">
              <button type="button" className="orc-pro__btn orc-pro__btn--secondary" onClick={limparNovoPedido}>
                {safeT?.limpar || 'Limpar'}
              </button>
              <button type="button" className="orc-pro__btn orc-pro__btn--secondary" onClick={handleVisualizarPdf}>
                👁️ {safeT?.visualizarPdfPedido || 'Visualizar PDF'}
              </button>
              <button type="button" className="orc-pro__btn orc-pro__btn--primary" onClick={handleGerarPedido}>
                {safeT?.gerarPedido || 'Gerar pedido'}
              </button>
            </div>
            {codigoUltimoGerado && (
              <div className="orc-pro__chip orc-pro__chip--success">
                <strong>{safeT?.codigoOrcamento || 'Código'}:</strong> {codigoUltimoGerado}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

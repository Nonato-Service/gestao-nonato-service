'use client'

import React, { useState, useMemo, useEffect, useId, useCallback } from 'react'
import { openPedidoOrcamentoAvulsoPdf } from '../lib/pedidoOrcamentoAvulsoPdf'
import {
  enriquecerBlocoEquipamentoPedido,
  montarCamposEquipamentoPedidoPdf,
} from '../lib/pedidoOrcamentoAvulsoEquipamento'
import {
  resolverEmpresaPedidoOrcamentoPdf,
  resolverNumeroEquipamentoPdf,
  resolverSerieEquipamentoPdf,
  type OrcamentoPdfEmpresa,
} from '../lib/orcamentoPdfPro'
import { resolverIdEquipamentoCliente } from '../lib/relatorioServicoEquipamentos'
import { ProImageHoverPreview } from './ProImageHoverPreview'

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
  numeroNotaFiscalEntrega?: string
  entregaConfirmadaEm?: string
  geradoEm?: string
}

type Props = {
  clientes: ClientePedido[]
  pecasBiblioteca: Array<{ id: string; codigo: string; nome: string; imagem?: string }>
  safeT: Record<string, string | undefined>
  closeTab: (tabId: string) => void
  activeTabId: string
  voltarPaginaInicial: () => void
  LogoComponent: React.ComponentType<{ size?: 'small' | 'medium' | 'large' }>
  saveData?: (key: string, data: any) => Promise<void>
  loadData?: (key: string) => Promise<any>
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
  const [mostrarFormPeca, setMostrarFormPeca] = useState(false)
  const [modoPeca, setModoPeca] = useState<'biblioteca' | 'manual' | null>(null)
  const [emitirComoCliente, setEmitirComoCliente] = useState<'cliente' | 'nonato-service'>('cliente')
  const [pedidosGerados, setPedidosGerados] = useState<PedidoAvulsoGuardado[]>([])
  const [codigoUltimoGerado, setCodigoUltimoGerado] = useState<string | null>(null)

  useEffect(() => {
    if (!loadData) return
    loadData(PEDIDOS_AVULSO_KEY)
      .then((data) => {
        if (data && Array.isArray(data)) {
          setPedidosGerados((data as PedidoAvulsoGuardado[]).map(normalizarPedidoCarregado))
        }
      })
      .catch(() => {})
  }, [loadData])

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

  const pecasFiltradas = useMemo(() => {
    if (!buscaPeca.trim()) return pecasBiblioteca.slice(0, 50)
    const b = buscaPeca.toLowerCase()
    return pecasBiblioteca.filter(
      (p) =>
        (p.codigo || '').toLowerCase().includes(b) ||
        (p.nome || '').toLowerCase().includes(b)
    )
  }, [pecasBiblioteca, buscaPeca])

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
    const nomeNoDoc =
      emitirComoCliente === 'nonato-service'
        ? safeT?.nomeNonatoService || 'NONATO SERVICE'
        : nomeReal
    return { nomeReal, nomeNoDoc, blocosValidos, pecasTotais }
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
    nomeNoDoc: string,
    blocos: EquipamentoBlocoPedido[],
    emitirComo: 'cliente' | 'nonato-service',
    clienteRef: ClientePedido | null,
    nomeManual: string
  ) => ({
    codigo,
    preview,
    dataIso,
    clienteNomeDoc: nomeNoDoc,
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
        })),
      }
    }),
    pecas: todasPecasDosBlocos(blocos).map((p) => ({
      codigo: p.codigo,
      nome: p.nome,
      quantidade: p.quantidade,
      imagem: p.imagem,
    })),
    logoHtml,
    empresa: resolverEmpresaPdf(emitirComo, clienteRef, nomeManual),
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
        dados.nomeNoDoc,
        dados.blocosValidos,
        emitirComoCliente,
        clienteSelecionado,
        clienteNomeManual
      )
    )
  }

  const handleVisualizarPdfGuardado = (pedido: PedidoAvulsoGuardado) => {
    const normalizado = normalizarPedidoCarregado(pedido)
    const nomeNoDoc =
      pedido.emitirComoCliente === 'nonato-service'
        ? safeT?.nomeNonatoService || 'NONATO SERVICE'
        : pedido.clienteNomeReal
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
        nomeNoDoc,
        blocosEnriquecidos,
        pedido.emitirComoCliente,
        clientePedido,
        pedido.clienteNomeReal
      )
    )
  }

  const handleGerarPedido = async () => {
    const dados = resolverDadosPedidoPdf()
    if (!dados) return
    const { nomeReal, nomeNoDoc, blocosValidos, pecasTotais } = dados
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
      geradoEm: new Date().toISOString(),
    }

    const atualizados = [...pedidosGerados, novo]
    setPedidosGerados(atualizados)
    setCodigoUltimoGerado(codigo)
    if (saveData) {
      try {
        await saveData(PEDIDOS_AVULSO_KEY, atualizados)
      } catch (_) {}
    }

    if (saveData && loadData) {
      try {
        const existentes: any[] = (await loadData(ORCAMENTOS_AVULSO_KEY)) || []
        const listaOrcamentos = Array.isArray(existentes) ? existentes : []
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
          clienteNome: nomeNoDoc,
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
          })),
          total: 0,
          totalSemIva: 0,
          totalIva: 0,
          dataCriacao: new Date().toISOString(),
        }
        await saveData(ORCAMENTOS_AVULSO_KEY, [...listaOrcamentos, orcamentoGerado])
      } catch (_) {}
    }

    openPedidoOrcamentoAvulsoPdf(
      montarPdfPayload(
        codigo,
        false,
        novo.dataGeracao,
        nomeNoDoc,
        blocosValidos,
        emitirComoCliente,
        clienteSelecionado,
        clienteNomeManual
      )
    )

    alert(
      (safeT?.orcamentoSalvoGerado || safeT?.pedidoGeradoComSucesso || 'Orçamento salvo e gerado com sucesso!') +
        '\n\n' +
        (safeT?.codigoOrcamento || 'Código do orçamento') +
        ': ' +
        codigo +
        '\n\n' +
        (safeT?.nomeNoDocumento || 'Nome no documento') +
        ': ' +
        nomeNoDoc +
        '\n\n' +
        (safeT?.guardeCodigoParaLocalizar || 'Guarde este código para localizar o orçamento depois.')
    )

    const blocoReset = criarBlocoEquipamentoVazio()
    setBlocosEquipamento([blocoReset])
    setBlocoAtivoId(blocoReset.id)
    onGerarOrcamento?.()
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
            <input
              type="text"
              className="orc-pro__search"
              placeholder={safeT?.buscarCliente || 'Buscar por nome, e-mail ou contacto...'}
              value={buscaCliente}
              onChange={(e) => setBuscaCliente(e.target.value)}
            />
            <div className="orc-pro__list poa-pro__client-list">
              {clientesFiltrados.length === 0 ? (
                <p className="orc-pro__empty-hint">{safeT?.nenhumClienteEncontrado || 'Nenhum cliente encontrado'}</p>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <button
                    type="button"
                    key={cliente.id}
                    className={`poa-pro__pick-btn ${clienteSelecionado?.id === cliente.id ? 'is-active' : ''}`}
                    onClick={() => {
                      setClienteSelecionado(cliente)
                      setClienteNomeManual('')
                      const bloco = criarBlocoEquipamentoVazio()
                      setBlocosEquipamento([bloco])
                      setBlocoAtivoId(bloco.id)
                    }}
                  >
                    <strong>{cliente.nomeEmpresa}</strong>
                    {cliente.codigoCliente && <small>{cliente.codigoCliente}</small>}
                  </button>
                ))
              )}
            </div>
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
                          <h4>{safeT?.pecasDesteEquipamento || 'Peças deste equipamento'}</h4>
                          {!mostrarFormPeca ? (
                            <div className="orc-pro__actions-bar orc-pro__actions-bar--sm">
                              <button
                                type="button"
                                className="orc-pro__btn orc-pro__btn--primary"
                                onClick={() => {
                                  setMostrarFormPeca(true)
                                  setModoPeca('biblioteca')
                                  setBuscaPeca('')
                                }}
                              >
                                📚 {safeT?.orcamentoBuscarBibliotecaPecas || 'Biblioteca'}
                              </button>
                              <button
                                type="button"
                                className="orc-pro__btn orc-pro__btn--secondary"
                                onClick={() => {
                                  setMostrarFormPeca(true)
                                  setModoPeca('manual')
                                  limparFormularioPecaManual()
                                }}
                              >
                                ✏️ {safeT?.digitarCodigoManual || 'Manual'}
                              </button>
                            </div>
                          ) : (
                            <div className="orc-pro__form-box">
                              {modoPeca === 'biblioteca' && (
                                <>
                                  <input
                                    type="text"
                                    className="orc-pro__input"
                                    value={buscaPeca}
                                    onChange={(e) => setBuscaPeca(e.target.value)}
                                    placeholder={safeT?.buscarPorCodigoOuNome || 'Buscar código ou nome'}
                                    autoFocus
                                  />
                                  <div className="orc-pro__list">
                                    {pecasFiltradas.map((peca) => (
                                      <div
                                        key={peca.id}
                                        className="orc-pro__list-item orc-pro__list-item--peca"
                                        onClick={() => adicionarPecaDaBiblioteca(peca)}
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
                                        <div className="orc-pro__peca-info">
                                          <strong>{peca.nome}</strong>
                                          <small>{peca.codigo}</small>
                                        </div>
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
                                  <input
                                    id={imagemManualUploadId}
                                    type="file"
                                    accept="image/*"
                                    className="orc-pro__imagem-manual-file"
                                    onChange={handleImagemManualFile}
                                  />
                                  <button type="button" className="orc-pro__btn orc-pro__btn--primary" onClick={adicionarPecaManual}>
                                    {safeT?.adicionar || 'Adicionar'}
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
                          )}
                        </div>

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
                                </div>
                                <div className="orc-pro__peca-qty">
                                  <button type="button" className="orc-pro__act" onClick={() => alterarQuantidadePeca(bloco.id, p.id, -1)}>
                                    −
                                  </button>
                                  <span>{p.quantidade}</span>
                                  <button type="button" className="orc-pro__act" onClick={() => alterarQuantidadePeca(bloco.id, p.id, 1)}>
                                    +
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  className="orc-pro__act orc-pro__act--danger"
                                  onClick={() => removerPeca(bloco.id, p.id)}
                                >
                                  X
                                </button>
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
              <p className="poa-pro__emitente-preview-title">
                {safeT?.dadosEmitenteDocumento || 'Dados no documento (cabeçalho)'}:
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

          {pedidosGerados.length > 0 && (
            <section className="orc-pro__panel poa-pro__panel">
              <h3 className="orc-pro__panel-title">{safeT?.ultimosPedidosGerados || 'Histórico de pedidos'}</h3>
              <div className="orc-pro__history-list">
                {[...pedidosGerados].reverse().slice(0, 50).map((p) => (
                  <div key={p.codigo} className="orc-pro__history-card">
                    <div className="orc-pro__history-head">
                      <span className="orc-pro__history-code">{p.codigo}</span>
                      <span className="orc-pro__history-meta">
                        {p.emitirComoCliente === 'nonato-service'
                          ? safeT?.nomeNonatoService || 'NONATO SERVICE'
                          : p.clienteNomeReal}
                      </span>
                      <span className={statusBadgeClass(p.status)}>{statusLabel(p.status)}</span>
                    </div>
                    <div className="orc-pro__actions-bar orc-pro__actions-bar--sm">
                      <button type="button" className="orc-pro__act" onClick={() => handleVisualizarPdfGuardado(p)}>
                        👁️ PDF
                      </button>
                      <button
                        type="button"
                        className="orc-pro__act orc-pro__act--danger"
                        onClick={async () => {
                          if (!confirm(safeT?.confirmarExcluirPedidoOrcamento || 'Excluir este pedido?')) return
                          const atualizados = pedidosGerados.filter((x) => x.codigo !== p.codigo)
                          setPedidosGerados(atualizados)
                          if (saveData) await saveData(PEDIDOS_AVULSO_KEY, atualizados)
                        }}
                      >
                        🗑️ {safeT?.deletar || 'Deletar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

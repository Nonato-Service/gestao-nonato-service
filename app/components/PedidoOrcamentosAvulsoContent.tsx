'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { openPedidoOrcamentoAvulsoPdf } from '../lib/pedidoOrcamentoAvulsoPdf'
import { ProImageHoverPreview } from './ProImageHoverPreview'

export type ClientePedido = {
  id: string
  nomeEmpresa: string
  morada?: string
  conselho?: string
  codigoPostal?: string
  pais?: string
  email?: string
  telefones?: string
  equipamentos: EquipamentoClientePedido[]
}

export type EquipamentoClientePedido = {
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

export type StatusPedidoAvulso = 'pendente' | 'cancelado' | 'concluido' | 'aprovado' | 'entregue'

export type PedidoAvulsoGuardado = {
  codigo: string
  dataGeracao: string
  clienteNomeReal: string
  emitirComoCliente: 'cliente' | 'nonato-service'
  equipamentoTexto: string
  pecas: PecaPedido[]
  status?: StatusPedidoAvulso
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
}

const PEDIDOS_AVULSO_KEY = 'nonato-pedidos-orcamento-avulso'

const ORCAMENTOS_AVULSO_KEY = 'nonato-orcamentos-avulso'

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
  logoHtml = ''
}: Props) {
  const [clienteSelecionado, setClienteSelecionado] = useState<ClientePedido | null>(null)
  const [clienteNomeManual, setClienteNomeManual] = useState('')
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState<EquipamentoClientePedido | null>(null)
  const [equipamentoManual, setEquipamentoManual] = useState('')
  const [pecasPedido, setPecasPedido] = useState<PecaPedido[]>([])
  const [buscaCliente, setBuscaCliente] = useState('')
  const [buscaPeca, setBuscaPeca] = useState('')
  const [codigoManualPeca, setCodigoManualPeca] = useState('')
  const [nomeManualPeca, setNomeManualPeca] = useState('')
  const [quantidadeNovaPeca, setQuantidadeNovaPeca] = useState(1)
  const [mostrarFormPeca, setMostrarFormPeca] = useState(false)
  const [modoPeca, setModoPeca] = useState<'biblioteca' | 'manual' | null>(null)
  const [emitirComoCliente, setEmitirComoCliente] = useState<'cliente' | 'nonato-service'>('cliente')
  const [pedidosGerados, setPedidosGerados] = useState<PedidoAvulsoGuardado[]>([])
  const [codigoUltimoGerado, setCodigoUltimoGerado] = useState<string | null>(null)

  useEffect(() => {
    if (!loadData) return
    loadData(PEDIDOS_AVULSO_KEY).then((data) => {
      if (data && Array.isArray(data)) setPedidosGerados(data as PedidoAvulsoGuardado[])
    }).catch(() => {})
  }, [loadData])

  const clientesFiltrados = useMemo(() => {
    if (!buscaCliente.trim()) return clientes
    const b = buscaCliente.toLowerCase()
    return clientes.filter(
      (c) =>
        c.nomeEmpresa?.toLowerCase().includes(b) ||
        c.email?.toLowerCase().includes(b) ||
        c.telefones?.toLowerCase().includes(b) ||
        c.morada?.toLowerCase().includes(b) ||
        c.codigoPostal?.toLowerCase().includes(b) ||
        c.conselho?.toLowerCase().includes(b) ||
        c.pais?.toLowerCase().includes(b)
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

  const adicionarPecaDaBiblioteca = (peca: { id: string; codigo: string; nome: string; imagem?: string }) => {
    const existente = pecasPedido.find((p) => p.codigo === peca.codigo)
    if (existente) {
      setPecasPedido((prev) =>
        prev.map((p) => (p.codigo === peca.codigo ? { ...p, quantidade: p.quantidade + 1 } : p))
      )
    } else {
      setPecasPedido((prev) => [
        ...prev,
        {
          id: peca.id + '-' + Date.now(),
          codigo: peca.codigo,
          nome: peca.nome,
          imagem: peca.imagem,
          quantidade: 1,
          pecaId: peca.id
        }
      ])
    }
    setBuscaPeca('')
    setMostrarFormPeca(false)
    setModoPeca(null)
  }

  const adicionarPecaManual = () => {
    const codigo = (codigoManualPeca || '').trim()
    const nome = (nomeManualPeca || '').trim() || codigo || (safeT?.pecaManual || 'Peça manual')
    if (!codigo && !nome) return
    const existente = pecasPedido.find((p) => p.codigo === codigo && codigo)
    if (existente && codigo) {
      setPecasPedido((prev) =>
        prev.map((p) => (p.codigo === codigo ? { ...p, quantidade: p.quantidade + quantidadeNovaPeca } : p))
      )
    } else {
      setPecasPedido((prev) => [
        ...prev,
        {
          id: 'manual-' + Date.now(),
          codigo: codigo || nome.slice(0, 20),
          nome,
          imagem: undefined,
          quantidade: quantidadeNovaPeca
        }
      ])
    }
    setCodigoManualPeca('')
    setNomeManualPeca('')
    setQuantidadeNovaPeca(1)
    setMostrarFormPeca(false)
    setModoPeca(null)
  }

  const removerPeca = (id: string) => {
    setPecasPedido((prev) => prev.filter((p) => p.id !== id))
  }

  const alterarQuantidadePeca = (id: string, delta: number) => {
    setPecasPedido((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const nova = p.quantidade + delta
        return { ...p, quantidade: nova < 1 ? 1 : nova }
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
    previewBanner: safeT?.pedidoOrcamentoPreviewBanner || 'Pré-visualização — o número definitivo é atribuído ao gerar o pedido',
    codigo: safeT?.codigoOrcamento || 'Código',
    data: safeT?.data || 'Data',
    cliente: safeT?.cliente || 'Cliente',
    equipamento: safeT?.equipamento || 'Equipamento',
    colImagem: safeT?.imagem || 'Imagem',
    colDescricao: safeT?.descricao || 'Descrição',
    colCodigo: safeT?.codigo || 'Código',
    colQtd: safeT?.quantidade || 'Qtd',
    imprimir: safeT?.imprimirOrcamento || 'Imprimir / Guardar PDF',
    fechar: safeT?.fechar || 'Fechar',
  }

  function resolverDadosPedidoPdf() {
    const nomeReal = nomeClienteExibido
    if (!nomeReal || nomeReal === '—') {
      alert(safeT?.selecioneOuDigiteCliente || 'Selecione ou digite o nome do cliente.')
      return null
    }
    if (pecasPedido.length === 0) {
      alert(safeT?.adicionePeloMenosUmaPeca || 'Adicione pelo menos uma peça ao pedido.')
      return null
    }
    const equipamentoTexto = equipamentoSelecionado
      ? `${equipamentoSelecionado.tipoEquipamento} ${equipamentoSelecionado.modelo || ''} - ${equipamentoSelecionado.marca}`
      : equipamentoManual || '—'
    const nomeNoDoc =
      emitirComoCliente === 'nonato-service'
        ? safeT?.nomeNonatoService || 'NONATO SERVICE'
        : nomeReal
    return { nomeReal, equipamentoTexto, nomeNoDoc }
  }

  const handleVisualizarPdf = () => {
    const dados = resolverDadosPedidoPdf()
    if (!dados) return
    const codigoProv = gerarProximoCodigo()
    openPedidoOrcamentoAvulsoPdf({
      codigo: `${codigoProv} (${safeT?.provvisorio || 'prov.'})`,
      preview: true,
      dataIso: new Date().toISOString(),
      clienteNomeDoc: dados.nomeNoDoc,
      equipamentoTexto: dados.equipamentoTexto,
      pecas: pecasPedido.map((p) => ({
        codigo: p.codigo,
        nome: p.nome,
        quantidade: p.quantidade,
        imagem: p.imagem,
      })),
      logoHtml,
      labels: pdfLabels,
    })
  }

  const handleVisualizarPdfGuardado = (pedido: PedidoAvulsoGuardado) => {
    const nomeNoDoc =
      pedido.emitirComoCliente === 'nonato-service'
        ? safeT?.nomeNonatoService || 'NONATO SERVICE'
        : pedido.clienteNomeReal
    openPedidoOrcamentoAvulsoPdf({
      codigo: pedido.codigo,
      preview: false,
      dataIso: pedido.dataGeracao,
      clienteNomeDoc: nomeNoDoc,
      equipamentoTexto: pedido.equipamentoTexto,
      pecas: pedido.pecas.map((p) => ({
        codigo: p.codigo,
        nome: p.nome,
        quantidade: p.quantidade,
        imagem: p.imagem,
      })),
      logoHtml,
      labels: pdfLabels,
    })
  }

  const handleGerarPedido = async () => {
    const dados = resolverDadosPedidoPdf()
    if (!dados) return
    const { nomeReal, equipamentoTexto, nomeNoDoc } = dados
    const codigo = gerarProximoCodigo()
    const novo: PedidoAvulsoGuardado = {
      codigo,
      dataGeracao: new Date().toISOString(),
      clienteNomeReal: nomeReal,
      emitirComoCliente,
      equipamentoTexto,
      pecas: [...pecasPedido]
    }
    const atualizados = [...pedidosGerados, novo]
    setPedidosGerados(atualizados)
    setCodigoUltimoGerado(codigo)
    if (saveData) {
      try {
        await saveData(PEDIDOS_AVULSO_KEY, atualizados)
      } catch (_) {}
    }

    // Gravar também em Orçamentos Gerados (barra lateral > Orçamentos > Orçamentos Gerados)
    const nomeNoDocPdf =
      emitirComoCliente === 'nonato-service'
        ? safeT?.nomeNonatoService || 'NONATO SERVICE'
        : nomeReal
    if (saveData && loadData) {
      try {
        const existentes: any[] = (await loadData(ORCAMENTOS_AVULSO_KEY)) || []
        const listaOrcamentos = Array.isArray(existentes) ? existentes : []
        const orcamentoGerado = {
          id: 'avulso-' + codigo,
          numeroOrcamento: codigo,
          data: new Date().toISOString().split('T')[0],
          validade: '',
          descricao: equipamentoTexto,
          observacoes: '',
          tipo: 'pedido-avulso' as const,
          clienteNome: nomeNoDocPdf,
          itens: pecasPedido.map((p) => ({
            descricao: p.nome,
            quantidade: p.quantidade,
            precoUnitario: 0,
            total: 0,
            codigo: p.codigo,
            tipoItem: 'sem-valor' as const,
            iva: 0,
            pecaId: p.pecaId,
            imagem: p.imagem
          })),
          total: 0,
          totalSemIva: 0,
          totalIva: 0,
          dataCriacao: new Date().toISOString()
        }
        await saveData(ORCAMENTOS_AVULSO_KEY, [...listaOrcamentos, orcamentoGerado])
      } catch (_) {}
    }

    alert(
      (safeT?.pedidoGeradoComSucesso || 'Pedido gerado com sucesso!') + '\n\n' +
      (safeT?.codigoOrcamento || 'Código do orçamento') + ': ' + codigo + '\n\n' +
      (safeT?.nomeNoDocumento || 'Nome no documento') + ': ' + nomeNoDoc + '\n\n' +
      (safeT?.guardeCodigoParaLocalizar || 'Guarde este código para localizar o orçamento depois.')
    )
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

  return (
    <div className="orc-pro">
      <section className="orc-pro__hero">
        <div className="orc-pro__hero-top">
          <div className="orc-pro__hero-brand">
            <span className="orc-pro__hero-icon" aria-hidden>
              POA
            </span>
            <div>
              <p className="orc-pro__eyebrow">{safeT?.pedidoOrcamentosAvulso || 'Pedidos'}</p>
              <h1 className="orc-pro__title">
                {safeT?.pedidoOrcamentosAvulsoTitle || 'Pedido de Orçamentos Avulso'}
              </h1>
              <p className="orc-pro__lead">
                {safeT?.pedidoOrcamentoAvulsoDesc || 'Monte pedidos com cliente, equipamento e peças de forma rápida e organizada.'}
              </p>
            </div>
          </div>
          <div className="orc-pro__hero-actions">
            <LogoComponent size="small" />
            <button
              type="button"
              className="orc-pro__btn"
              onClick={() => closeTab(activeTabId)}
              title={safeT?.voltar || 'Voltar'}
            >
              &larr;
            </button>
            <button
              type="button"
              className="orc-pro__btn orc-pro__btn--secondary"
              onClick={voltarPaginaInicial}
              title={safeT?.voltarInicio || 'Voltar ao Início'}
            >
              Home
            </button>
          </div>
        </div>
        <div className="orc-pro__kpis">
          <div className="orc-pro__kpi">
            <span>{safeT?.pecasNoPedido || 'Peças no pedido'}</span>
            <strong>{pecasPedido.length}</strong>
          </div>
          <div className="orc-pro__kpi">
            <span>{safeT?.ultimosPedidosGerados || 'Pedidos gerados'}</span>
            <strong>{pedidosGerados.length}</strong>
          </div>
        </div>
      </section>

      <div className="orc-pro__layout">
        <aside className="orc-pro__sidebar">
          <section className="orc-pro__panel">
            <h3 className="orc-pro__panel-title">{safeT?.cliente || 'Cliente'}</h3>
            <p className="orc-pro__panel-desc">
              {safeT?.buscarClienteOuDigitar || 'Selecione um cliente cadastrado ou digite o nome manualmente.'}
            </p>
            <input
              type="text"
              className="orc-pro__search"
              placeholder={safeT?.buscarCliente || 'Buscar cliente por nome ou email...'}
              value={buscaCliente}
              onChange={(e) => setBuscaCliente(e.target.value)}
            />
            <div className="orc-pro__list">
              {clientesFiltrados.length === 0 ? (
                <p className="orc-pro__empty-hint">
                  {safeT?.nenhumClienteEncontrado || 'Nenhum cliente encontrado'}
                </p>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <div
                    key={cliente.id}
                    className={`orc-pro__list-item ${clienteSelecionado?.id === cliente.id ? 'is-active' : ''}`}
                    onClick={() => {
                      setClienteSelecionado(cliente)
                      setClienteNomeManual('')
                      setEquipamentoSelecionado(null)
                    }}
                  >
                    <strong>{cliente.nomeEmpresa}</strong>
                    {(cliente.morada || cliente.codigoPostal || cliente.conselho || cliente.email) && (
                      <small>
                        {[cliente.morada, cliente.codigoPostal, cliente.conselho, cliente.email].filter(Boolean).join(' · ')}
                      </small>
                    )}
                  </div>
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
            {(clienteSelecionado || clienteNomeManual) && (
              <div className="orc-pro__chip">
                <strong>{safeT?.clienteSelecionado || 'Cliente'}:</strong> {nomeClienteExibido}
              </div>
            )}
          </section>

          <section className="orc-pro__panel">
            <h3 className="orc-pro__panel-title">{safeT?.equipamento || 'Equipamento'}</h3>
            <p className="orc-pro__panel-desc">
              {safeT?.equipamentoDescPedido || 'Se o cliente for cadastrado, escolha um equipamento ou descreva manualmente.'}
            </p>
            {equipamentosDoCliente.length > 0 && (
              <div className="orc-pro__list orc-pro__list--equip">
                {equipamentosDoCliente.map((eq, idx) => (
                  <div
                    key={idx}
                    className={`orc-pro__list-item orc-pro__list-item--equip ${equipamentoSelecionado === eq ? 'is-active' : ''}`}
                    onClick={() => {
                      setEquipamentoSelecionado(eq)
                      setEquipamentoManual('')
                    }}
                  >
                    <strong>
                      {eq.tipoEquipamento} {eq.modelo && `- ${eq.modelo}`}
                    </strong>
                    <small>
                      {eq.marca} {eq.numeroSerie && `· Nº Série: ${eq.numeroSerie}`}
                    </small>
                  </div>
                ))}
              </div>
            )}
            <div className="orc-pro__field">
              <label>{safeT?.descricaoManualEquipamento || 'Descrição manual do equipamento (opcional)'}</label>
              <input
                type="text"
                className="orc-pro__input"
                placeholder={safeT?.equipamentoManualPlaceholder || 'Ex: Seccionadora HPP 250'}
                value={equipamentoManual}
                onChange={(e) => {
                  setEquipamentoManual(e.target.value)
                  if (e.target.value) setEquipamentoSelecionado(null)
                }}
              />
            </div>
            {(equipamentoSelecionado || equipamentoManual) && (
              <div className="orc-pro__chip">
                <strong>{safeT?.equipamento || 'Equipamento'}:</strong>{' '}
                {equipamentoSelecionado
                  ? `${equipamentoSelecionado.tipoEquipamento} ${equipamentoSelecionado.modelo || ''} - ${equipamentoSelecionado.marca}`
                  : equipamentoManual}
              </div>
            )}
          </section>
        </aside>

        <main className="orc-pro__main">
          <section className="orc-pro__panel">
            <h3 className="orc-pro__panel-title">{safeT?.adicionarPecas || 'Adicionar peças'}</h3>
            <p className="orc-pro__panel-desc">
              {safeT?.adicionarPecasDesc || 'Busque na Biblioteca de Peças por código/nome ou digite o código manualmente.'}
            </p>
            {!mostrarFormPeca ? (
              <div className="orc-pro__actions-bar">
                <button
                  type="button"
                  className="orc-pro__btn orc-pro__btn--primary"
                  onClick={() => { setMostrarFormPeca(true); setModoPeca('biblioteca'); setBuscaPeca(''); }}
                >
                  📚 {safeT?.orcamentoBuscarBibliotecaPecas || 'Buscar na Biblioteca de Peças'}
                </button>
                <button
                  type="button"
                  className="orc-pro__btn orc-pro__btn--secondary"
                  onClick={() => { setMostrarFormPeca(true); setModoPeca('manual'); setCodigoManualPeca(''); setNomeManualPeca(''); setQuantidadeNovaPeca(1); }}
                >
                  ✏️ {safeT?.digitarCodigoManual || 'Digitar código / peça manual'}
                </button>
              </div>
            ) : (
              <div className="orc-pro__form-box">
                {modoPeca === 'biblioteca' && (
                  <>
                    <div className="orc-pro__field">
                      <label>{safeT?.buscarPorCodigoOuNome || safeT?.buscarPorCodigo || 'Buscar por código ou nome'}</label>
                      <input
                        type="text"
                        className="orc-pro__input"
                        value={buscaPeca}
                        onChange={(e) => setBuscaPeca(e.target.value)}
                        placeholder={safeT?.codigoPecaBiblioteca || 'Código'}
                        autoFocus
                      />
                    </div>
                    <div className="orc-pro__list">
                      {pecasFiltradas.length === 0 ? (
                        <p className="orc-pro__empty-hint">{safeT?.nenhumaPecaEncontrada || 'Nenhuma peça encontrada'}</p>
                      ) : (
                        pecasFiltradas.map((peca) => (
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
                        ))
                      )}
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
                      placeholder={safeT?.nomePecaBiblioteca || 'Nome da peça'}
                    />
                    <div className="orc-pro__field">
                      <label>{safeT?.quantidade || 'Quantidade'}</label>
                      <input
                        type="number"
                        min={1}
                        className="orc-pro__input orc-pro__input--qty"
                        value={quantidadeNovaPeca}
                        onChange={(e) => setQuantidadeNovaPeca(parseInt(e.target.value, 10) || 1)}
                      />
                    </div>
                    <button
                      type="button"
                      className="orc-pro__btn orc-pro__btn--primary"
                      onClick={adicionarPecaManual}
                    >
                      {safeT?.adicionar || 'Adicionar'}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="orc-pro__btn"
                  onClick={() => { setMostrarFormPeca(false); setModoPeca(null); }}
                >
                  {safeT?.cancel || 'Cancelar'}
                </button>
              </div>
            )}

            {pecasPedido.length > 0 && (
              <div className="orc-pro__pecas-stack">
                <h4 className="orc-pro__panel-title">{safeT?.pecasNoPedido || 'Peças no pedido'}</h4>
                {pecasPedido.map((p) => (
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
                      <button
                        type="button"
                        className="orc-pro__act"
                        onClick={() => alterarQuantidadePeca(p.id, -1)}
                      >
                        −
                      </button>
                      <span>{p.quantidade}</span>
                      <button
                        type="button"
                        className="orc-pro__act"
                        onClick={() => alterarQuantidadePeca(p.id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="orc-pro__act orc-pro__act--danger"
                      onClick={() => removerPeca(p.id)}
                      title={safeT?.delete || 'Remover'}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="orc-pro__panel">
            <h3 className="orc-pro__panel-title">{safeT?.gerarDocumentoComo || 'Ao gerar documento'}</h3>
            <p className="orc-pro__panel-desc">
              {safeT?.desejaGerarComNomeClienteOuNonato || 'Deseja gerar com o nome do cliente ou com o nome da NONATO SERVICE? Se escolher NONATO SERVICE, no documento enviado ao revendedor aparecerá apenas o nome NONATO SERVICE; o resto mantém-se (equipamento, peças).'}
            </p>
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
            <div className="orc-pro__actions-bar">
              <button
                type="button"
                className="orc-pro__btn orc-pro__btn--secondary"
                onClick={handleVisualizarPdf}
              >
                👁️ {safeT?.visualizarPdfPedido || safeT?.visualizar || 'Visualizar PDF'}
              </button>
              <button
                type="button"
                className="orc-pro__btn orc-pro__btn--primary"
                onClick={handleGerarPedido}
              >
                {safeT?.gerarPedido || 'Gerar pedido'}
              </button>
            </div>
            <p className="orc-pro__hint">
              {safeT?.pedidoOrcamentoPreviewHint || 'Use «Visualizar PDF» para ver o documento antes de gerar. Depois imprima ou guarde como PDF no browser.'}
            </p>
            {codigoUltimoGerado && (
              <div className="orc-pro__chip orc-pro__chip--success">
                <strong>{safeT?.codigoOrcamento || 'Código do orçamento'}:</strong> {codigoUltimoGerado}
                <br />
                <small>{safeT?.guardeCodigoParaLocalizar || 'Guarde este código para localizar o orçamento depois.'}</small>
              </div>
            )}
          </section>

          {pedidosGerados.length > 0 && (
            <section className="orc-pro__panel">
              <h3 className="orc-pro__panel-title">
                {safeT?.ultimosPedidosGerados || 'Últimos pedidos (localizar por código)'}
              </h3>
              <div className="orc-pro__history-list">
                {[...pedidosGerados].reverse().slice(0, 50).map((p) => (
                  <div key={p.codigo} className="orc-pro__history-card">
                    <div className="orc-pro__history-head">
                      <span className="orc-pro__history-code">{p.codigo}</span>
                      <span className="orc-pro__history-meta">
                        {p.emitirComoCliente === 'nonato-service' ? (safeT?.nomeNonatoService || 'NONATO SERVICE') : p.clienteNomeReal}
                      </span>
                      <span className="orc-pro__history-meta">
                        {new Date(p.dataGeracao).toLocaleDateString('pt-BR')}
                      </span>
                      <span className={statusBadgeClass(p.status)}>{statusLabel(p.status)}</span>
                    </div>
                    <div className="orc-pro__actions-bar orc-pro__actions-bar--sm">
                      <button
                        type="button"
                        className="orc-pro__act"
                        onClick={() => handleVisualizarPdfGuardado(p)}
                      >
                        👁️ PDF
                      </button>
                      <button
                        type="button"
                        className="orc-pro__act"
                        onClick={async () => {
                          if (saveData) await saveData(PEDIDOS_AVULSO_KEY, pedidosGerados)
                          alert(safeT?.orcamentoSalvo || 'Orçamento salvo com sucesso!')
                        }}
                      >
                        💾 {safeT?.guardar || 'Guardar'}
                      </button>
                      <button
                        type="button"
                        className="orc-pro__act orc-pro__act--danger"
                        onClick={async () => {
                          if (!confirm(safeT?.confirmarExcluirPedidoOrcamento || safeT?.confirmarExcluirOrcamento || 'Deseja realmente excluir este pedido?')) return
                          const atualizados = pedidosGerados.filter((x) => x.codigo !== p.codigo)
                          setPedidosGerados(atualizados)
                          if (saveData) await saveData(PEDIDOS_AVULSO_KEY, atualizados)
                          if (loadData && saveData) {
                            try {
                              const orcamentos: any[] = (await loadData(ORCAMENTOS_AVULSO_KEY)) || []
                              const lista = Array.isArray(orcamentos) ? orcamentos : []
                              const semEste = lista.filter((o: any) => o.id !== 'avulso-' + p.codigo)
                              await saveData(ORCAMENTOS_AVULSO_KEY, semEste)
                            } catch (_) {}
                          }
                        }}
                      >
                        🗑️ {safeT?.deletar || 'Deletar'}
                      </button>
                      {(['cancelado', 'concluido', 'aprovado', 'entregue'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={`orc-pro__status-chip orc-pro__status-chip--${status} ${p.status === status ? 'is-active' : ''}`}
                          onClick={async () => {
                            const atualizados = pedidosGerados.map((x) => (x.codigo === p.codigo ? { ...x, status } : x))
                            setPedidosGerados(atualizados)
                            if (saveData) await saveData(PEDIDOS_AVULSO_KEY, atualizados)
                            if (loadData && saveData) {
                              try {
                                const orcamentos: any[] = (await loadData(ORCAMENTOS_AVULSO_KEY)) || []
                                const lista = Array.isArray(orcamentos) ? orcamentos : []
                                const atualizadosOrc = lista.map((o: any) => (o.id === 'avulso-' + p.codigo ? { ...o, status } : o))
                                await saveData(ORCAMENTOS_AVULSO_KEY, atualizadosOrc)
                              } catch (_) {}
                            }
                          }}
                        >
                          {status === 'cancelado' ? (safeT?.pedidoCancelado || 'Pedido Cancelado') : status === 'concluido' ? (safeT?.concluido || 'Concluído') : status === 'aprovado' ? (safeT?.aprovado || 'Aprovado') : (safeT?.entregue || 'Entregue')}
                        </button>
                      ))}
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

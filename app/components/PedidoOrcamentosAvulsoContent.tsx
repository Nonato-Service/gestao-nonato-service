'use client'

import React, { useState, useMemo } from 'react'

export type ClientePedido = {
  id: string
  nomeEmpresa: string
  morada?: string
  localidade?: string
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

type Props = {
  clientes: ClientePedido[]
  pecasBiblioteca: Array<{ id: string; codigo: string; nome: string; imagem?: string }>
  safeT: Record<string, string | undefined>
  closeTab: (tabId: string) => void
  activeTabId: string
  voltarPaginaInicial: () => void
  LogoComponent: React.ComponentType<{ size?: 'small' | 'medium' | 'large' }>
}

export function PedidoOrcamentosAvulsoContent({
  clientes,
  pecasBiblioteca,
  safeT,
  closeTab,
  activeTabId,
  voltarPaginaInicial,
  LogoComponent
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

  const clientesFiltrados = useMemo(() => {
    if (!buscaCliente.trim()) return clientes
    const b = buscaCliente.toLowerCase()
    return clientes.filter(
      (c) =>
        c.nomeEmpresa?.toLowerCase().includes(b) ||
        c.email?.toLowerCase().includes(b) ||
        c.localidade?.toLowerCase().includes(b)
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
    const nome = (nomeManualPeca || '').trim() || codigo || 'Peça manual'
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

  const containerStyle = {
    padding: '30px',
    maxWidth: '1600px',
    margin: '0 auto' as const
  }
  const headerStyle = {
    marginBottom: '40px',
    padding: '30px',
    background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
    borderRadius: '12px',
    border: '1px solid rgba(0, 255, 0, 0.3)',
    boxShadow: '0 4px 20px rgba(0, 255, 0, 0.08)'
  }
  const blockStyle = {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#141414',
    borderRadius: '12px',
    border: '1px solid rgba(0, 255, 0, 0.2)'
  }
  const inputStyle = {
    width: '100%' as const,
    padding: '12px',
    marginBottom: '15px',
    backgroundColor: '#222222',
    border: '1px solid rgba(0, 255, 0, 0.3)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px'
  }
  const labelStyle = { color: '#66b3ff', marginBottom: '10px', fontSize: '16px', display: 'block' as const, textTransform: 'uppercase' as const }

  return (
    <div style={containerStyle}>
      {/* Cabeçalho */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <LogoComponent size="small" />
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#66b3ff', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase' }}>
              {safeT?.pedidoOrcamentosAvulsoTitle || 'PEDIDO DE ORÇAMENTOS AVULSO'}
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#ccc', opacity: 0.8, textTransform: 'uppercase' }}>
              {safeT?.pedidoOrcamentoAvulsoDesc || 'Cliente, equipamento e peças para orçamento'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              className="btn-primary"
              onClick={() => closeTab(activeTabId)}
              style={{ padding: '8px 12px', fontSize: '14px', minWidth: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={safeT?.voltar || 'Voltar'}
            >
              ↶
            </button>
            <button
              onClick={voltarPaginaInicial}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(0, 150, 255, 0.5)',
                borderRadius: '4px',
                color: '#66b3ff',
                cursor: 'pointer',
                minWidth: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={safeT?.voltarInicio || 'Voltar ao Início'}
            >
              🏠
            </button>
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div style={blockStyle}>
        <h3 style={labelStyle}>{safeT?.cliente || 'Cliente'}</h3>
        <p style={{ color: '#999', fontSize: '13px', marginBottom: '12px' }}>
          {safeT?.buscarClienteOuDigitar || 'Selecione um cliente cadastrado ou digite o nome manualmente.'}
        </p>
        <input
          type="text"
          placeholder={safeT?.buscarCliente || 'Buscar cliente por nome ou email...'}
          value={buscaCliente}
          onChange={(e) => setBuscaCliente(e.target.value)}
          style={inputStyle}
        />
        <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '15px' }}>
          {clientesFiltrados.length === 0 ? (
            <p style={{ color: '#ccc', textAlign: 'center', padding: '15px' }}>
              {safeT?.nenhumClienteEncontrado || 'Nenhum cliente encontrado'}
            </p>
          ) : (
            clientesFiltrados.map((cliente) => (
              <div
                key={cliente.id}
                onClick={() => {
                  setClienteSelecionado(cliente)
                  setClienteNomeManual('')
                  setEquipamentoSelecionado(null)
                }}
                style={{
                  padding: '12px 15px',
                  marginBottom: '8px',
                  backgroundColor: clienteSelecionado?.id === cliente.id ? 'rgba(0, 100, 255, 0.2)' : '#2a2a2a',
                  border: `1px solid ${clienteSelecionado?.id === cliente.id ? 'rgba(0, 100, 255, 0.5)' : 'rgba(0, 255, 0, 0.2)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#66b3ff' }}>{cliente.nomeEmpresa}</div>
                {(cliente.morada || cliente.localidade || cliente.email) && (
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    {[cliente.morada, cliente.localidade, cliente.email].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div style={{ marginTop: '10px' }}>
          <label style={{ color: '#999', fontSize: '13px', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
            {safeT?.ouNomeManualCliente || 'Ou nome do cliente (avulso)'}
          </label>
          <input
            type="text"
            placeholder={safeT?.nomeClienteManual || 'Digite o nome do cliente'}
            value={clienteNomeManual}
            onChange={(e) => {
              setClienteNomeManual(e.target.value)
              if (e.target.value) setClienteSelecionado(null)
            }}
            style={inputStyle}
          />
        </div>
        {(clienteSelecionado || clienteNomeManual) && (
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#222', borderRadius: '8px', border: '1px solid rgba(0, 255, 0, 0.2)' }}>
            <strong style={{ color: '#00ff00' }}>{safeT?.clienteSelecionado || 'Cliente'}:</strong> {nomeClienteExibido}
          </div>
        )}
      </div>

      {/* Equipamento */}
      <div style={blockStyle}>
        <h3 style={labelStyle}>{safeT?.equipamento || 'Equipamento'}</h3>
        <p style={{ color: '#999', fontSize: '13px', marginBottom: '12px', textTransform: 'uppercase' }}>
          {safeT?.equipamentoDescPedido || 'Se o cliente for cadastrado, escolha um equipamento ou descreva manualmente.'}
        </p>
        {equipamentosDoCliente.length > 0 && (
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
            {equipamentosDoCliente.map((eq, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setEquipamentoSelecionado(eq)
                  setEquipamentoManual('')
                }}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: equipamentoSelecionado === eq ? 'rgba(0, 255, 0, 0.15)' : '#2a2a2a',
                  border: `1px solid ${equipamentoSelecionado === eq ? 'rgba(0, 255, 0, 0.5)' : 'rgba(0, 255, 0, 0.2)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ color: '#00ff00', fontWeight: 'bold' }}>
                  {eq.tipoEquipamento} {eq.modelo && `- ${eq.modelo}`}
                </div>
                <div style={{ fontSize: '12px', color: '#ccc' }}>
                  {eq.marca} {eq.numeroSerie && `· Nº Série: ${eq.numeroSerie}`}
                </div>
              </div>
            ))}
          </div>
        )}
        <label style={{ color: '#999', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          {safeT?.descricaoManualEquipamento || 'Descrição manual do equipamento (opcional)'}
        </label>
        <input
          type="text"
          placeholder={safeT?.equipamentoManualPlaceholder || 'Ex: Seccionadora HPP 250'}
          value={equipamentoManual}
          onChange={(e) => {
            setEquipamentoManual(e.target.value)
            if (e.target.value) setEquipamentoSelecionado(null)
          }}
          style={inputStyle}
        />
        {(equipamentoSelecionado || equipamentoManual) && (
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#222', borderRadius: '8px', border: '1px solid rgba(0, 255, 0, 0.2)' }}>
            <strong style={{ color: '#00ff00' }}>{safeT?.equipamento || 'Equipamento'}:</strong>{' '}
            {equipamentoSelecionado
              ? `${equipamentoSelecionado.tipoEquipamento} ${equipamentoSelecionado.modelo || ''} - ${equipamentoSelecionado.marca}`
              : equipamentoManual}
          </div>
        )}
      </div>

      {/* Adicionar peças */}
      <div style={blockStyle}>
        <h3 style={labelStyle}>{safeT?.adicionarPecas || 'Adicionar peças'}</h3>
        <p style={{ color: '#999', fontSize: '13px', marginBottom: '12px', textTransform: 'uppercase' }}>
          {safeT?.adicionarPecasDesc || 'Busque na Biblioteca de Peças por código/nome ou digite o código manualmente.'}
        </p>
        {!mostrarFormPeca ? (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => { setMostrarFormPeca(true); setModoPeca('biblioteca'); setBuscaPeca(''); }}
              style={{
                padding: '10px 18px',
                backgroundColor: 'rgba(0, 255, 0, 0.15)',
                border: '1px solid rgba(0, 255, 0, 0.5)',
                borderRadius: '8px',
                color: '#00ff00',
                cursor: 'pointer',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}
            >
              📚 {safeT?.buscarBibliotecaPecas || 'Buscar na Biblioteca de Peças'}
            </button>
            <button
              type="button"
              onClick={() => { setMostrarFormPeca(true); setModoPeca('manual'); setCodigoManualPeca(''); setNomeManualPeca(''); setQuantidadeNovaPeca(1); }}
              style={{
                padding: '10px 18px',
                backgroundColor: 'rgba(0, 100, 255, 0.15)',
                border: '1px solid rgba(0, 100, 255, 0.5)',
                borderRadius: '8px',
                color: '#66b3ff',
                cursor: 'pointer',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}
            >
              ✏️ {safeT?.digitarCodigoManual || 'Digitar código / peça manual'}
            </button>
          </div>
        ) : (
          <div style={{ padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid rgba(0, 255, 0, 0.3)', marginBottom: '15px' }}>
            {modoPeca === 'biblioteca' && (
              <>
                <label style={{ color: '#ccc', display: 'block', marginBottom: '8px' }}>{safeT?.buscarPorCodigo || 'Buscar por código ou nome'}</label>
                <input
                  type="text"
                  value={buscaPeca}
                  onChange={(e) => setBuscaPeca(e.target.value)}
                  placeholder={safeT?.codigoPecaBiblioteca || 'Código'}
                  style={inputStyle}
                  autoFocus
                />
                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {pecasFiltradas.length === 0 ? (
                    <p style={{ color: '#888', padding: '10px', textTransform: 'uppercase' }}>{safeT?.nenhumaPecaEncontrada || 'Nenhuma peça encontrada'}</p>
                  ) : (
                    pecasFiltradas.map((peca) => (
                      <div
                        key={peca.id}
                        onClick={() => adicionarPecaDaBiblioteca(peca)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          borderBottom: '1px solid #333',
                          cursor: 'pointer'
                        }}
                      >
                        {peca.imagem ? (
                          <img src={peca.imagem} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                        ) : (
                          <div style={{ width: 48, height: 48, backgroundColor: '#333', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>—</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontWeight: 'bold' }}>{peca.nome}</div>
                          <div style={{ color: '#999', fontSize: '12px' }}>{peca.codigo}</div>
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
                  value={codigoManualPeca}
                  onChange={(e) => setCodigoManualPeca(e.target.value)}
                  placeholder={safeT?.codigoPecaBiblioteca || 'Código'}
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={nomeManualPeca}
                  onChange={(e) => setNomeManualPeca(e.target.value)}
                  placeholder={safeT?.nomePecaBiblioteca || 'Nome da peça'}
                  style={inputStyle}
                />
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: '#ccc', marginRight: '8px', textTransform: 'uppercase' }}>{safeT?.quantidade || 'Quantidade'}</label>
                  <input
                    type="number"
                    min={1}
                    value={quantidadeNovaPeca}
                    onChange={(e) => setQuantidadeNovaPeca(parseInt(e.target.value, 10) || 1)}
                    style={{ ...inputStyle, width: '80px', marginBottom: 0 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={adicionarPecaManual}
                  style={{ padding: '8px 16px', backgroundColor: 'rgba(0, 255, 0, 0.2)', border: '1px solid rgba(0, 255, 0, 0.5)', borderRadius: '6px', color: '#00ff00', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {safeT?.adicionar || 'Adicionar'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => { setMostrarFormPeca(false); setModoPeca(null); }}
              style={{ marginTop: '12px', padding: '8px 14px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid #555', borderRadius: '6px', color: '#ccc', cursor: 'pointer', textTransform: 'uppercase' }}
            >
              {safeT?.cancel || 'Cancelar'}
            </button>
          </div>
        )}

        {/* Lista de peças do pedido */}
        {pecasPedido.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ color: '#00ff00', marginBottom: '12px', fontSize: '15px', textTransform: 'uppercase' }}>{safeT?.pecasNoPedido || 'Peças no pedido'}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pecasPedido.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '12px 15px',
                    backgroundColor: '#222',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 255, 0, 0.2)'
                  }}
                >
                  {p.imagem ? (
                    <img src={p.imagem} alt={p.nome} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 56, height: 56, backgroundColor: '#333', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '11px' }}>—</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{p.nome}</div>
                    <div style={{ color: '#999', fontSize: '12px' }}>{p.codigo}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => alterarQuantidadePeca(p.id, -1)}
                      style={{ width: 28, height: 28, padding: 0, fontSize: '16px', backgroundColor: '#333', border: '1px solid #555', borderRadius: 4, color: '#fff', cursor: 'pointer' }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: 28, textAlign: 'center', color: '#00ff00', fontWeight: 'bold' }}>{p.quantidade}</span>
                    <button
                      type="button"
                      onClick={() => alterarQuantidadePeca(p.id, 1)}
                      style={{ width: 28, height: 28, padding: 0, fontSize: '16px', backgroundColor: '#333', border: '1px solid #555', borderRadius: 4, color: '#fff', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerPeca(p.id)}
                    style={{ padding: '6px 10px', backgroundColor: 'rgba(255,0,0,0.2)', border: '1px solid rgba(255,0,0,0.5)', borderRadius: 4, color: '#ff6666', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase' }}
                  >
                    {safeT?.delete || 'Remover'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

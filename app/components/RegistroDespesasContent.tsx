'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  parseTotalEurosFromReceiptText,
  parseDataReciboIso,
  extrairDescricaoRecibo
} from '../lib/reciboComprovanteParser'

type RegistroOcrModalState =
  | null
  | { step: 'ocr'; imagemBase64: string }
  | {
      step: 'preview'
      imagemBase64: string
      valor: number
      data: string
      descricao: string
      ocrSnippet: string
      tipoId: string
      tipoNome: string
    }

export type DespesaRegistro = {
  id: string
  tipoId: string
  tipoNome: string
  valor: number
  descricao: string
  codigoBarras?: string
  fotos: string[]
  data: string
}

export type DespesaDocumento = {
  id: string
  clienteId: string
  clienteNome: string
  relatorioId?: string
  relatorioNumero?: string
  data: string
  despesas: DespesaRegistro[]
  dataCriacao: string
}

type Cliente = { id: string; nomeEmpresa: string }
type RelatorioServico = { id: string; numero: string; cliente: string; clienteId?: string; data: string }
type Servico = { id: string; nome: string; categoria: string }

type Props = {
  clientes: Cliente[]
  relatoriosServico: RelatorioServico[]
  servicos: Servico[]
  saveData: (key: string, data: any) => Promise<void>
  loadData: (key: string) => Promise<any>
  safeT: any
  openTab: (tab: string, title: string) => void
  closeTab: (tab: string) => void
  activeTabId?: string
}

export function RegistroDespesasContent({
  clientes,
  relatoriosServico,
  servicos,
  saveData,
  loadData,
  safeT,
  openTab,
  closeTab,
  activeTabId
}: Props) {
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<RelatorioServico | null>(null)
  const [documentos, setDocumentos] = useState<DespesaDocumento[]>([])
  const [docAtual, setDocAtual] = useState<DespesaDocumento | null>(null)
  const [showDespesaForm, setShowDespesaForm] = useState(false)
  const [despesaForm, setDespesaForm] = useState<Partial<DespesaRegistro>>({
    tipoId: '',
    tipoNome: '',
    valor: 0,
    descricao: '',
    codigoBarras: '',
    fotos: [],
    data: new Date().toISOString().split('T')[0]
  })
  const [buscaCliente, setBuscaCliente] = useState('')
  const [buscaRelatorio, setBuscaRelatorio] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ocrReciboFileRef = useRef<HTMLInputElement>(null)
  const [registroOcrModal, setRegistroOcrModal] = useState<RegistroOcrModalState>(null)

  const despesasCadastradas = servicos.filter(s => s.categoria === 'despesa')
  const clientesFiltrados = clientes.filter(c =>
    c.nomeEmpresa?.toLowerCase().includes(buscaCliente?.toLowerCase())
  )
  const relatoriosFiltrados = relatoriosServico.filter(r =>
    (r.numero?.toLowerCase().includes(buscaRelatorio?.toLowerCase()) ||
     r.cliente?.toLowerCase().includes(buscaRelatorio?.toLowerCase()))
  )

  const loadDocumentos = async () => {
    try {
      const data = await loadData('nonato-despesas-documentos')
      setDocumentos(Array.isArray(data) ? data : [])
    } catch {
      setDocumentos([])
    }
  }

  useEffect(() => {
    loadDocumentos()
  }, [activeTabId])

  const iniciarNovoDocumento = () => {
    if (!clienteSelecionado) {
      alert(safeT?.selecioneClientePrimeiro || safeT?.selecioneCliente || 'Selecione um cliente primeiro.')
      return
    }
    const doc: DespesaDocumento = {
      id: 'doc-' + Date.now(),
      clienteId: clienteSelecionado.id,
      clienteNome: clienteSelecionado.nomeEmpresa,
      relatorioId: relatorioSelecionado?.id,
      relatorioNumero: relatorioSelecionado?.numero,
      data: new Date().toISOString().split('T')[0],
      despesas: [],
      dataCriacao: new Date().toISOString()
    }
    setDocAtual(doc)
  }

  const adicionarDespesa = () => {
    if (!docAtual) return
    const tipo = despesasCadastradas.find(s => s.id === despesaForm.tipoId)
    if (!tipo && despesasCadastradas.length > 0) {
      alert(safeT?.selecioneTipoDespesa || 'Selecione o tipo de despesa.')
      return
    }
    const nova: DespesaRegistro = {
      id: 'd-' + Date.now(),
      tipoId: despesaForm.tipoId || '',
      tipoNome: despesaForm.tipoNome || tipo?.nome || 'Outros',
      valor: despesaForm.valor ?? 0,
      descricao: despesaForm.descricao || '',
      codigoBarras: despesaForm.codigoBarras,
      fotos: despesaForm.fotos || [],
      data: despesaForm.data || new Date().toISOString().split('T')[0]
    }
    setDocAtual({
      ...docAtual,
      despesas: [...docAtual.despesas, nova]
    })
    setDespesaForm({
      tipoId: '',
      tipoNome: '',
      valor: 0,
      descricao: '',
      codigoBarras: '',
      fotos: [],
      data: new Date().toISOString().split('T')[0]
    })
    setShowDespesaForm(false)
  }

  const removerDespesa = (id: string) => {
    if (!docAtual) return
    setDocAtual({
      ...docAtual,
      despesas: docAtual.despesas.filter(d => d.id !== id)
    })
  }

  const salvarDocumento = async (eGerarPDF?: boolean) => {
    if (!docAtual || docAtual.despesas.length === 0) {
      alert(safeT?.adicionePeloMenosUmaDespesa || 'Adicione pelo menos uma despesa.')
      return
    }
    const atualizados = documentos.filter(d => d.id !== docAtual.id)
    atualizados.push(docAtual)
    await saveData('nonato-despesas-documentos', atualizados)
    setDocumentos(atualizados)
    if (eGerarPDF) {
      gerarPDF(docAtual.id)
    }
    setDocAtual(null)
    alert(safeT?.documentoSalvo || 'Documento salvo com sucesso!')
  }

  const capturarFoto = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setDespesaForm(prev => ({
        ...prev,
        fotos: [...(prev.fotos || []), base64]
      }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removerFoto = (index: number) => {
    setDespesaForm(prev => ({
      ...prev,
      fotos: (prev.fotos || []).filter((_, i) => i !== index)
    }))
  }

  const gerarPDF = (docId: string) => {
    window.open(`/api/pdf/despesas-documento/${docId}?lang=pt-BR`, '_blank')
  }

  const defaultTipoOcr = (): { tipoId: string; tipoNome: string } => {
    const first = despesasCadastradas[0]
    if (first) return { tipoId: first.id, tipoNome: first.nome }
    return { tipoId: 'outros', tipoNome: 'Outros' }
  }

  const confirmarOcrRegistro = () => {
    if (!docAtual || !registroOcrModal || registroOcrModal.step !== 'preview') return
    const p = registroOcrModal
    const nova: DespesaRegistro = {
      id: 'd-' + Date.now(),
      tipoId: p.tipoId,
      tipoNome: p.tipoNome,
      valor: p.valor,
      descricao: p.descricao,
      fotos: [p.imagemBase64],
      data: p.data
    }
    setDocAtual({
      ...docAtual,
      despesas: [...docAtual.despesas, nova]
    })
    setRegistroOcrModal(null)
    alert(safeT?.registroDespesasOcrOk || 'Linha de despesa adicionada. Confira o valor.')
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        marginBottom: '24px',
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.06) 0%, rgba(0, 0, 0, 0.9) 100%)',
        borderRadius: '12px',
        border: '2px solid rgba(0, 255, 0, 0.3)'
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#00ff00', letterSpacing: '2px' }}>
          {safeT?.registroDespesasTitle || 'REGISTRO DE DESPESAS'}
        </h1>
        <p style={{ margin: 0, opacity: 0.9, color: '#ccc' }}>
          {safeT?.registroDespesasDesc || 'Escaneie códigos de barras, tire fotos e vincule despesas a relatórios de serviço e clientes.'}
        </p>
      </div>

      {!docAtual ? (
        <div style={{ backgroundColor: '#2a2a2a', borderRadius: '8px', padding: '24px', border: '1px solid rgba(0, 255, 0, 0.2)' }}>
          <h3 style={{ marginTop: 0, color: '#00ff00' }}>{safeT?.cliente || 'Cliente'} *</h3>
          <input
            type="text"
            placeholder={safeT?.buscarCliente || 'Buscar cliente...'}
            value={buscaCliente}
            onChange={(e) => setBuscaCliente(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '12px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '4px' }}
          />
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
            {clientesFiltrados.map(c => (
              <div
                key={c.id}
                onClick={() => setClienteSelecionado(c)}
                style={{
                  padding: '10px 12px',
                  marginBottom: '4px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: clienteSelecionado?.id === c.id ? 'rgba(0, 255, 0, 0.2)' : '#1a1a1a',
                  border: clienteSelecionado?.id === c.id ? '2px solid #00ff00' : '1px solid #444'
                }}
              >
                {c.nomeEmpresa}
              </div>
            ))}
          </div>

          <h3 style={{ color: '#00ff00' }}>{safeT?.relatorioServico || 'Relatório de Serviço'} ({safeT?.opcional || 'opcional'})</h3>
          <input
            type="text"
            placeholder={safeT?.buscarRelatorio || 'Buscar relatório...'}
            value={buscaRelatorio}
            onChange={(e) => setBuscaRelatorio(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '12px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '4px' }}
          />
          <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '20px' }}>
            <div
              onClick={() => setRelatorioSelecionado(null)}
              style={{
                padding: '10px 12px',
                marginBottom: '4px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: !relatorioSelecionado ? 'rgba(0, 255, 0, 0.2)' : '#1a1a1a',
                border: !relatorioSelecionado ? '2px solid #00ff00' : '1px solid #444'
              }}
            >
              {safeT?.nenhumRelatorio || 'Nenhum relatório'}
            </div>
            {relatoriosFiltrados.filter(r => !clienteSelecionado || r.clienteId === clienteSelecionado.id).map(r => (
              <div
                key={r.id}
                onClick={() => setRelatorioSelecionado(r)}
                style={{
                  padding: '10px 12px',
                  marginBottom: '4px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: relatorioSelecionado?.id === r.id ? 'rgba(0, 255, 0, 0.2)' : '#1a1a1a',
                  border: relatorioSelecionado?.id === r.id ? '2px solid #00ff00' : '1px solid #444'
                }}
              >
                {r.numero} - {r.cliente} ({new Date(r.data).toLocaleDateString('pt-BR')})
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            onClick={iniciarNovoDocumento}
            style={{ padding: '12px 24px', fontSize: '16px' }}
          >
            {safeT?.iniciarRegistroDespesas || 'Iniciar registo de despesas'}
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: '#2a2a2a', borderRadius: '8px', padding: '24px', border: '1px solid rgba(0, 255, 0, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <strong style={{ color: '#00ff00' }}>{docAtual.clienteNome}</strong>
              {docAtual.relatorioNumero && <span style={{ marginLeft: '12px', color: '#aaa' }}>| Relatório: {docAtual.relatorioNumero}</span>}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={() => setDocAtual(null)}>{safeT?.cancelar || 'Cancelar'}</button>
              <button className="btn-primary" onClick={() => salvarDocumento(false)}>{safeT?.salvar || 'Salvar'}</button>
              <button className="btn-primary" onClick={() => salvarDocumento(true)}>
                {safeT?.salvarEGerarPDF || 'Salvar e Gerar PDF'}
              </button>
            </div>
          </div>

          {!showDespesaForm ? (
            <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <input
                ref={ocrReciboFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                aria-hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file || !file.type.startsWith('image/') || !docAtual) return
                  const reader = new FileReader()
                  const imagemBase64 = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(String(reader.result || ''))
                    reader.onerror = () => reject(new Error('read'))
                    reader.readAsDataURL(file)
                  })
                  setRegistroOcrModal({ step: 'ocr', imagemBase64 })
                  try {
                    const { createWorker } = await import('tesseract.js')
                    const worker = await createWorker('por+eng')
                    const r = await worker.recognize(file)
                    await worker.terminate()
                    const text = r.data.text || ''
                    const valorParsed = parseTotalEurosFromReceiptText(text)
                    const dataParsed = parseDataReciboIso(text)
                    const data = dataParsed || new Date().toISOString().slice(0, 10)
                    const descricao = extrairDescricaoRecibo(text)
                    const def = defaultTipoOcr()
                    setRegistroOcrModal({
                      step: 'preview',
                      imagemBase64,
                      valor: valorParsed,
                      data,
                      descricao,
                      ocrSnippet: text.slice(0, 500),
                      tipoId: def.tipoId,
                      tipoNome: def.tipoNome
                    })
                  } catch (err) {
                    console.error(err)
                    alert(safeT?.registroDespesasOcrErro || 'Não foi possível ler a imagem.')
                    setRegistroOcrModal(null)
                  }
                }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowDespesaForm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>+</span> {safeT?.adicionarDespesa || 'Adicionar Despesa'}
              </button>
              <button
                type="button"
                onClick={() => ocrReciboFileRef.current?.click()}
                title={safeT?.registroDespesasFotoOcrHint || ''}
                style={{
                  padding: '10px 18px',
                  background: 'rgba(147, 197, 253, 0.15)',
                  border: '1px solid rgba(147, 197, 253, 0.55)',
                  borderRadius: '8px',
                  color: '#bfdbfe',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {safeT?.registroDespesasFotoOcrBtn || '📷 Foto do recibo (OCR)'}
              </button>
            </div>
          ) : (
            <div style={{
              padding: '20px',
              marginBottom: '20px',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              border: '1px solid rgba(0, 255, 0, 0.3)'
            }}>
              <h4 style={{ marginTop: 0, color: '#00ff00' }}>{safeT?.novaDespesa || 'Nova Despesa'}</h4>

              <div style={{ marginBottom: '12px' }}>
                <label>{safeT?.tipoDespesa || 'Tipo'}</label>
                <select
                  value={despesaForm.tipoId}
                  onChange={(e) => {
                    const s = despesasCadastradas.find(x => x.id === e.target.value)
                    setDespesaForm(prev => ({ ...prev, tipoId: e.target.value, tipoNome: s?.nome || '' }))
                  }}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '4px' }}
                >
                  <option value="">{safeT?.selecione || 'Selecione...'}</option>
                  {despesasCadastradas.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                  {despesasCadastradas.length === 0 && <option value="outros">Outros</option>}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label>{safeT?.valor || 'Valor (€)'}</label>
                <input
                  type="number"
                  step="0.01"
                  value={despesaForm.valor || ''}
                  onChange={(e) => setDespesaForm(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label>{safeT?.descricao || 'Descrição'}</label>
                <input
                  type="text"
                  value={despesaForm.descricao || ''}
                  onChange={(e) => setDespesaForm(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder={safeT?.descricaoPlaceholder || 'Ex: Combustível, refeição, peças...'}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label>{safeT?.codigoBarras || 'Código de Barras'}</label>
                <input
                  type="text"
                  value={despesaForm.codigoBarras || ''}
                  onChange={(e) => setDespesaForm(prev => ({ ...prev, codigoBarras: e.target.value }))}
                  placeholder={safeT?.escanearOuDigitar || 'Digite o código...'}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid rgba(0, 255, 0, 0.3)', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label>{safeT?.fotosComprovante || 'Fotos do Comprovante'}</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={capturarFoto}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'rgba(0, 150, 255, 0.3)',
                    border: '1px solid #0096ff',
                    color: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                >
                  📷 {safeT?.tirarFoto || 'Tirar Foto / Anexar'}
                </button>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {(despesaForm.fotos || []).map((foto, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={foto} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #444' }} />
                      <button
                        type="button"
                        onClick={() => removerFoto(i)}
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#c00',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '14px',
                          lineHeight: 1
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button className="btn-primary" onClick={adicionarDespesa}>{safeT?.adicionar || 'Adicionar'}</button>
                <button className="btn-secondary" onClick={() => setShowDespesaForm(false)}>{safeT?.cancelar || 'Cancelar'}</button>
              </div>
            </div>
          )}

          <h4 style={{ color: '#00ff00', marginBottom: '12px' }}>{safeT?.despesasAdicionadas || 'Despesas adicionadas'}</h4>
          {docAtual.despesas.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>{safeT?.nenhumaDespesaAinda || 'Nenhuma despesa ainda.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {docAtual.despesas.map(d => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '6px',
                    border: '1px solid #444'
                  }}
                >
                  <div>
                    <strong>{d.tipoNome}</strong> — € {d.valor.toFixed(2)} — {d.descricao}
                    {d.codigoBarras && <span style={{ marginLeft: '8px', color: '#888', fontSize: '12px' }}>| {d.codigoBarras}</span>}
                    {d.fotos.length > 0 && <span style={{ marginLeft: '8px', color: '#00ff00' }}>📷 {d.fotos.length}</span>}
                  </div>
                  <button className="btn-danger" onClick={() => removerDespesa(d.id)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                    {safeT?.delete || 'Excluir'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {registroOcrModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10002
          }}
          onClick={() => {
            if (registroOcrModal.step === 'preview') setRegistroOcrModal(null)
          }}
        >
          <div
            style={{
              background: '#1e1e1e',
              padding: '24px',
              borderRadius: '14px',
              border: '2px solid rgba(147,197,253,0.45)',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
            onClick={ev => ev.stopPropagation()}
          >
            {registroOcrModal.step === 'ocr' ? (
              <>
                <h3 style={{ margin: '0 0 12px', color: '#93c5fd' }}>
                  {safeT?.registroDespesasOcrTitulo || 'Recibo — leitura automática'}
                </h3>
                <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px', lineHeight: 1.45 }}>
                  {safeT?.registroDespesasOcrProcessando || 'A ler o recibo…'}
                </p>
                {registroOcrModal.imagemBase64 ? (
                  <img
                    src={registroOcrModal.imagemBase64}
                    alt=""
                    style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: '8px', marginBottom: '12px' }}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => setRegistroOcrModal(null)}
                  style={{
                    marginTop: '8px',
                    padding: '8px 14px',
                    background: 'transparent',
                    border: '1px solid #666',
                    borderRadius: '8px',
                    color: '#ccc',
                    cursor: 'pointer'
                  }}
                >
                  {safeT?.registroDespesasOcrCancelar || 'Cancelar'}
                </button>
              </>
            ) : (
              <>
                <h3 style={{ margin: '0 0 12px', color: '#93c5fd' }}>
                  {safeT?.registroDespesasOcrTitulo || 'Recibo — leitura automática'}
                </h3>
                <img
                  src={registroOcrModal.imagemBase64}
                  alt=""
                  style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: '8px', marginBottom: '14px' }}
                />
                {registroOcrModal.valor <= 0 ? (
                  <p style={{ color: '#fb923c', fontSize: '13px', marginBottom: '12px' }}>
                    {safeT?.registroDespesasOcrSemValor || 'Valor em € não detetado com confiança.'}
                  </p>
                ) : null}
                <div style={{ fontSize: '13px', color: '#e5e5e5', marginBottom: '10px' }}>
                  <strong style={{ color: '#93c5fd' }}>{safeT?.valor || 'Valor (€)'}:</strong>{' '}
                  <input
                    type="number"
                    step={0.01}
                    value={registroOcrModal.valor === 0 ? '' : registroOcrModal.valor}
                    onChange={ev =>
                      setRegistroOcrModal(prev =>
                        prev && prev.step === 'preview'
                          ? { ...prev, valor: parseFloat(ev.target.value) || 0 }
                          : prev
                      )
                    }
                    style={{
                      width: '120px',
                      padding: '6px 8px',
                      marginLeft: '6px',
                      background: '#111',
                      border: '1px solid rgba(147,197,253,0.35)',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  />
                </div>
                <div style={{ fontSize: '13px', color: '#e5e5e5', marginBottom: '10px' }}>
                  <strong style={{ color: '#93c5fd' }}>{safeT?.data || 'Data'}:</strong>{' '}
                  <input
                    type="date"
                    value={registroOcrModal.data}
                    onChange={ev =>
                      setRegistroOcrModal(prev =>
                        prev && prev.step === 'preview' ? { ...prev, data: ev.target.value } : prev
                      )
                    }
                    style={{
                      padding: '6px 8px',
                      marginLeft: '6px',
                      background: '#111',
                      border: '1px solid rgba(147,197,253,0.35)',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  />
                </div>
                <div style={{ fontSize: '13px', color: '#e5e5e5', marginBottom: '12px' }}>
                  <strong style={{ color: '#93c5fd' }}>{safeT?.descricao || 'Descrição'}:</strong>
                  <input
                    type="text"
                    value={registroOcrModal.descricao}
                    onChange={ev =>
                      setRegistroOcrModal(prev =>
                        prev && prev.step === 'preview' ? { ...prev, descricao: ev.target.value } : prev
                      )
                    }
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      padding: '8px',
                      background: '#111',
                      border: '1px solid rgba(147,197,253,0.35)',
                      borderRadius: '6px',
                      color: '#fff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', color: '#93c5fd', fontSize: '12px', marginBottom: '6px' }}>
                    {safeT?.registroDespesasOcrTipoLinha || 'Tipo de despesa (esta linha)'}
                  </label>
                  <select
                    value={registroOcrModal.tipoId}
                    onChange={ev => {
                      const id = ev.target.value
                      const s = despesasCadastradas.find(x => x.id === id)
                      setRegistroOcrModal(prev =>
                        prev && prev.step === 'preview'
                          ? { ...prev, tipoId: id, tipoNome: s?.nome || (id === 'outros' ? 'Outros' : prev.tipoNome) }
                          : prev
                      )
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#111',
                      border: '1px solid rgba(147,197,253,0.35)',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  >
                    {despesasCadastradas.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                    {despesasCadastradas.length === 0 && <option value="outros">Outros</option>}
                  </select>
                </div>
                {safeT?.registroDespesasOcrNotaCliente ? (
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '12px', lineHeight: 1.45 }}>
                    {safeT.registroDespesasOcrNotaCliente}
                  </p>
                ) : null}
                <details style={{ marginBottom: '16px', fontSize: '11px', color: '#888' }}>
                  <summary style={{ cursor: 'pointer', color: '#aaa' }}>
                    {safeT?.registroDespesasOcrSnippet || 'Texto lido (OCR)'}
                  </summary>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      marginTop: '8px',
                      padding: '8px',
                      background: '#111',
                      borderRadius: '6px',
                      maxHeight: 120,
                      overflow: 'auto'
                    }}
                  >
                    {registroOcrModal.ocrSnippet}
                  </pre>
                </details>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setRegistroOcrModal(null)}
                    style={{
                      padding: '10px 16px',
                      background: 'transparent',
                      border: '1px solid #666',
                      borderRadius: '8px',
                      color: '#ccc',
                      cursor: 'pointer'
                    }}
                  >
                    {safeT?.registroDespesasOcrCancelar || 'Cancelar'}
                  </button>
                  <button
                    type="button"
                    onClick={confirmarOcrRegistro}
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(34,197,94,0.25)',
                      border: '1px solid #22c55e',
                      borderRadius: '8px',
                      color: '#86efac',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {safeT?.registroDespesasOcrConfirmar || 'Adicionar ao documento'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {documentos.length > 0 && (
        <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px', border: '1px solid rgba(0, 255, 0, 0.2)' }}>
          <h3 style={{ marginTop: 0, color: '#00ff00' }}>{safeT?.documentosSalvos || 'Documentos salvos'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {documentos.map(doc => (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '6px',
                  border: '1px solid #444'
                }}
              >
                <div>
                  <strong>{doc.clienteNome}</strong> {doc.relatorioNumero && `| Relatório ${doc.relatorioNumero}`} — {doc.despesas.length} despesa(s) — € {doc.despesas.reduce((s, x) => s + x.valor, 0).toFixed(2)}
                </div>
                <button className="btn-primary" onClick={() => gerarPDF(doc.id)} style={{ padding: '6px 12px', fontSize: '13px' }}>
                  {safeT?.gerarPDF || 'Gerar PDF'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

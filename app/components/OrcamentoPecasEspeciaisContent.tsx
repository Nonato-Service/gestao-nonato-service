'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  formatarPrecoOrcamentoEur,
  gerarNumeroOfertaPecasEspeciais,
  openOrcamentoPecasEspeciaisPdf,
  type OrcamentoPecasEspeciaisLinhaPdf,
} from '../lib/orcamentoPecasEspeciaisPdf'
import { codigoClienteExibicao } from '../lib/clienteCodigoUtils'

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

export type LinhaOrcamentoPecasEsp = {
  rowId: string
  numeroArtigo: string
  quantidade: string
  precoUnitario: string
  titulo: string
  descricao: string
  infoExtra: string
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
  dataCriacao: string
}

const STORAGE_KEY = 'nonato-orcamentos-pecas-especiais'

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
    infoExtra: '',
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

type Props = {
  clientes: ClienteOrcamentoPecasEsp[]
  safeT: Record<string, string | undefined>
  closeTab: (tabId: string) => void
  activeTabId: string
  voltarPaginaInicial: () => void
  LogoComponent: React.ComponentType<{ size?: 'small' | 'medium' | 'large' }>
  saveData?: (key: string, data: unknown) => Promise<void>
  loadData?: (key: string) => Promise<unknown>
  logoHtml?: string
}

export function OrcamentoPecasEspeciaisContent({
  clientes,
  safeT,
  closeTab,
  activeTabId,
  voltarPaginaInicial,
  LogoComponent,
  saveData,
  loadData,
  logoHtml = '',
}: Props) {
  const t = safeT
  const hoje = new Date().toISOString().slice(0, 10)

  const [salvos, setSalvos] = useState<OrcamentoPecasEspeciaisSalvo[]>([])
  const [clienteId, setClienteId] = useState('')
  const [dataIso, setDataIso] = useState(hoje)
  const [numeroOferta, setNumeroOferta] = useState('')
  const [numeroManual, setNumeroManual] = useState(false)
  const [contactoNome, setContactoNome] = useState('')
  const [contactoTelefone, setContactoTelefone] = useState('')
  const [contactoEmail, setContactoEmail] = useState('')
  const [linhas, setLinhas] = useState<LinhaOrcamentoPecasEsp[]>([novaLinhaVazia()])
  const [linhaEmbalagemTitulo, setLinhaEmbalagemTitulo] = useState(
    () => t.orcamentoPecasEspEmbalagemTituloPadrao || 'Embalagem e envio'
  )
  const [linhaEmbalagemDescricao, setLinhaEmbalagemDescricao] = useState('')
  const [condicoesPagamento, setCondicoesPagamento] = useState(
    () =>
      t.orcamentoPecasEspCondicoesPagamentoPadrao ||
      'Pagamento antecipado, sem desconto.\nPreços em Euros, sem IVA.'
  )
  const [notasRodape, setNotasRodape] = useState(
    () =>
      t.orcamentoPecasEspNotasRodapePadrao ||
      'Aplicam-se os nossos Termos e Condições Gerais e a Política de Privacidade.'
  )
  const [buscaCliente, setBuscaCliente] = useState('')

  useEffect(() => {
    if (!loadData) return
    loadData(STORAGE_KEY)
      .then((data) => {
        if (Array.isArray(data)) setSalvos(data as OrcamentoPecasEspeciaisSalvo[])
      })
      .catch(() => {})
  }, [loadData])

  useEffect(() => {
    if (numeroManual) return
    setNumeroOferta(gerarNumeroOfertaPecasEspeciais(salvos, dataIso))
  }, [dataIso, salvos, numeroManual])

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

  const totalLiquidoFmt = useMemo(() => formatarPrecoOrcamentoEur(totalLiquidoNum), [totalLiquidoNum])

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
          infoExtra: l.infoExtra.trim(),
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
      condicoesPagamentoLabel: t.orcamentoPecasEspCondicoesPagamento || 'Condições de pagamento',
      embalagemTitulo: t.orcamentoPecasEspEmbalagem || 'Embalagem e envio',
      imprimir: t.imprimirGuardarPdf || t.gerarPDF || 'Imprimir / Guardar PDF',
      fechar: t.fechar || 'Fechar',
      previewBanner: t.orcamentoPecasEspPreviewBanner || 'Pré-visualização',
    }),
    [t]
  )

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
    openOrcamentoPecasEspeciaisPdf({
      numeroOferta: numeroOferta.trim() || gerarNumeroOfertaPecasEspeciais(salvos, dataIso),
      dataIso,
      clienteNome: clienteSel.nomeEmpresa,
      clienteMorada: enderecoCliente(clienteSel),
      clienteCodigo: codigoClienteExibicao(clienteSel),
      contactoNome: contactoNome.trim() || clienteSel.contato || '',
      contactoTelefone: contactoTelefone.trim() || clienteSel.telefones || '',
      contactoEmail: contactoEmail.trim() || clienteSel.email || '',
      linhas: linhasPdf,
      linhaEmbalagemTitulo: linhaEmbalagemTitulo.trim(),
      linhaEmbalagemDescricao: linhaEmbalagemDescricao.trim(),
      totalLiquido: totalLiquidoFmt,
      condicoesPagamento: condicoesPagamento.trim(),
      notasRodape: notasRodape.trim(),
      logoHtml,
      labels: labelsPdf,
      preview,
    })
  }

  const gravarOrcamento = async () => {
    if (!clienteSel) {
      alert(t.orcamentoPecasEspSelecioneCliente || 'Selecione um cliente.')
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
      dataCriacao: new Date().toISOString(),
    }
    const next = [reg, ...salvos]
    setSalvos(next)
    if (saveData) await saveData(STORAGE_KEY, next).catch(() => {})
    alert(t.orcamentoPecasEspGravado || 'Orçamento gravado.')
  }

  const carregarSalvo = (o: OrcamentoPecasEspeciaisSalvo) => {
    setClienteId(o.clienteId)
    setDataIso(o.dataIso)
    setNumeroOferta(o.numeroOferta)
    setNumeroManual(true)
    setContactoNome(o.contactoNome)
    setContactoTelefone(o.contactoTelefone)
    setContactoEmail(o.contactoEmail)
    setLinhas(o.linhas.length ? o.linhas : [novaLinhaVazia()])
    setLinhaEmbalagemTitulo(o.linhaEmbalagemTitulo)
    setLinhaEmbalagemDescricao(o.linhaEmbalagemDescricao)
    setCondicoesPagamento(o.condicoesPagamento)
    setNotasRodape(o.notasRodape)
  }

  return (
    <div className="orc-pro orcamentos-avulso-page orcamento-pecas-especiais-page">
      <div className="orcamentos-avulso-header-card">
        <div className="orcamentos-avulso-header-inner">
          <div className="orcamentos-avulso-header-logo">
            <LogoComponent size="small" />
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
        <div className="orcamento-pecas-especiais-grid-head">
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
          <div>
            <label className="orcamento-pecas-especiais-label">{t.total || 'Total líquido'}</label>
            <input type="text" readOnly value={totalLiquidoFmt} className="orcamento-pecas-especiais-input" />
          </div>
        </div>

        <div className="orcamento-pecas-especiais-section">
          <h3>{t.cliente || 'Cliente'}</h3>
          <input
            type="search"
            placeholder={t.buscarCliente || 'Buscar cliente…'}
            value={buscaCliente}
            onChange={(e) => setBuscaCliente(e.target.value)}
            className="orcamento-pecas-especiais-input"
          />
          <select
            value={clienteId}
            onChange={(e) => {
              const id = e.target.value
              setClienteId(id)
              const c = clientes.find((x) => x.id === id)
              if (c) {
                if (!contactoTelefone.trim()) setContactoTelefone(c.telefones || '')
                if (!contactoEmail.trim()) setContactoEmail(c.email || '')
                if (!contactoNome.trim()) setContactoNome(c.contato || '')
              }
            }}
            className="orcamento-pecas-especiais-input"
          >
            <option value="">{t.selecioneCliente || '— Selecionar cliente —'}</option>
            {clientesFiltrados.map((c) => (
              <option key={c.id} value={c.id}>
                {codigoClienteExibicao(c)} — {c.nomeEmpresa}
              </option>
            ))}
          </select>
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
          {linhas.map((l, idx) => (
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
                  placeholder={t.orcamentoPecasEspColUnit || 'Preço unit. (ex.: 1.700,-)'}
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
              <textarea
                placeholder={t.orcamentoPecasEspDescricaoLinha || 'Descrição técnica'}
                value={l.descricao}
                onChange={(e) =>
                  setLinhas((p) => p.map((x) => (x.rowId === l.rowId ? { ...x, descricao: e.target.value } : x)))
                }
                className="orcamento-pecas-especiais-textarea"
                rows={3}
              />
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
          ))}
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
            onChange={(e) => setCondicoesPagamento(e.target.value)}
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

        <div className="orcamento-pecas-especiais-actions">
          <button type="button" className="btn-primary" onClick={() => abrirPdf(true)}>
            👁️ {t.visualizar || 'Pré-visualizar PDF'}
          </button>
          <button type="button" className="btn-primary" onClick={() => abrirPdf(false)}>
            📄 {t.gerarPDF || 'Gerar PDF'}
          </button>
          <button type="button" className="btn-primary" onClick={() => void gravarOrcamento()}>
            💾 {t.save || 'Gravar'}
          </button>
        </div>

        {salvos.length > 0 ? (
          <div className="orcamento-pecas-especiais-section">
            <h3>{t.orcamentoPecasEspGravadosTitulo || 'Orçamentos gravados'}</h3>
            <ul className="orcamento-pecas-especiais-salvos">
              {salvos.slice(0, 20).map((o) => (
                <li key={o.id}>
                  <button type="button" className="orcamento-pecas-especiais-salvo-btn" onClick={() => carregarSalvo(o)}>
                    <strong>{o.numeroOferta}</strong> — {o.clienteNome} ({o.totalLiquido}) · {o.dataIso}
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

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AnexoPagamento,
  AnexoPagamentoPapel,
  EmpresaRecebedora,
  PagamentoMetodo,
  PagamentoSaida,
} from '../modules/pagamentos'
import {
  emptyEmpresaRecebedoraForm,
  empresaRecebedoraToForm,
  isEmpresaRecebedoraFormValid,
  isEmpresaRecebedoraOficial,
  isPagamentoSaidaFormValid,
  agruparPagamentosPorMes,
  mesesDisponiveisPagamentos,
  normalizePagamentoSaida,
  PAGAMENTOS_EMPRESAS_OFICIAIS,
  PAGAMENTOS_MES_SEM_DATA,
  pagamentosDoMes,
  somarValorPagamentos,
  PAGAMENTOS_EMPRESAS_STORAGE_KEY,
  PAGAMENTOS_REGISTOS_STORAGE_KEY,
  pagamentoSaidaToForm,
} from '../modules/pagamentos'
import {
  createAnexoPagamentoFromForm,
  createEmpresaRecebedoraFromForm,
  createPagamentoSaidaFromForm,
  emptyPagamentoSaidaForm,
  ensureEmpresasOficiaisPagamentos,
  marcarPagamentoSaidaComoPago,
  updateEmpresaRecebedoraFromForm,
  updatePagamentoSaidaFromForm,
} from '../lib/pagamentosFromForm'

const MAX_ANEXO_BYTES = 8 * 1024 * 1024

type Props = {
  saveData: (key: string, data: unknown) => Promise<unknown>
  loadData: (key: string) => Promise<unknown>
  safeT: Record<string, string | undefined>
  localeLang?: string
}

type VistaPagamentos = 'instituicoes' | 'ficha'
type AbaFicha = 'a-pagar' | 'pagos'

function tr(safeT: Props['safeT'], key: string, fallback: string): string {
  const v = safeT[key]
  return typeof v === 'string' && v.trim() ? v : fallback
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function metodoLabel(safeT: Props['safeT'], metodo: PagamentoMetodo): string {
  if (metodo === 'transferencia') return tr(safeT, 'pagamentosMetodoTransferencia', 'Transferência de pagamento')
  if (metodo === 'entidade-referencia') return tr(safeT, 'pagamentosMetodoEntidade', 'Entidade e referência')
  return tr(safeT, 'pagamentosMetodoReferencia', 'Referência de pagamento')
}

function fmtValor(n: number): string {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function localePagamentos(lang?: string): string {
  const k = String(lang || 'pt-BR')
  if (k === 'pt-BR') return 'pt-PT'
  if (k === 'es' || k === 'fr' || k === 'it' || k === 'de' || k === 'en') return k
  return 'pt-PT'
}

function rotuloMesPagamento(mes: string, locale: string, semData: string): string {
  if (mes === PAGAMENTOS_MES_SEM_DATA || !/^\d{4}-\d{2}$/.test(mes)) return semData
  const [y, m] = mes.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })
}

export function PagamentosContent({ saveData, loadData, safeT, localeLang }: Props) {
  const [vista, setVista] = useState<VistaPagamentos>('instituicoes')
  const [abaFicha, setAbaFicha] = useState<AbaFicha>('a-pagar')
  const [instituicaoId, setInstituicaoId] = useState('')
  const [empresas, setEmpresas] = useState<EmpresaRecebedora[]>([])
  const [registos, setRegistos] = useState<PagamentoSaida[]>([])
  const [empresaForm, setEmpresaForm] = useState(emptyEmpresaRecebedoraForm)
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaRecebedora | null>(null)
  const [pagForm, setPagForm] = useState(() => emptyPagamentoSaidaForm())
  const [editingPag, setEditingPag] = useState<PagamentoSaida | null>(null)
  const [erro, setErro] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const [mesFiltro, setMesFiltro] = useState('todos')
  const anexoAPagarRef = useRef<HTMLInputElement>(null)
  const anexoPagoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [empRaw, pagRaw] = await Promise.all([
        loadData(PAGAMENTOS_EMPRESAS_STORAGE_KEY),
        loadData(PAGAMENTOS_REGISTOS_STORAGE_KEY),
      ])
      if (cancelled) return
      const loaded = asArray<EmpresaRecebedora>(empRaw)
      const nomesOficiais = Object.fromEntries(
        PAGAMENTOS_EMPRESAS_OFICIAIS.map((d) => [d.id, tr(safeT, d.nomeKey, d.nomeFallback)])
      ) as Record<(typeof PAGAMENTOS_EMPRESAS_OFICIAIS)[number]['id'], string>
      const ensured = ensureEmpresasOficiaisPagamentos(loaded, { nomes: nomesOficiais })
      setEmpresas(ensured.list)
      if (ensured.added > 0) {
        await saveData(PAGAMENTOS_EMPRESAS_STORAGE_KEY, ensured.list)
      }
      setRegistos(asArray<PagamentoSaida>(pagRaw).map(normalizePagamentoSaida))
    })()
    return () => {
      cancelled = true
    }
  }, [loadData, saveData])

  const persistEmpresas = useCallback(
    async (next: EmpresaRecebedora[]) => {
      setEmpresas(next)
      await saveData(PAGAMENTOS_EMPRESAS_STORAGE_KEY, next)
    },
    [saveData]
  )

  const persistRegistos = useCallback(
    async (next: PagamentoSaida[]) => {
      setRegistos(next)
      await saveData(PAGAMENTOS_REGISTOS_STORAGE_KEY, next)
    },
    [saveData]
  )

  const flashOk = (msg: string) => {
    setOkMsg(msg)
    setErro('')
    window.setTimeout(() => setOkMsg(''), 2200)
  }

  const guardarEmpresa = async () => {
    if (!isEmpresaRecebedoraFormValid(empresaForm)) {
      setErro(tr(safeT, 'pagamentosInvalido', 'Preencha os campos obrigatórios'))
      return
    }
    if (editingEmpresa) {
      const updated = updateEmpresaRecebedoraFromForm(editingEmpresa, empresaForm)
      await persistEmpresas(empresas.map((e) => (e.id === updated.id ? updated : e)))
      setEditingEmpresa(null)
    } else {
      const created = createEmpresaRecebedoraFromForm(empresaForm)
      await persistEmpresas([created, ...empresas])
    }
    setEmpresaForm(emptyEmpresaRecebedoraForm())
    flashOk(tr(safeT, 'pagamentosInstituicaoGuardada', 'Instituição guardada'))
  }

  const apagarEmpresa = async (e: EmpresaRecebedora) => {
    if (isEmpresaRecebedoraOficial(e.id)) {
      setErro(tr(safeT, 'pagamentosEmpresaOficialBloqueada', 'Este destino oficial não pode ser apagado'))
      return
    }
    const ok = window.confirm(tr(safeT, 'pagamentosInstituicaoConfirmApagar', 'Apagar esta instituição?'))
    if (!ok) return
    await persistEmpresas(empresas.filter((x) => x.id !== e.id))
    if (editingEmpresa?.id === e.id) {
      setEditingEmpresa(null)
      setEmpresaForm(emptyEmpresaRecebedoraForm())
    }
    if (instituicaoId === e.id) {
      setInstituicaoId('')
      setVista('instituicoes')
    }
  }

  const guardarPagamento = async () => {
    if (!isPagamentoSaidaFormValid(pagForm)) {
      setErro(tr(safeT, 'pagamentosInvalido', 'Preencha os campos obrigatórios'))
      return
    }
    const empresa = empresas.find((e) => e.id === pagForm.empresaId)
    if (!empresa) {
      setErro(tr(safeT, 'pagamentosSemInstituicao', 'Escolha primeiro a instituição'))
      return
    }
    if (editingPag) {
      const updated = updatePagamentoSaidaFromForm(editingPag, pagForm, { empresaNome: empresa.nome })
      await persistRegistos(registos.map((p) => (p.id === updated.id ? updated : p)))
      setEditingPag(null)
    } else {
      const created = createPagamentoSaidaFromForm(pagForm, { empresaNome: empresa.nome })
      await persistRegistos([created, ...registos])
    }
    const proximoStatus = pagForm.status === 'pago' ? 'pagos' : 'a-pagar'
    setPagForm({
      ...emptyPagamentoSaidaForm(empresa.id),
      empresaId: empresa.id,
      paraQuem: empresa.nome,
    })
    flashOk(tr(safeT, 'pagamentosGuardado', 'Pagamento guardado'))
    setAbaFicha(proximoStatus)
  }

  const handleAnexoFiles = async (files: FileList | null, papel: AnexoPagamentoPapel) => {
    if (!files?.length) return
    const novos: AnexoPagamento[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_ANEXO_BYTES) {
        setErro(tr(safeT, 'pagamentosAnexoGrande', 'Ficheiro demasiado grande (máx. 8 MB): ') + file.name)
        continue
      }
      const mime = file.type || 'application/octet-stream'
      if (!mime.startsWith('image/') && mime !== 'application/pdf') {
        setErro(tr(safeT, 'pagamentosAnexoTipo', 'Só imagens ou PDF: ') + file.name)
        continue
      }
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result ?? ''))
        r.onerror = () => reject(new Error('read'))
        r.readAsDataURL(file)
      })
      novos.push(createAnexoPagamentoFromForm({ nome: file.name, mime, base64, papel }))
    }
    if (novos.length) {
      setPagForm((prev) => ({ ...prev, anexos: [...prev.anexos, ...novos] }))
      setErro('')
    }
  }

  const removerAnexo = (anexoId: string) => {
    setPagForm((prev) => ({ ...prev, anexos: prev.anexos.filter((a) => a.id !== anexoId) }))
  }

  const verAnexo = (a: AnexoPagamento) => {
    const w = window.open('', '_blank')
    if (!w) return
    if (a.mime === 'application/pdf') {
      w.document.write(
        `<iframe src="${a.base64}" style="width:100%;height:100%;border:none" title="${a.nome}"></iframe>`
      )
    } else {
      w.document.write(`<img src="${a.base64}" alt="${a.nome}" style="max-width:100%;height:auto" />`)
    }
  }

  const marcarComoPago = async (p: PagamentoSaida) => {
    const pago = marcarPagamentoSaidaComoPago(normalizePagamentoSaida(p))
    await persistRegistos(registos.map((x) => (x.id === pago.id ? pago : x)))
    if (editingPag?.id === p.id) {
      setEditingPag(pago)
      setPagForm(pagamentoSaidaToForm(pago))
    }
    setAbaFicha('pagos')
    flashOk(tr(safeT, 'pagamentosMarcadoPago', 'Pagamento marcado como pago e documentos arquivados'))
  }

  const apagarPagamento = async (p: PagamentoSaida) => {
    const ok = window.confirm(tr(safeT, 'pagamentosConfirmApagar', 'Apagar este pagamento?'))
    if (!ok) return
    await persistRegistos(registos.filter((x) => x.id !== p.id))
    if (editingPag?.id === p.id) {
      setEditingPag(null)
      const inst = empresas.find((e) => e.id === instituicaoId)
      setPagForm(emptyPagamentoSaidaForm(instituicaoId))
      if (inst) setPagForm((f) => ({ ...f, empresaId: inst.id, paraQuem: inst.nome }))
    }
  }

  const empresasOrdenadas = useMemo(() => {
    const oficiais = empresas.filter((e) => isEmpresaRecebedoraOficial(e.id))
    const outras = empresas
      .filter((e) => !isEmpresaRecebedoraOficial(e.id))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt'))
    const ordem = PAGAMENTOS_EMPRESAS_OFICIAIS.map((d) => d.id)
    oficiais.sort((a, b) => ordem.indexOf(a.id as (typeof ordem)[number]) - ordem.indexOf(b.id as (typeof ordem)[number]))
    return [...oficiais, ...outras]
  }, [empresas])

  const instituicao = empresas.find((e) => e.id === instituicaoId) || null
  const daInstituicao = useMemo(
    () => registos.filter((p) => p.empresaId === instituicaoId),
    [registos, instituicaoId]
  )
  const mesesOpcoes = useMemo(() => mesesDisponiveisPagamentos(daInstituicao), [daInstituicao])
  const visiveisMes = useMemo(
    () => pagamentosDoMes(daInstituicao, mesFiltro),
    [daInstituicao, mesFiltro]
  )
  const aPagar = useMemo(() => visiveisMes.filter((p) => p.status !== 'pago'), [visiveisMes])
  const pagos = useMemo(() => visiveisMes.filter((p) => p.status === 'pago'), [visiveisMes])
  const gruposAPagar = useMemo(() => agruparPagamentosPorMes(aPagar), [aPagar])
  const gruposPagos = useMemo(() => agruparPagamentosPorMes(pagos), [pagos])
  const totalPagoInst = useMemo(() => somarValorPagamentos(daInstituicao, true), [daInstituicao])
  const totalAPagarInst = useMemo(() => somarValorPagamentos(aPagar, false), [aPagar])
  const totalPagoGeral = useMemo(() => somarValorPagamentos(registos, true), [registos])
  const localeMes = localePagamentos(localeLang)

  const abrirInstituicao = (e: EmpresaRecebedora) => {
    setInstituicaoId(e.id)
    setVista('ficha')
    setAbaFicha('a-pagar')
    setEditingPag(null)
    setPagForm({
      ...emptyPagamentoSaidaForm(e.id),
      empresaId: e.id,
      paraQuem: e.nome,
    })
    setErro('')
  }

  const voltarInstituicoes = () => {
    setVista('instituicoes')
    setEditingPag(null)
    setErro('')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#111',
    color: '#fff',
    border: '1px solid #00ff00',
    borderRadius: 6,
    padding: '10px 12px',
    fontSize: 14,
  }

  const renderAnexos = (p: PagamentoSaida) =>
    (p.anexos || []).length === 0 ? null : (
      <div className="ns-pagamentos-anexos-list">
        {(p.anexos || []).map((a) => (
          <button key={a.id} type="button" className="ns-pagamentos-anexo-chip" onClick={() => verAnexo(a)}>
            {a.papel === 'pago'
              ? tr(safeT, 'pagamentosAnexoPagoChip', 'Pago')
              : tr(safeT, 'pagamentosAnexoAPagarChip', 'A pagar')}
            {': '}
            {a.nome}
          </button>
        ))}
      </div>
    )

  const renderGrupos = (grupos: ReturnType<typeof agruparPagamentosPorMes>, mostrarMarcarPago: boolean) =>
    grupos.length === 0 ? (
      <p className="ns-pagamentos-empty">{tr(safeT, 'pagamentosVazio', 'Ainda não há pagamentos')}</p>
    ) : (
      grupos.map((grupo) => (
        <div key={grupo.mes} className="ns-pagamentos-mes">
          <h3>
            {rotuloMesPagamento(grupo.mes, localeMes, tr(safeT, 'pagamentosSemData', 'Sem data'))}
            <span>
              {' '}
              · {tr(safeT, 'pagamentosTotalMes', 'Total do mês')} {fmtValor(grupo.totalGeral)}
            </span>
          </h3>
          <ul className="ns-pagamentos-list">
            {grupo.itens.map((p) => (
              <li key={p.id}>
                <div>
                  <strong>{p.paraQuem}</strong>
                  <span>
                    {' '}
                    · {metodoLabel(safeT, p.metodo)} · {fmtValor(p.valor)} · {p.dataPagamento}
                  </span>
                  {renderAnexos(p)}
                </div>
                <div className="ns-pagamentos-row-actions">
                  {mostrarMarcarPago && p.status !== 'pago' ? (
                    <button type="button" className="btn-primary" onClick={() => marcarComoPago(p)}>
                      {tr(safeT, 'pagamentosMarcarPago', 'Marcar como pago')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setEditingPag(p)
                      setPagForm(pagamentoSaidaToForm(normalizePagamentoSaida(p)))
                      setAbaFicha(p.status === 'pago' ? 'pagos' : 'a-pagar')
                      setErro('')
                    }}
                  >
                    {tr(safeT, 'pagamentosEditar', 'Editar pagamento')}
                  </button>
                  <button type="button" className="btn-primary ns-pagamentos-btn-ghost" onClick={() => apagarPagamento(p)}>
                    {tr(safeT, 'pagamentosApagar', 'Apagar pagamento')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))
    )

  return (
    <div className="tab-content-wrapper tab-glass-root tab-glass-root--wide ns-ui-v2 ns-pagamentos-root">
      <header className="ns-hub-page-head">
        <h1 className="ns-hub-page-head__title">{tr(safeT, 'pagamentosTitle', 'PAGAMENTOS')}</h1>
        <p className="ns-hub-page-head__sub">
          {tr(safeT, 'pagamentosInstituicoesDesc', 'Cadastro de instituições, itens a pagar e itens pagos')}
        </p>
      </header>

      {erro ? <p className="ns-pagamentos-msg ns-pagamentos-msg--err">{erro}</p> : null}
      {okMsg ? <p className="ns-pagamentos-msg ns-pagamentos-msg--ok">{okMsg}</p> : null}

      {vista === 'instituicoes' ? (
        <>
          <section className="ns-pagamentos-card ns-pagamentos-card--form">
            <h2>
              {editingEmpresa
                ? tr(safeT, 'pagamentosInstituicaoEditar', 'Editar instituição')
                : tr(safeT, 'pagamentosInstituicaoNova', 'Cadastrar instituição')}
            </h2>
            <div className="ns-pagamentos-form-grid">
              <label>
                {tr(safeT, 'pagamentosInstituicaoNome', 'Nome da instituição')} *
                <input
                  style={inputStyle}
                  value={empresaForm.nome}
                  onChange={(e) => setEmpresaForm((f) => ({ ...f, nome: e.target.value }))}
                />
              </label>
              <label>
                {tr(safeT, 'pagamentosEmpresaNif', 'NIF')}
                <input
                  style={inputStyle}
                  value={empresaForm.nif}
                  onChange={(e) => setEmpresaForm((f) => ({ ...f, nif: e.target.value }))}
                />
              </label>
              <label className="ns-pagamentos-form-grid__wide">
                {tr(safeT, 'pagamentosEmpresaNotas', 'Notas')}
                <textarea
                  style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
                  value={empresaForm.notas}
                  onChange={(e) => setEmpresaForm((f) => ({ ...f, notas: e.target.value }))}
                />
              </label>
            </div>
            <div className="ns-pagamentos-actions">
              <button type="button" className="btn-primary" onClick={guardarEmpresa}>
                {tr(safeT, 'pagamentosInstituicaoGuardar', 'Guardar instituição')}
              </button>
              {editingEmpresa ? (
                <button
                  type="button"
                  className="btn-primary ns-pagamentos-btn-ghost"
                  onClick={() => {
                    setEditingEmpresa(null)
                    setEmpresaForm(emptyEmpresaRecebedoraForm())
                    setErro('')
                  }}
                >
                  {tr(safeT, 'pagamentosCancelar', 'Cancelar')}
                </button>
              ) : null}
            </div>
          </section>

          <div className="ns-pagamentos-totais ns-pagamentos-totais--geral">
            <div className="ns-pagamentos-total-final">
              <span>{tr(safeT, 'pagamentosTotalFinal', 'Valor final (tudo somado)')}</span>
              <strong>{fmtValor(totalPagoGeral)}</strong>
            </div>
          </div>

          <h2 className="ns-pagamentos-section-title">
            {tr(safeT, 'pagamentosInstituicoesLista', 'Instituições')}
          </h2>
          <div className="ns-pagamentos-inst-grid">
            {empresasOrdenadas.map((e) => {
              const itens = registos.filter((p) => p.empresaId === e.id)
              const qtdAPagar = itens.filter((p) => p.status !== 'pago').length
              const qtdPagos = itens.filter((p) => p.status === 'pago').length
              const total = somarValorPagamentos(itens, true)
              const oficial = isEmpresaRecebedoraOficial(e.id)
              return (
                <article key={e.id} className="ns-pagamentos-inst-card">
                  <header>
                    <h3>{e.nome}</h3>
                    {oficial ? (
                      <span className="ns-pagamentos-oficial-tag">
                        {tr(safeT, 'pagamentosEmpresaOficialTag', 'Oficial')}
                      </span>
                    ) : null}
                  </header>
                  {e.nif ? <p className="ns-pagamentos-inst-meta">{e.nif}</p> : null}
                  <dl className="ns-pagamentos-inst-stats">
                    <div>
                      <dt>{tr(safeT, 'pagamentosItensAPagar', 'Itens a pagar')}</dt>
                      <dd>{qtdAPagar}</dd>
                    </div>
                    <div>
                      <dt>{tr(safeT, 'pagamentosItensPagos', 'Itens pagos')}</dt>
                      <dd>{qtdPagos}</dd>
                    </div>
                    <div>
                      <dt>{tr(safeT, 'pagamentosTotalPago', 'Total pago')}</dt>
                      <dd>{fmtValor(total)}</dd>
                    </div>
                  </dl>
                  <div className="ns-pagamentos-row-actions">
                    <button type="button" className="btn-primary" onClick={() => abrirInstituicao(e)}>
                      {tr(safeT, 'pagamentosAbrirInstituicao', 'Abrir instituição')}
                    </button>
                    <button
                      type="button"
                      className="btn-primary ns-pagamentos-btn-ghost"
                      onClick={() => {
                        setEditingEmpresa(e)
                        setEmpresaForm(empresaRecebedoraToForm(e))
                        setErro('')
                      }}
                    >
                      {tr(safeT, 'pagamentosInstituicaoEditar', 'Editar instituição')}
                    </button>
                    {!oficial ? (
                      <button type="button" className="btn-primary ns-pagamentos-btn-ghost" onClick={() => apagarEmpresa(e)}>
                        {tr(safeT, 'pagamentosInstituicaoApagar', 'Apagar instituição')}
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      ) : instituicao ? (
        <>
          <button type="button" className="ns-pagamentos-back" onClick={voltarInstituicoes}>
            ← {tr(safeT, 'pagamentosVoltarInstituicoes', 'Voltar às instituições')}
          </button>
          <section className="ns-pagamentos-card ns-pagamentos-card--head">
            <h2>{instituicao.nome}</h2>
            <dl className="ns-pagamentos-inst-stats">
              <div>
                <dt>{tr(safeT, 'pagamentosItensAPagar', 'Itens a pagar')}</dt>
                <dd>{fmtValor(totalAPagarInst)}</dd>
              </div>
              <div>
                <dt>{tr(safeT, 'pagamentosItensPagos', 'Itens pagos')}</dt>
                <dd>{fmtValor(totalPagoInst)}</dd>
              </div>
            </dl>
          </section>

          <div className="biblioteca-hub-tabs ns-pagamentos-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={abaFicha === 'a-pagar'}
              className={`biblioteca-hub-tab${abaFicha === 'a-pagar' ? ' biblioteca-hub-tab--active' : ''}`}
              onClick={() => setAbaFicha('a-pagar')}
            >
              {tr(safeT, 'pagamentosItensAPagar', 'Itens a pagar')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={abaFicha === 'pagos'}
              className={`biblioteca-hub-tab${abaFicha === 'pagos' ? ' biblioteca-hub-tab--active' : ''}`}
              onClick={() => setAbaFicha('pagos')}
            >
              {tr(safeT, 'pagamentosItensPagos', 'Itens pagos')}
            </button>
          </div>

          <div className="ns-pagamentos-ficha">
            <section className="ns-pagamentos-card">
              <h2>
                {editingPag
                  ? tr(safeT, 'pagamentosEditar', 'Editar pagamento')
                  : abaFicha === 'pagos'
                    ? tr(safeT, 'pagamentosNovoPago', 'Registar item pago')
                    : tr(safeT, 'pagamentosNovoAPagar', 'Registar item a pagar')}
              </h2>
              <label>
                {tr(safeT, 'pagamentosParaQuem', 'Para quem')} *
                <input
                  style={inputStyle}
                  value={pagForm.paraQuem}
                  onChange={(e) => setPagForm((f) => ({ ...f, paraQuem: e.target.value }))}
                />
              </label>
              <fieldset className="ns-pagamentos-metodos">
                <legend>{tr(safeT, 'pagamentosMetodo', 'Tipo de pagamento')}</legend>
                {(['referencia', 'transferencia', 'entidade-referencia'] as PagamentoMetodo[]).map((m) => (
                  <label key={m} className="ns-pagamentos-radio">
                    <input
                      type="radio"
                      name="pagamentos-metodo"
                      checked={pagForm.metodo === m}
                      onChange={() => setPagForm((f) => ({ ...f, metodo: m }))}
                    />
                    {metodoLabel(safeT, m)}
                  </label>
                ))}
              </fieldset>
              {pagForm.metodo === 'referencia' || pagForm.metodo === 'entidade-referencia' ? (
                <label>
                  {tr(safeT, 'pagamentosReferencia', 'Referência')} *
                  <input
                    style={inputStyle}
                    value={pagForm.referencia}
                    onChange={(e) => setPagForm((f) => ({ ...f, referencia: e.target.value }))}
                  />
                </label>
              ) : null}
              {pagForm.metodo === 'entidade-referencia' ? (
                <label>
                  {tr(safeT, 'pagamentosEntidade', 'Entidade')} *
                  <input
                    style={inputStyle}
                    value={pagForm.entidade}
                    onChange={(e) => setPagForm((f) => ({ ...f, entidade: e.target.value }))}
                  />
                </label>
              ) : null}
              {pagForm.metodo === 'transferencia' ? (
                <>
                  <label>
                    {tr(safeT, 'pagamentosIban', 'IBAN / conta')} *
                    <input
                      style={inputStyle}
                      value={pagForm.iban}
                      onChange={(e) => setPagForm((f) => ({ ...f, iban: e.target.value }))}
                    />
                  </label>
                  <label>
                    {tr(safeT, 'pagamentosBanco', 'Banco')}
                    <input
                      style={inputStyle}
                      value={pagForm.banco}
                      onChange={(e) => setPagForm((f) => ({ ...f, banco: e.target.value }))}
                    />
                  </label>
                </>
              ) : null}
              <label>
                {tr(safeT, 'pagamentosValor', 'Valor')} *
                <input
                  style={inputStyle}
                  inputMode="decimal"
                  value={pagForm.valor}
                  onChange={(e) => setPagForm((f) => ({ ...f, valor: e.target.value }))}
                />
              </label>
              <label>
                {tr(safeT, 'pagamentosData', 'Data')} *
                <input
                  style={inputStyle}
                  type="date"
                  value={pagForm.dataPagamento}
                  onChange={(e) => setPagForm((f) => ({ ...f, dataPagamento: e.target.value }))}
                />
              </label>
              <label>
                {tr(safeT, 'pagamentosDescricao', 'Descrição')}
                <textarea
                  style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
                  value={pagForm.descricao}
                  onChange={(e) => setPagForm((f) => ({ ...f, descricao: e.target.value }))}
                />
              </label>
              <fieldset className="ns-pagamentos-metodos">
                <legend>{tr(safeT, 'pagamentosEstado', 'Estado')}</legend>
                <label className="ns-pagamentos-radio">
                  <input
                    type="radio"
                    name="pagamentos-estado"
                    checked={pagForm.status !== 'pago'}
                    onChange={() => setPagForm((f) => ({ ...f, status: 'pendente' }))}
                  />
                  {tr(safeT, 'pagamentosItensAPagar', 'Itens a pagar')}
                </label>
                <label className="ns-pagamentos-radio">
                  <input
                    type="radio"
                    name="pagamentos-estado"
                    checked={pagForm.status === 'pago'}
                    onChange={() => setPagForm((f) => ({ ...f, status: 'pago' }))}
                  />
                  {tr(safeT, 'pagamentosItensPagos', 'Itens pagos')}
                </label>
              </fieldset>
              <div className="ns-pagamentos-anexos-block">
                <strong>{tr(safeT, 'pagamentosAnexosAPagar', 'Documentos que devem ser pagos')}</strong>
                <input
                  ref={anexoAPagarRef}
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    void handleAnexoFiles(e.target.files, 'a-pagar')
                    e.target.value = ''
                  }}
                />
                <button type="button" className="btn-primary" onClick={() => anexoAPagarRef.current?.click()}>
                  {tr(safeT, 'pagamentosAnexarAPagar', 'Anexar PDF ou imagem a pagar')}
                </button>
                <ul className="ns-pagamentos-anexos-list">
                  {pagForm.anexos.filter((a) => a.papel === 'a-pagar').map((a) => (
                    <li key={a.id}>
                      <button type="button" className="ns-pagamentos-anexo-chip" onClick={() => verAnexo(a)}>
                        {a.nome}
                      </button>
                      <button type="button" className="btn-primary ns-pagamentos-btn-ghost" onClick={() => removerAnexo(a.id)}>
                        {tr(safeT, 'pagamentosAnexoRemover', 'Remover')}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="ns-pagamentos-anexos-block">
                <strong>{tr(safeT, 'pagamentosAnexosPago', 'Documentos do pagamento pago')}</strong>
                <input
                  ref={anexoPagoRef}
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    void handleAnexoFiles(e.target.files, 'pago')
                    e.target.value = ''
                  }}
                />
                <button type="button" className="btn-primary" onClick={() => anexoPagoRef.current?.click()}>
                  {tr(safeT, 'pagamentosAnexarPago', 'Anexar comprovativo pago')}
                </button>
                <ul className="ns-pagamentos-anexos-list">
                  {pagForm.anexos.filter((a) => a.papel === 'pago').map((a) => (
                    <li key={a.id}>
                      <button type="button" className="ns-pagamentos-anexo-chip" onClick={() => verAnexo(a)}>
                        {a.nome}
                      </button>
                      <button type="button" className="btn-primary ns-pagamentos-btn-ghost" onClick={() => removerAnexo(a.id)}>
                        {tr(safeT, 'pagamentosAnexoRemover', 'Remover')}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="ns-pagamentos-actions">
                <button type="button" className="btn-primary" onClick={guardarPagamento}>
                  {tr(safeT, 'pagamentosGuardar', 'Guardar pagamento')}
                </button>
                {editingPag ? (
                  <button
                    type="button"
                    className="btn-primary ns-pagamentos-btn-ghost"
                    onClick={() => {
                      setEditingPag(null)
                      setPagForm({
                        ...emptyPagamentoSaidaForm(instituicao.id),
                        empresaId: instituicao.id,
                        paraQuem: instituicao.nome,
                      })
                      setErro('')
                    }}
                  >
                    {tr(safeT, 'pagamentosCancelar', 'Cancelar')}
                  </button>
                ) : null}
              </div>
            </section>

            <section className="ns-pagamentos-card">
              <label>
                {tr(safeT, 'pagamentosFiltroMes', 'Mês')}
                <select style={inputStyle} value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
                  <option value="todos">{tr(safeT, 'pagamentosTodosMeses', 'Todos os meses')}</option>
                  {mesesOpcoes.map((mes) => (
                    <option key={mes} value={mes}>
                      {rotuloMesPagamento(mes, localeMes, tr(safeT, 'pagamentosSemData', 'Sem data'))}
                    </option>
                  ))}
                </select>
              </label>
              {abaFicha === 'a-pagar' ? (
                <>
                  <h2>{tr(safeT, 'pagamentosItensAPagar', 'Itens a pagar')}</h2>
                  {renderGrupos(gruposAPagar, true)}
                </>
              ) : (
                <>
                  <h2>{tr(safeT, 'pagamentosItensPagos', 'Itens pagos')}</h2>
                  <div className="ns-pagamentos-total-final">
                    <span>{tr(safeT, 'pagamentosTotalPago', 'Total pago')}</span>
                    <strong>{fmtValor(somarValorPagamentos(pagos, true))}</strong>
                  </div>
                  {renderGrupos(gruposPagos, false)}
                </>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  )
}

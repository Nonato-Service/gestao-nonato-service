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
  normalizePagamentoSaida,
  PAGAMENTOS_EMPRESAS_OFICIAIS,
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
}

type AbaPagamentos = 'empresas' | 'registos'

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

export function PagamentosContent({ saveData, loadData, safeT }: Props) {
  const [aba, setAba] = useState<AbaPagamentos>('empresas')
  const [empresas, setEmpresas] = useState<EmpresaRecebedora[]>([])
  const [registos, setRegistos] = useState<PagamentoSaida[]>([])
  const [empresaForm, setEmpresaForm] = useState(emptyEmpresaRecebedoraForm)
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaRecebedora | null>(null)
  const [pagForm, setPagForm] = useState(() => emptyPagamentoSaidaForm())
  const [editingPag, setEditingPag] = useState<PagamentoSaida | null>(null)
  const [erro, setErro] = useState('')
  const [okMsg, setOkMsg] = useState('')
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
    flashOk(tr(safeT, 'pagamentosEmpresaGuardada', 'Empresa guardada'))
  }

  const apagarEmpresa = async (e: EmpresaRecebedora) => {
    if (isEmpresaRecebedoraOficial(e.id)) {
      setErro(tr(safeT, 'pagamentosEmpresaOficialBloqueada', 'Este destino oficial não pode ser apagado'))
      return
    }
    const ok = window.confirm(
      tr(safeT, 'pagamentosEmpresaConfirmApagar', 'Apagar esta empresa?')
    )
    if (!ok) return
    await persistEmpresas(empresas.filter((x) => x.id !== e.id))
    if (editingEmpresa?.id === e.id) {
      setEditingEmpresa(null)
      setEmpresaForm(emptyEmpresaRecebedoraForm())
    }
    if (pagForm.empresaId === e.id) {
      setPagForm((prev) => ({ ...prev, empresaId: '' }))
    }
  }

  const guardarPagamento = async () => {
    if (!isPagamentoSaidaFormValid(pagForm)) {
      setErro(tr(safeT, 'pagamentosInvalido', 'Preencha os campos obrigatórios'))
      return
    }
    const empresa = empresas.find((e) => e.id === pagForm.empresaId)
    if (!empresa) {
      setErro(tr(safeT, 'pagamentosSemEmpresa', 'Cadastre primeiro a empresa que recebeu o dinheiro'))
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
    setPagForm(emptyPagamentoSaidaForm(empresa.id))
    flashOk(tr(safeT, 'pagamentosGuardado', 'Pagamento guardado'))
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
    flashOk(tr(safeT, 'pagamentosMarcadoPago', 'Pagamento marcado como pago e documentos arquivados'))
  }

  const apagarPagamento = async (p: PagamentoSaida) => {
    const ok = window.confirm(tr(safeT, 'pagamentosConfirmApagar', 'Apagar este pagamento?'))
    if (!ok) return
    await persistRegistos(registos.filter((x) => x.id !== p.id))
    if (editingPag?.id === p.id) {
      setEditingPag(null)
      setPagForm(emptyPagamentoSaidaForm())
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

  const escolherDestinoOficial = (e: EmpresaRecebedora) => {
    setPagForm((f) => ({
      ...f,
      empresaId: e.id,
      paraQuem: e.nome,
    }))
    setAba('registos')
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

  return (
    <div className="tab-content-wrapper tab-glass-root tab-glass-root--wide ns-ui-v2 ns-pagamentos-root">
      <header className="ns-hub-page-head">
        <h1 className="ns-hub-page-head__title">{tr(safeT, 'pagamentosTitle', 'PAGAMENTOS')}</h1>
        <p className="ns-hub-page-head__sub">
          {tr(safeT, 'pagamentosDesc', 'Empresas que receberam dinheiro e dados de pagamento')}
        </p>
      </header>

      <div className="biblioteca-hub-tabs ns-pagamentos-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'empresas'}
          className={`biblioteca-hub-tab${aba === 'empresas' ? ' biblioteca-hub-tab--active' : ''}`}
          onClick={() => setAba('empresas')}
        >
          {tr(safeT, 'pagamentosEmpresasTab', 'Empresas')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'registos'}
          className={`biblioteca-hub-tab${aba === 'registos' ? ' biblioteca-hub-tab--active' : ''}`}
          onClick={() => setAba('registos')}
        >
          {tr(safeT, 'pagamentosRegistosTab', 'Pagamentos')}
        </button>
      </div>

      {erro ? <p className="ns-pagamentos-msg ns-pagamentos-msg--err">{erro}</p> : null}
      {okMsg ? <p className="ns-pagamentos-msg ns-pagamentos-msg--ok">{okMsg}</p> : null}

      {aba === 'empresas' ? (
        <div className="ns-pagamentos-grid">
          <section className="ns-pagamentos-card">
            <h2>
              {editingEmpresa
                ? tr(safeT, 'pagamentosEmpresaEditar', 'Editar empresa')
                : tr(safeT, 'pagamentosEmpresaNova', 'Nova empresa')}
            </h2>
            <label>
              {tr(safeT, 'pagamentosEmpresaNome', 'Nome da empresa')} *
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
            <label>
              {tr(safeT, 'pagamentosEmpresaNotas', 'Notas')}
              <textarea
                style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                value={empresaForm.notas}
                onChange={(e) => setEmpresaForm((f) => ({ ...f, notas: e.target.value }))}
              />
            </label>
            <div className="ns-pagamentos-actions">
              <button type="button" className="btn-primary" onClick={guardarEmpresa}>
                {tr(safeT, 'pagamentosEmpresaGuardar', 'Guardar empresa')}
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

          <section className="ns-pagamentos-card">
            <h2>{tr(safeT, 'pagamentosEmpresasOficiais', 'Destinos oficiais')}</h2>
            <ul className="ns-pagamentos-list">
              {empresasOrdenadas.filter((e) => isEmpresaRecebedoraOficial(e.id)).map((e) => (
                <li key={e.id}>
                  <div>
                    <strong>{e.nome}</strong>
                    {e.nif ? <span> · {e.nif}</span> : null}
                    <span className="ns-pagamentos-oficial-tag">
                      {tr(safeT, 'pagamentosEmpresaOficialTag', 'Oficial')}
                    </span>
                  </div>
                  <div className="ns-pagamentos-row-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => escolherDestinoOficial(e)}
                    >
                      {tr(safeT, 'pagamentosPagarAgora', 'Registar pagamento')}
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
                      {tr(safeT, 'pagamentosEmpresaEditar', 'Editar empresa')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <h2 className="ns-pagamentos-card-sub">
              {tr(safeT, 'pagamentosListaEmpresas', 'Empresas que receberam')}
            </h2>
            {empresasOrdenadas.filter((e) => !isEmpresaRecebedoraOficial(e.id)).length === 0 ? (
              <p className="ns-pagamentos-empty">
                {tr(safeT, 'pagamentosEmpresaVazia', 'Ainda não há empresas cadastradas')}
              </p>
            ) : (
              <ul className="ns-pagamentos-list">
                {empresasOrdenadas.filter((e) => !isEmpresaRecebedoraOficial(e.id)).map((e) => (
                  <li key={e.id}>
                    <div>
                      <strong>{e.nome}</strong>
                      {e.nif ? <span> · {e.nif}</span> : null}
                    </div>
                    <div className="ns-pagamentos-row-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          setEditingEmpresa(e)
                          setEmpresaForm(empresaRecebedoraToForm(e))
                          setErro('')
                        }}
                      >
                        {tr(safeT, 'pagamentosEmpresaEditar', 'Editar empresa')}
                      </button>
                      <button
                        type="button"
                        className="btn-primary ns-pagamentos-btn-ghost"
                        onClick={() => apagarEmpresa(e)}
                      >
                        {tr(safeT, 'pagamentosEmpresaApagar', 'Apagar empresa')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className="ns-pagamentos-grid">
          <section className="ns-pagamentos-card">
            <h2>
              {editingPag
                ? tr(safeT, 'pagamentosEditar', 'Editar pagamento')
                : tr(safeT, 'pagamentosNovo', 'Novo pagamento')}
            </h2>
            <fieldset className="ns-pagamentos-metodos ns-pagamentos-oficiais">
              <legend>{tr(safeT, 'pagamentosEmpresasOficiais', 'Destinos oficiais')}</legend>
              <div className="ns-pagamentos-oficial-chips">
                {empresasOrdenadas.filter((e) => isEmpresaRecebedoraOficial(e.id)).map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className={`btn-primary ns-pagamentos-oficial-chip${
                      pagForm.empresaId === e.id ? ' ns-pagamentos-oficial-chip--on' : ''
                    }`}
                    onClick={() => {
                      setPagForm((f) => ({
                        ...f,
                        empresaId: e.id,
                        paraQuem: e.nome,
                      }))
                      setErro('')
                    }}
                  >
                    {e.nome}
                  </button>
                ))}
              </div>
            </fieldset>
            <label>
              {tr(safeT, 'pagamentosEmpresaDestino', 'Empresa que recebeu')} *
              <select
                style={inputStyle}
                value={pagForm.empresaId}
                onChange={(e) => {
                  const id = e.target.value
                  const emp = empresas.find((x) => x.id === id)
                  setPagForm((f) => ({
                    ...f,
                    empresaId: id,
                    paraQuem: f.paraQuem.trim() ? f.paraQuem : emp?.nome || '',
                  }))
                }}
              >
                <option value="">{tr(safeT, 'pagamentosEscolhaEmpresa', 'Escolha a empresa')}</option>
                {empresasOrdenadas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </label>
            {empresasOrdenadas.length === 0 ? (
              <p className="ns-pagamentos-empty">
                {tr(safeT, 'pagamentosSemEmpresa', 'Cadastre primeiro a empresa que recebeu o dinheiro')}
              </p>
            ) : null}
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
                style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
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
                  checked={pagForm.status === 'pendente'}
                  onChange={() => setPagForm((f) => ({ ...f, status: 'pendente' }))}
                />
                {tr(safeT, 'pagamentosEstadoPendente', 'A pagar')}
              </label>
              <label className="ns-pagamentos-radio">
                <input
                  type="radio"
                  name="pagamentos-estado"
                  checked={pagForm.status === 'pago'}
                  onChange={() => setPagForm((f) => ({ ...f, status: 'pago' }))}
                />
                {tr(safeT, 'pagamentosEstadoPago', 'Pago')}
              </label>
            </fieldset>
            <div className="ns-pagamentos-anexos-block">
              <strong>{tr(safeT, 'pagamentosAnexosAPagar', 'Documentos que devem ser pagos')}</strong>
              <p className="ns-pagamentos-empty">
                {tr(safeT, 'pagamentosAnexosAPagarHint', 'Anexe o PDF ou a imagem do documento a pagar.')}
              </p>
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
              <p className="ns-pagamentos-empty">
                {tr(
                  safeT,
                  'pagamentosAnexosPagoHint',
                  'Quando o pagamento fica pago, os documentos passam para aqui. Também pode anexar o comprovativo.'
                )}
              </p>
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
                    setPagForm(emptyPagamentoSaidaForm())
                    setErro('')
                  }}
                >
                  {tr(safeT, 'pagamentosCancelar', 'Cancelar')}
                </button>
              ) : null}
            </div>
          </section>

          <section className="ns-pagamentos-card">
            <h2>{tr(safeT, 'pagamentosListaRegistos', 'Pagamentos registados')}</h2>
            {registos.length === 0 ? (
              <p className="ns-pagamentos-empty">
                {tr(safeT, 'pagamentosVazio', 'Ainda não há pagamentos')}
              </p>
            ) : (
              <ul className="ns-pagamentos-list">
                {registos.map((p) => (
                  <li key={p.id}>
                    <div>
                      <strong>{p.paraQuem}</strong>
                      <span className={`ns-pagamentos-oficial-tag${p.status === 'pago' ? ' ns-pagamentos-status-pago' : ''}`}>
                        {p.status === 'pago'
                          ? tr(safeT, 'pagamentosEstadoPago', 'Pago')
                          : tr(safeT, 'pagamentosEstadoPendente', 'A pagar')}
                      </span>
                      <span>
                        {' '}
                        · {p.empresaNome} · {metodoLabel(safeT, p.metodo)} · {fmtValor(p.valor)} · {p.dataPagamento}
                      </span>
                      {(p.anexos || []).length > 0 ? (
                        <div className="ns-pagamentos-anexos-list">
                          {(p.anexos || []).map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              className="ns-pagamentos-anexo-chip"
                              onClick={() => verAnexo(a)}
                            >
                              {a.papel === 'pago'
                                ? tr(safeT, 'pagamentosAnexoPagoChip', 'Pago')
                                : tr(safeT, 'pagamentosAnexoAPagarChip', 'A pagar')}
                              {': '}
                              {a.nome}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="ns-pagamentos-row-actions">
                      {p.status !== 'pago' ? (
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
                          setErro('')
                        }}
                      >
                        {tr(safeT, 'pagamentosEditar', 'Editar pagamento')}
                      </button>
                      <button
                        type="button"
                        className="btn-primary ns-pagamentos-btn-ghost"
                        onClick={() => apagarPagamento(p)}
                      >
                        {tr(safeT, 'pagamentosApagar', 'Apagar pagamento')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

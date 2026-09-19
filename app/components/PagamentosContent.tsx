'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  EmpresaRecebedora,
  PagamentoMetodo,
  PagamentoSaida,
} from '../modules/pagamentos'
import {
  emptyEmpresaRecebedoraForm,
  empresaRecebedoraToForm,
  isEmpresaRecebedoraFormValid,
  isPagamentoSaidaFormValid,
  PAGAMENTOS_EMPRESAS_STORAGE_KEY,
  PAGAMENTOS_REGISTOS_STORAGE_KEY,
  pagamentoSaidaToForm,
} from '../modules/pagamentos'
import {
  createEmpresaRecebedoraFromForm,
  createPagamentoSaidaFromForm,
  emptyPagamentoSaidaForm,
  updateEmpresaRecebedoraFromForm,
  updatePagamentoSaidaFromForm,
} from '../lib/pagamentosFromForm'

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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [empRaw, pagRaw] = await Promise.all([
        loadData(PAGAMENTOS_EMPRESAS_STORAGE_KEY),
        loadData(PAGAMENTOS_REGISTOS_STORAGE_KEY),
      ])
      if (cancelled) return
      setEmpresas(asArray<EmpresaRecebedora>(empRaw))
      setRegistos(asArray<PagamentoSaida>(pagRaw))
    })()
    return () => {
      cancelled = true
    }
  }, [loadData])

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

  const apagarPagamento = async (p: PagamentoSaida) => {
    const ok = window.confirm(tr(safeT, 'pagamentosConfirmApagar', 'Apagar este pagamento?'))
    if (!ok) return
    await persistRegistos(registos.filter((x) => x.id !== p.id))
    if (editingPag?.id === p.id) {
      setEditingPag(null)
      setPagForm(emptyPagamentoSaidaForm())
    }
  }

  const empresasOrdenadas = useMemo(
    () => [...empresas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt')),
    [empresas]
  )

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
            <h2>{tr(safeT, 'pagamentosListaEmpresas', 'Empresas que receberam')}</h2>
            {empresasOrdenadas.length === 0 ? (
              <p className="ns-pagamentos-empty">
                {tr(safeT, 'pagamentosEmpresaVazia', 'Ainda não há empresas cadastradas')}
              </p>
            ) : (
              <ul className="ns-pagamentos-list">
                {empresasOrdenadas.map((e) => (
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
                      <span>
                        {' '}
                        · {p.empresaNome} · {metodoLabel(safeT, p.metodo)} · {fmtValor(p.valor)} · {p.dataPagamento}
                      </span>
                    </div>
                    <div className="ns-pagamentos-row-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          setEditingPag(p)
                          setPagForm(pagamentoSaidaToForm(p))
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

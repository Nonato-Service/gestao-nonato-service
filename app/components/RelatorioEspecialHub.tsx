'use client'

import { useCallback, useMemo, useState } from 'react'
import { ClienteAlfabetoPicker } from './ClienteAlfabetoPicker'
import type { ClienteAlfabetoRow } from '../lib/clienteAlfabetoBusca'
import {
  aplicarTotaisNoRelatorioEspecial,
  atualizarCalculosDiaEspecial,
  calcularTotaisRelatorioEspecial,
  formatDiaCurtoPt,
  sortDiasTrabalhoEspecialCronologicamente,
} from '../lib/relatorioEspecialCalculos'
import { imprimirRelatorioEspecialPdf } from '../lib/relatorioEspecialPdf'
import {
  criarDiaTrabalhoEspecialVazio,
  criarHorasEquipamentoDiaVazio,
  criarRelatorioEspecialVazio,
  MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_DIA,
  MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_MES,
  type DiaTrabalhoEspecial,
  type RelatorioEspecial,
} from '../lib/relatorioEspecialTypes'
import {
  criarEquipamentoRelatorioVazio,
  equipamentoArmazemEstaAtivo,
  resolverChaveEquipamentoClienteRelatorio,
  resolverEquipamentoRelatorioParaExibicao,
  resolverIdEquipamentoCliente,
  resolverIdEquipamentoVisivelCliente,
  type EquipamentoArmazemBaixaLookup,
  type EquipamentoClienteIdLookup,
  type RelatorioEquipamentoRef,
} from '../lib/relatorioServicoEquipamentos'

type ClienteMin = ClienteAlfabetoRow & { equipamentos?: EquipamentoClienteIdLookup[] }

type TecnicoMin = { id: string; name: string }

export type RelatorioEspecialHubProps = {
  relatorios: RelatorioEspecial[]
  onSaveAll: (lista: RelatorioEspecial[]) => Promise<boolean>
  clientes: ClienteMin[]
  equipamentosArmazem: EquipamentoArmazemBaixaLookup[]
  tecnicos: TecnicoMin[]
  selectedLanguage: string
  labels: Record<string, string | undefined>
  preverNumero: (dataIso: string) => string
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  backgroundColor: '#404040',
  color: '#fff',
  border: '1px solid rgba(0, 200, 83, 0.3)',
  borderRadius: '4px',
}

function labelEquipamentoCurto(eq: RelatorioEquipamentoRef, idx: number): string {
  const id = eq.equipamentoId || eq.numeroMaquina || `#${idx + 1}`
  const mod = eq.maquinaModelo ? ` · ${eq.maquinaModelo}` : ''
  return `${id}${mod}`
}

export default function RelatorioEspecialHub({
  relatorios,
  onSaveAll,
  clientes,
  equipamentosArmazem,
  tecnicos,
  selectedLanguage,
  labels,
  preverNumero,
}: RelatorioEspecialHubProps) {
  const t = labels
  const [modo, setModo] = useState<'lista' | 'form' | 'fechamento'>('lista')
  const [form, setForm] = useState<RelatorioEspecial>(() => criarRelatorioEspecialVazio())
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [diaExpandido, setDiaExpandido] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const formComTotais = useMemo(() => aplicarTotaisNoRelatorioEspecial(form), [form])
  const totais = useMemo(
    () => calcularTotaisRelatorioEspecial(formComTotais.diasTrabalho),
    [formComTotais.diasTrabalho]
  )

  const clientesOrdenados = useMemo(
    () => [...clientes].sort((a, b) => a.nomeEmpresa.localeCompare(b.nomeEmpresa, 'pt')),
    [clientes]
  )

  const equipamentosAtivos = useMemo(
    () => equipamentosArmazem.filter(equipamentoArmazemEstaAtivo),
    [equipamentosArmazem]
  )

  const atualizarEquipamentos = useCallback((next: RelatorioEquipamentoRef[]) => {
    setForm((prev) => ({ ...prev, equipamentos: next }))
  }, [])

  const abrirNovo = useCallback(() => {
    const vazio = criarRelatorioEspecialVazio()
    vazio.numero = preverNumero(vazio.data)
    setForm(vazio)
    setEditandoId(null)
    setModo('form')
    setDiaExpandido(null)
  }, [preverNumero])

  const abrirEditar = useCallback((rel: RelatorioEspecial) => {
    setForm({ ...rel, equipamentos: [...(rel.equipamentos || [])], diasTrabalho: [...(rel.diasTrabalho || [])] })
    setEditandoId(rel.id)
    setModo('form')
    setDiaExpandido(null)
  }, [])

  const abrirFechamento = useCallback((rel: RelatorioEspecial) => {
    setForm(aplicarTotaisNoRelatorioEspecial(rel))
    setEditandoId(rel.id)
    setModo('fechamento')
  }, [])

  const persistir = useCallback(async () => {
    if (!form.tecnico?.trim() || !form.cliente?.trim() || !form.data?.trim() || !form.numero?.trim()) {
      alert(t.fillAllFields || 'Preencha técnico, cliente, data e número.')
      return
    }
    const equipamentosOk = (form.equipamentos || []).filter(
      (e) => e.equipamentoId || e.maquinaModelo || e.numeroMaquina
    )
    if (equipamentosOk.length === 0) {
      alert(t.relatorioEspecialSemEquipamentos || 'Adicione pelo menos um equipamento ao relatório.')
      return
    }
    setSalvando(true)
    try {
      const preparado = aplicarTotaisNoRelatorioEspecial({ ...form, equipamentos: equipamentosOk })
      const lista = editandoId
        ? relatorios.map((r) => (r.id === editandoId ? preparado : r))
        : [...relatorios, preparado]
      const ok = await onSaveAll(lista)
      if (ok) {
        alert(t.saveSuccess || 'Relatório especial guardado.')
        setModo('lista')
        setEditandoId(null)
      }
    } finally {
      setSalvando(false)
    }
  }, [form, editandoId, relatorios, onSaveAll, t])

  const adicionarEquipamento = () => {
    if ((form.equipamentos?.length || 0) >= MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_MES) {
      alert(
        t.relatorioEspecialMaxEquipamentosMes ||
          `Máximo ${MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_MES} equipamentos por relatório (mês).`
      )
      return
    }
    atualizarEquipamentos([...(form.equipamentos || []), criarEquipamentoRelatorioVazio('cliente')])
  }

  const adicionarDia = () => {
    const data = form.data || new Date().toISOString().split('T')[0]
    const dia = criarDiaTrabalhoEspecialVazio(data)
    setForm((prev) => ({
      ...prev,
      diasTrabalho: [...(prev.diasTrabalho || []), dia],
    }))
    setDiaExpandido(dia.id)
  }

  const actualizarDia = (diaId: string, patch: Partial<DiaTrabalhoEspecial>) => {
    setForm((prev) => ({
      ...prev,
      diasTrabalho: (prev.diasTrabalho || []).map((d) =>
        d.id === diaId ? atualizarCalculosDiaEspecial({ ...d, ...patch }) : d
      ),
    }))
  }

  const fecharPorEquipamento = (uid: string) => {
    const horas = formComTotais.horasPorEquipamentoResumo?.[uid] || '0:00'
    const eq = form.equipamentos?.find((e) => e.uid === uid)
    const nome = eq ? labelEquipamentoCurto(eq, form.equipamentos!.indexOf(eq)) : uid
    if (!window.confirm(`${t.relatorioEspecialConfirmarFechamentoEq || 'Fechar horas do equipamento'} ${nome}?\nTotal: ${horas}`)) return
    setForm((prev) => {
      const fech = prev.fechamento || { porEquipamento: [] }
      const filtrado = fech.porEquipamento.filter((f) => f.equipamentoUid !== uid)
      return {
        ...prev,
        fechamento: {
          ...fech,
          porEquipamento: [
            ...filtrado,
            { equipamentoUid: uid, horasTotal: horas, fechadoEm: new Date().toISOString() },
          ],
        },
      }
    })
  }

  const fecharTotalGeral = () => {
    const horas = formComTotais.horasTrabalho || '0:00'
    if (!window.confirm(`${t.relatorioEspecialConfirmarFechamentoTotal || 'Fechar total geral do relatório?'}\nTotal: ${horas}`)) return
    setForm((prev) => ({
      ...prev,
      fechamento: {
        ...(prev.fechamento || { porEquipamento: [] }),
        totalGeral: { horasTotal: horas, fechadoEm: new Date().toISOString() },
      },
    }))
  }

  const guardarFechamento = async () => {
    setSalvando(true)
    try {
      const preparado = aplicarTotaisNoRelatorioEspecial(form)
      const lista = relatorios.map((r) => (r.id === preparado.id ? preparado : r))
      const ok = await onSaveAll(lista)
      if (ok) {
        alert(t.relatorioEspecialFechamentoGuardado || 'Fechamento guardado.')
        setModo('lista')
      }
    } finally {
      setSalvando(false)
    }
  }

  if (modo === 'lista') {
    return (
      <div className="relatorio-especial-hub" style={{ padding: '16px 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20 }} className="relatorio-especial-hub__head">
          <h2 style={{ margin: 0, flex: '1 1 200px' }}>
            {t.relatorioEspecialTitle || 'Relatórios Especiais'}
          </h2>
          <button type="button" className="btn-primary relatorio-equipamentos-block__add" onClick={abrirNovo}>
            ➕ {t.relatorioEspecialNovo || 'Novo relatório especial'}
          </button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 16, lineHeight: 1.45 }}>
          {t.relatorioEspecialDescricao ||
            'Um relatório por intervenção de fabricante — até 11 equipamentos no mês, até 4 por dia, com horas separadas por equipamento e fechamento mensal.'}
        </p>
        {relatorios.length === 0 ? (
          <p style={{ color: '#aaa' }}>{t.relatorioEspecialListaVazia || 'Nenhum relatório especial ainda.'}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...relatorios]
              .sort((a, b) => String(b.data).localeCompare(String(a.data)))
              .map((rel) => {
                const prep = aplicarTotaisNoRelatorioEspecial(rel)
                return (
                  <div
                    key={rel.id}
                    style={{
                      border: '1px solid rgba(0,200,83,0.35)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      background: 'rgba(0,40,24,0.35)',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
                      <div>
                        <strong>{rel.numero}</strong> · {rel.cliente} · {rel.tecnico}
                        <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
                          {(rel.equipamentos?.length || 0)} equip. · {prep.horasTrabalho} h total · {prep.kmsPercorridos} km
                          {prep.fechamento?.totalGeral ? ' · ✓ Fechado' : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button type="button" className="btn-secondary" onClick={() => abrirEditar(rel)}>
                          {t.edit || 'Editar'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => imprimirRelatorioEspecialPdf(prep)}>
                          🖨 {t.print || 'PDF'}
                        </button>
                        <button type="button" className="btn-primary" onClick={() => abrirFechamento(rel)}>
                          {t.relatorioEspecialFechamento || 'Fechamento'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    )
  }

  if (modo === 'fechamento') {
    const eqs = formComTotais.equipamentos || []
    return (
      <div style={{ padding: '16px 0', maxWidth: 720 }}>
        <button type="button" className="btn-secondary" style={{ marginBottom: 16 }} onClick={() => setModo('lista')}>
          ← {t.voltar || 'Voltar'}
        </button>
        <h2>{t.relatorioEspecialFechamentoMes || 'Fechamento do mês'}</h2>
        <p style={{ fontSize: 13, color: '#ccc' }}>
          {form.numero} · {form.cliente}
        </p>
        <h3 style={{ marginTop: 20 }}>{t.relatorioEspecialFechamentoPorEquipamento || 'Por equipamento'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {eqs.map((eq, i) => {
            const total = formComTotais.horasPorEquipamentoResumo?.[eq.uid] || '0:00'
            const fechado = form.fechamento?.porEquipamento?.find((f) => f.equipamentoUid === eq.uid)
            return (
              <div
                key={eq.uid}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  alignItems: 'center',
                  padding: 12,
                  border: '1px solid rgba(0,200,83,0.3)',
                  borderRadius: 8,
                }}
              >
                <span style={{ flex: 1 }}>{labelEquipamentoCurto(eq, i)}</span>
                <strong>{total}</strong>
                {fechado ? (
                  <span style={{ color: '#00c853', fontSize: 12 }}>✓ {new Date(fechado.fechadoEm).toLocaleDateString('pt-PT')}</span>
                ) : (
                  <button type="button" className="btn-primary" onClick={() => fecharPorEquipamento(eq.uid)}>
                    {t.relatorioEspecialFecharEquipamento || 'Fechar equipamento'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <div
          style={{
            marginTop: 24,
            padding: 16,
            border: '2px solid rgba(0,200,83,0.5)',
            borderRadius: 10,
            background: 'rgba(0,60,30,0.25)',
          }}
        >
          <h3 style={{ marginTop: 0 }}>{t.relatorioEspecialFechamentoTotal || 'Total geral'}</h3>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#00c853' }}>{formComTotais.horasTrabalho}</p>
          {form.fechamento?.totalGeral ? (
            <p style={{ color: '#00c853' }}>✓ Fechado em {new Date(form.fechamento.totalGeral.fechadoEm).toLocaleString('pt-PT')}</p>
          ) : (
            <button type="button" className="btn-primary" onClick={fecharTotalGeral}>
              {t.relatorioEspecialFecharTotal || 'Fechar total geral'}
            </button>
          )}
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button type="button" className="btn-primary" disabled={salvando} onClick={guardarFechamento}>
            {salvando ? '…' : t.save || 'Guardar fechamento'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => imprimirRelatorioEspecialPdf(formComTotais)}>
            🖨 PDF
          </button>
        </div>
      </div>
    )
  }

  const diasOrdenados = sortDiasTrabalhoEspecialCronologicamente(form.diasTrabalho || [])
  const clienteIdEfetivo = form.clienteId || ''
  const clienteEquipamentos = clientes.find((c) => c.id === clienteIdEfetivo)?.equipamentos ?? []
  const podeAdicionarEquip = (form.equipamentos?.length || 0) < MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_MES

  return (
    <div className="relatorio-especial-form" style={{ padding: '16px 0' }}>
      <button type="button" className="btn-secondary" style={{ marginBottom: 16 }} onClick={() => setModo('lista')}>
        ← {t.voltar || 'Voltar'}
      </button>
      <h2>{editandoId ? t.relatorioEspecialEditar || 'Editar relatório especial' : t.relatorioEspecialNovo || 'Novo relatório especial'}</h2>

      <section style={{ marginBottom: 24 }}>
        <h3>{t.informacoesBasicas || 'Informações básicas'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          <div>
            <label>{t.numeroRelatorio || 'Número'}</label>
            <input type="text" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label>{t.data || 'Data ref.'}</label>
            <input
              type="date"
              value={form.data}
              onChange={(e) => {
                const v = e.target.value
                setForm((prev) => ({
                  ...prev,
                  data: v,
                  numero: editandoId ? prev.numero : preverNumero(v),
                }))
              }}
              style={inputStyle}
            />
          </div>
          <div>
            <label>{t.selecioneTecnico || 'Técnico'}</label>
            <select value={form.tecnico} onChange={(e) => setForm({ ...form, tecnico: e.target.value })} style={inputStyle}>
              <option value="">{t.selecioneTecnico || 'Técnico'}</option>
              {tecnicos.map((tec) => (
                <option key={tec.id} value={tec.name}>
                  {tec.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>{t.selecioneCliente || 'Cliente'}</label>
            <ClienteAlfabetoPicker
              clientes={clientesOrdenados}
              selectedId={form.clienteId || ''}
              language={selectedLanguage}
              labels={t as any}
              listMaxHeight={240}
              onSelect={(c) =>
                setForm((prev) => ({
                  ...prev,
                  clienteId: c.id,
                  cliente: c.nomeEmpresa,
                  cidade: c.localidade || prev.cidade,
                  telefone: c.telefones || prev.telefone,
                }))
              }
            />
          </div>
          <div>
            <label>{t.cidade || 'Cidade'}</label>
            <input type="text" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label>{t.telefone || 'Telefone'}</label>
            <input type="text" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label>{t.tipoServico || 'Tipo de serviço'}</label>
            <input type="text" value={form.tipoServico} onChange={(e) => setForm({ ...form, tipoServico: e.target.value })} style={inputStyle} />
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 24 }} className="relatorio-equipamentos-block">
        <div className="relatorio-equipamentos-block__head">
          <div>
            <h3 className="relatorio-equipamentos-block__title" style={{ margin: 0 }}>
              {t.relatorioEspecialEquipamentos || 'Equipamentos'} ({form.equipamentos?.length || 0}/
              {MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_MES})
            </h3>
            <p className="relatorio-equipamentos-block__lead">
              {t.relatorioEquipamentosAjuda ||
                'Adicione equipamentos do cliente ou busque na biblioteca do armazém. Edite ID, modelo e n.º série.'}
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary relatorio-equipamentos-block__add"
            disabled={!podeAdicionarEquip}
            onClick={adicionarEquipamento}
          >
            + {t.relatorioAdicionarEquipamento || 'Adicionar equipamento'}
          </button>
        </div>

        {(form.equipamentos || []).length === 0 ? (
          <p className="relatorio-equipamentos-block__empty">
            {t.relatorioSemEquipamentos || 'Nenhum equipamento adicionado.'}
          </p>
        ) : (
          <div className="relatorio-equipamentos-list">
            {(form.equipamentos || []).map((eq, eqIdx) => (
              <div key={eq.uid} className="relatorio-equipamento-card">
                <div className="relatorio-equipamento-card__head">
                  <span className="relatorio-equipamento-card__badge">
                    {(t.relatorioEquipamentoNumero || 'Equipamento {n}').replace('{n}', String(eqIdx + 1))}
                  </span>
                  <button
                    type="button"
                    className="btn-danger btn-danger--inline relatorio-equipamento-card__remove"
                    onClick={() => atualizarEquipamentos((form.equipamentos || []).filter((x) => x.uid !== eq.uid))}
                  >
                    {t.removerEquipamentoRelatorio || 'Remover'}
                  </button>
                </div>

                <div className="relatorio-equipamento-card__grid">
                  <div className="relatorio-equipamento-card__field--full">
                    <span className="relatorio-equipamento-card__label relatorio-equipamento-card__label--blue">
                      {t.relatorioEquipamentoOrigem || 'Origem do equipamento'}
                    </span>
                    <div className="relatorio-equipamento-card__origem-radios" role="radiogroup">
                      <label className="relatorio-equipamento-card__origem-radio">
                        <input
                          type="radio"
                          name={`re-eq-origem-${eq.uid}`}
                          value="cliente"
                          checked={eq.equipamentoOrigem === 'cliente'}
                          onChange={() => {
                            atualizarEquipamentos(
                              (form.equipamentos || []).map((item) =>
                                item.uid === eq.uid
                                  ? {
                                      ...item,
                                      equipamentoOrigem: 'cliente' as const,
                                      equipamentoId: '',
                                      numeroMaquina: '',
                                      maquinaModelo: '',
                                    }
                                  : item
                              )
                            )
                          }}
                        />
                        <span className="relatorio-equipamento-card__origem-radio-mark" aria-hidden="true" />
                        <span>{t.relatorioEquipOrigemCliente || 'Cliente — equipamentos do cadastro'}</span>
                      </label>
                      <label className="relatorio-equipamento-card__origem-radio">
                        <input
                          type="radio"
                          name={`re-eq-origem-${eq.uid}`}
                          value="armazem"
                          checked={eq.equipamentoOrigem === 'armazem'}
                          onChange={() => {
                            atualizarEquipamentos(
                              (form.equipamentos || []).map((item) =>
                                item.uid === eq.uid
                                  ? {
                                      ...item,
                                      equipamentoOrigem: 'armazem' as const,
                                      equipamentoId: '',
                                      numeroMaquina: '',
                                      maquinaModelo: '',
                                    }
                                  : item
                              )
                            )
                          }}
                        />
                        <span className="relatorio-equipamento-card__origem-radio-mark" aria-hidden="true" />
                        <span>{t.relatorioEquipOrigemArmazem || 'Armazém — biblioteca de equipamentos'}</span>
                      </label>
                    </div>
                  </div>

                  <div className="relatorio-equipamento-card__field--full">
                    <label className="relatorio-equipamento-card__label">
                      {eq.equipamentoOrigem === 'armazem'
                        ? t.equipamentoArmazemRelatorio || 'Equipamento do armazém'
                        : t.equipamento || t.selecioneEquipamento || 'Equipamento'}
                    </label>
                    {eq.equipamentoOrigem === 'armazem' ? (
                      <select
                        value={eq.equipamentoId || ''}
                        onChange={(e) => {
                          const found = equipamentosAtivos.find((x) => x.id === e.target.value)
                          atualizarEquipamentos(
                            (form.equipamentos || []).map((item) =>
                              item.uid === eq.uid
                                ? {
                                    ...item,
                                    equipamentoOrigem: 'armazem' as const,
                                    equipamentoId: found?.id || '',
                                    numeroMaquina: found?.numeroSerie || '',
                                    maquinaModelo: found ? `${found.modelo} ${found.marca}`.trim() : '',
                                  }
                                : item
                            )
                          )
                        }}
                        className="relatorio-equipamento-card__select relatorio-equipamento-card__select--blue"
                      >
                        <option value="">{t.selecioneEquipamentoArmazem || 'Selecione equipamento do armazém'}</option>
                        {equipamentosAtivos.map((itemEq) => (
                          <option key={itemEq.id} value={itemEq.id}>
                            [Armazém] ID {itemEq.id} · {itemEq.modelo} {itemEq.marca}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={
                          clienteIdEfetivo
                            ? resolverChaveEquipamentoClienteRelatorio(
                                eq.equipamentoId || '',
                                clienteEquipamentos,
                                equipamentosArmazem
                              )
                            : eq.equipamentoId || ''
                        }
                        onChange={(e) => {
                          const chave = e.target.value
                          const selectedEquipamento = clienteEquipamentos.find(
                            (itemCli, idxCli) => resolverIdEquipamentoCliente(itemCli, idxCli) === chave
                          )
                          const idVisivel = selectedEquipamento
                            ? resolverIdEquipamentoVisivelCliente(selectedEquipamento, equipamentosArmazem)
                            : chave
                          atualizarEquipamentos(
                            (form.equipamentos || []).map((item) =>
                              item.uid === eq.uid
                                ? {
                                    ...item,
                                    equipamentoOrigem: 'cliente' as const,
                                    equipamentoId: idVisivel || chave,
                                    numeroMaquina: selectedEquipamento?.numeroSerie || '',
                                    maquinaModelo: selectedEquipamento
                                      ? `${selectedEquipamento.modelo} ${selectedEquipamento.marca}`.trim()
                                      : '',
                                  }
                                : item
                            )
                          )
                        }}
                        className="relatorio-equipamento-card__select"
                        disabled={!clienteIdEfetivo}
                      >
                        <option value="">{t.selecioneEquipamento || 'Selecione o equipamento'}</option>
                        {clienteIdEfetivo &&
                          clienteEquipamentos.map((itemCli, idxCli) => {
                            const eqKey = resolverIdEquipamentoCliente(itemCli, idxCli)
                            const idVisivel = resolverIdEquipamentoVisivelCliente(itemCli, equipamentosArmazem)
                            return (
                              <option key={eqKey} value={eqKey}>
                                ID {idVisivel || eqKey} · {itemCli.modelo} {itemCli.marca}
                              </option>
                            )
                          })}
                      </select>
                    )}
                  </div>

                  <div className="relatorio-equipamento-card__field--full">
                    <label className="relatorio-equipamento-card__label relatorio-equipamento-card__label--id">
                      {t.relatorioEquipamentoIdLabel || 'ID do equipamento'}
                    </label>
                    <input
                      type="text"
                      value={eq.equipamentoId || ''}
                      placeholder={t.relatorioEquipamentoIdPlaceholder || 'ID interno, armazém ou n.º série'}
                      onChange={(e) => {
                        atualizarEquipamentos(
                          (form.equipamentos || []).map((item) =>
                            item.uid === eq.uid ? { ...item, equipamentoId: e.target.value.trim() } : item
                          )
                        )
                      }}
                      className="relatorio-equipamento-card__input relatorio-equipamento-card__input--id"
                    />
                  </div>

                  <div>
                    <label className="relatorio-equipamento-card__label">{t.modelo || 'Modelo'}</label>
                    <input
                      type="text"
                      value={eq.maquinaModelo}
                      onChange={(e) => {
                        atualizarEquipamentos(
                          (form.equipamentos || []).map((item) =>
                            item.uid === eq.uid ? { ...item, maquinaModelo: e.target.value } : item
                          )
                        )
                      }}
                      className="relatorio-equipamento-card__input"
                    />
                  </div>
                  <div>
                    <label className="relatorio-equipamento-card__label">S/N</label>
                    <input
                      type="text"
                      value={eq.numeroMaquina}
                      onChange={(e) => {
                        atualizarEquipamentos(
                          (form.equipamentos || []).map((item) =>
                            item.uid === eq.uid ? { ...item, numeroMaquina: e.target.value } : item
                          )
                        )
                      }}
                      className="relatorio-equipamento-card__input"
                    />
                  </div>

                  {(eq.equipamentoId || eq.maquinaModelo) && (
                    <div className="relatorio-equipamento-card__preview relatorio-equipamento-card__field--full">
                      <strong>{t.relatorioEquipamentoIdLabel || 'ID'}:</strong>{' '}
                      <span className="relatorio-equipamento-card__id">
                        {resolverEquipamentoRelatorioParaExibicao(eq, equipamentosArmazem, clienteEquipamentos) || '—'}
                      </span>
                      {eq.maquinaModelo ? (
                        <>
                          <span className="relatorio-equipamento-card__sep"> · </span>
                          <strong>{t.maquinaModelo || 'Modelo'}:</strong> {eq.maquinaModelo}
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="relatorio-equipamentos-block__head">
          <h3 style={{ margin: 0 }}>{t.diasTrabalho || 'Dias de trabalho'}</h3>
          <button type="button" className="btn-secondary relatorio-equipamentos-block__add" onClick={adicionarDia}>
            + {t.adicionarDia || 'Adicionar dia'}
          </button>
        </div>
        {diasOrdenados.map((dia) => {
          const diaCalc = atualizarCalculosDiaEspecial(dia)
          const aberto = diaExpandido === dia.id
          const resumoHoras = (diaCalc.horasPorEquipamento || [])
            .filter((h) => h.equipamentoUid && h.horasDuracao)
            .map((h) => {
              const eq = form.equipamentos?.find((e) => e.uid === h.equipamentoUid)
              const idx = eq ? form.equipamentos!.indexOf(eq) : 0
              return `${eq ? labelEquipamentoCurto(eq, idx) : '?'}: ${h.horasDuracao}`
            })
            .join(' · ')
          return (
            <div key={dia.id} className="relatorio-especial-dia-card">
              <button
                type="button"
                className="relatorio-especial-dia-card__toggle"
                onClick={() => setDiaExpandido(aberto ? null : dia.id)}
              >
                <strong>{formatDiaCurtoPt(dia.data)}</strong>
                {resumoHoras ? ` — ${resumoHoras}` : ''}
                <span className="relatorio-especial-dia-card__chevron">{aberto ? '▲' : '▼'}</span>
              </button>
              {aberto && (
                <div className="relatorio-especial-dia-card__body">
                  <div style={{ marginBottom: 16 }}>
                    <label>{t.data || 'Data'}</label>
                    <input
                      type="date"
                      value={diaTrabalhoDataInput(dia.data)}
                      onChange={(e) => actualizarDia(dia.id, { data: e.target.value })}
                      style={{ ...inputStyle, maxWidth: 220 }}
                      className="ns-datetime-input"
                    />
                  </div>

                  <div className="relatorio-especial-dia-secao">
                    <h4 className="relatorio-especial-dia-secao__titulo">
                      🕐 {t.horariosIda || 'Ida ao cliente'}
                    </h4>
                    <div className="relatorio-especial-dia-secao__grid">
                      <div>
                        <label>{t.saida || 'Saída'}</label>
                        <input
                          type="time"
                          className="ns-datetime-input"
                          value={dia.idaHora}
                          onChange={(e) => actualizarDia(dia.id, { idaHora: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>{t.chegada || 'Chegada'}</label>
                        <input
                          type="time"
                          className="ns-datetime-input"
                          value={dia.idaChegada}
                          onChange={(e) => actualizarDia(dia.id, { idaChegada: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>{t.duracao || 'Duração'}</label>
                        <input type="text" readOnly value={diaCalc.idaDuracao || '—'} style={{ ...inputStyle, opacity: 0.85 }} />
                      </div>
                    </div>
                  </div>

                  <div className="relatorio-especial-dia-secao">
                    <h4 className="relatorio-especial-dia-secao__titulo">
                      🕐 {t.horarioServico || 'Hora trabalhada'} ({t.relatorioEspecialHorasPorEquipamento || 'por equipamento'}) — máx.{' '}
                      {MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_DIA}/dia
                    </h4>
                    <p className="relatorio-especial-dia-secao__ajuda">
                      {t.relatorioEspecialHoraCorridaAjuda ||
                        'Indique início e fim (hora corrida). O total líquido desconta a hora de almoço abaixo.'}
                    </p>
                    {(dia.horasPorEquipamento || []).map((linha, li) => {
                      const linhaCalc = diaCalc.horasPorEquipamento?.[li] || linha
                      return (
                        <div key={li} className="relatorio-especial-hora-eq-linha">
                          <div>
                            <label>{t.equipamento || 'Equipamento'}</label>
                            <select
                              value={linha.equipamentoUid}
                              onChange={(e) => {
                                const v = e.target.value
                                setForm((prev) => ({
                                  ...prev,
                                  diasTrabalho: prev.diasTrabalho!.map((d) =>
                                    d.id === dia.id
                                      ? atualizarCalculosDiaEspecial({
                                          ...d,
                                          horasPorEquipamento: d.horasPorEquipamento.map((h, hi) =>
                                            hi === li ? { ...h, equipamentoUid: v } : h
                                          ),
                                        })
                                      : d
                                  ),
                                }))
                              }}
                              style={inputStyle}
                            >
                              <option value="">—</option>
                              {(form.equipamentos || []).map((eq, ei) => (
                                <option key={eq.uid} value={eq.uid}>
                                  {labelEquipamentoCurto(eq, ei)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label>{t.inicio || 'Início'}</label>
                            <input
                              type="time"
                              className="ns-datetime-input"
                              value={linha.horasInicio}
                              onChange={(e) => {
                                const v = e.target.value
                                setForm((prev) => ({
                                  ...prev,
                                  diasTrabalho: prev.diasTrabalho!.map((d) =>
                                    d.id === dia.id
                                      ? atualizarCalculosDiaEspecial({
                                          ...d,
                                          horasPorEquipamento: d.horasPorEquipamento.map((h, hi) =>
                                            hi === li ? { ...h, horasInicio: v } : h
                                          ),
                                        })
                                      : d
                                  ),
                                }))
                              }}
                            />
                          </div>
                          <div>
                            <label>{t.fim || 'Fim'}</label>
                            <input
                              type="time"
                              className="ns-datetime-input"
                              value={linha.horasFim}
                              onChange={(e) => {
                                const v = e.target.value
                                setForm((prev) => ({
                                  ...prev,
                                  diasTrabalho: prev.diasTrabalho!.map((d) =>
                                    d.id === dia.id
                                      ? atualizarCalculosDiaEspecial({
                                          ...d,
                                          horasPorEquipamento: d.horasPorEquipamento.map((h, hi) =>
                                            hi === li ? { ...h, horasFim: v } : h
                                          ),
                                        })
                                      : d
                                  ),
                                }))
                              }}
                            />
                          </div>
                          <div>
                            <label>{t.total || 'Total líquido'}</label>
                            <input type="text" readOnly value={linhaCalc.horasDuracao || '—'} style={{ ...inputStyle, opacity: 0.85 }} />
                          </div>
                          <button
                            type="button"
                            className="btn-danger btn-danger--inline"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                diasTrabalho: prev.diasTrabalho!.map((d) =>
                                  d.id === dia.id
                                    ? atualizarCalculosDiaEspecial({
                                        ...d,
                                        horasPorEquipamento: d.horasPorEquipamento.filter((_, hi) => hi !== li),
                                      })
                                    : d
                                ),
                              }))
                            }
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                    {(dia.horasPorEquipamento?.length || 0) < MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_DIA && (
                      <button
                        type="button"
                        className="btn-secondary relatorio-equipamentos-block__add"
                        style={{ marginTop: 8 }}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            diasTrabalho: prev.diasTrabalho!.map((d) =>
                              d.id === dia.id
                                ? atualizarCalculosDiaEspecial({
                                    ...d,
                                    horasPorEquipamento: [...d.horasPorEquipamento, criarHorasEquipamentoDiaVazio()],
                                  })
                                : d
                            ),
                          }))
                        }
                      >
                        + {t.relatorioEspecialLinhaEquipamento || 'Linha equipamento'}
                      </button>
                    )}
                  </div>

                  <div className="relatorio-especial-dia-secao">
                    <h4 className="relatorio-especial-dia-secao__titulo">
                      🕐 {t.horariosRetorno || 'Saída do cliente'}
                    </h4>
                    <div className="relatorio-especial-dia-secao__grid">
                      <div>
                        <label>{t.saida || 'Saída'}</label>
                        <input
                          type="time"
                          className="ns-datetime-input"
                          value={dia.retornoSaida}
                          onChange={(e) => actualizarDia(dia.id, { retornoSaida: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>{t.chegada || 'Chegada'}</label>
                        <input
                          type="time"
                          className="ns-datetime-input"
                          value={dia.retornoChegada}
                          onChange={(e) => actualizarDia(dia.id, { retornoChegada: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>{t.duracao || 'Duração'}</label>
                        <input type="text" readOnly value={diaCalc.retornoDuracao || '—'} style={{ ...inputStyle, opacity: 0.85 }} />
                      </div>
                    </div>
                  </div>

                  <div className="relatorio-especial-dia-secao">
                    <h4 className="relatorio-especial-dia-secao__titulo">☕ {t.horaAlmoco || t.tempoPausa || 'Hora de almoço'}</h4>
                    <div className="relatorio-especial-dia-secao__grid relatorio-especial-dia-secao__grid--almoco">
                      <div>
                        <label>{t.tempoPausa || 'Tempo (HH:MM)'}</label>
                        <input
                          type="time"
                          className="ns-datetime-input"
                          value={dia.tempoPausa || ''}
                          onChange={(e) => actualizarDia(dia.id, { tempoPausa: e.target.value, pausa: e.target.value ? 'sim' : '' })}
                        />
                      </div>
                    </div>
                    <p className="relatorio-especial-dia-secao__ajuda">
                      {t.tempoPausaDescricao || 'Ex.: 01:00 desconta 1 hora do total trabalhado (hora corrida menos almoço).'}
                    </p>
                  </div>

                  <div className="relatorio-especial-dia-secao">
                    <h4 className="relatorio-especial-dia-secao__titulo">🚗 {t.quilometragem || 'Quilometragem'}</h4>
                    <div className="relatorio-especial-dia-secao__grid">
                      <div>
                        <label>{t.kmIda || 'KM ida'}</label>
                        <input type="text" value={dia.kmIda} onChange={(e) => actualizarDia(dia.id, { kmIda: e.target.value })} style={inputStyle} />
                      </div>
                      <div>
                        <label>{t.kmVolta || 'KM retorno'}</label>
                        <input type="text" value={dia.kmRetorno} onChange={(e) => actualizarDia(dia.id, { kmRetorno: e.target.value })} style={inputStyle} />
                      </div>
                      <div>
                        <label>{t.kmTotal || 'KM total'}</label>
                        <input type="text" readOnly value={diaCalc.kmTotal || '0'} style={{ ...inputStyle, opacity: 0.85 }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label>{t.descricaoTrabalho || 'Descrição'}</label>
                    <textarea
                      value={dia.descricaoTrabalho}
                      onChange={(e) => actualizarDia(dia.id, { descricaoTrabalho: e.target.value })}
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-danger btn-danger--inline"
                    style={{ marginTop: 12 }}
                    onClick={() => {
                      if (!window.confirm(t.confirmDelete || 'Remover este dia?')) return
                      setForm((prev) => ({
                        ...prev,
                        diasTrabalho: prev.diasTrabalho!.filter((d) => d.id !== dia.id),
                      }))
                    }}
                  >
                    {t.removerDia || 'Remover dia'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </section>

      <section
        style={{
          marginBottom: 24,
          padding: 16,
          border: '1px solid rgba(0,200,83,0.35)',
          borderRadius: 10,
          background: 'rgba(0,40,24,0.3)',
        }}
      >
        <h3 style={{ marginTop: 0 }}>{t.resumo || 'Resumo'}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {(form.equipamentos || []).map((eq, i) => (
            <div key={eq.uid}>
              <div style={{ fontSize: 12, color: '#aaa' }}>{labelEquipamentoCurto(eq, i)}</div>
              <strong>{formComTotais.horasPorEquipamentoResumo?.[eq.uid] || '0:00'}</strong>
            </div>
          ))}
          <div>
            <div style={{ fontSize: 12, color: '#aaa' }}>{t.relatorioEspecialTotalGeral || 'Total geral'}</div>
            <strong style={{ fontSize: 18, color: '#00c853' }}>{formComTotais.horasTrabalho}</strong>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#aaa' }}>KM</div>
            <strong>{formComTotais.kmsPercorridos}</strong>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <label>{t.observacoes || 'Observações'}</label>
        <textarea
          value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </section>

      <div className="relatorio-especial-form__actions">
        <button type="button" className="btn-primary" disabled={salvando} onClick={persistir}>
          {salvando ? '…' : t.save || 'Guardar'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => imprimirRelatorioEspecialPdf(formComTotais)}>
          🖨 PDF
        </button>
      </div>
    </div>
  )
}

function diaTrabalhoDataInput(data: string): string {
  if (!data) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data
  if (data.includes('T')) return data.slice(0, 10)
  return data
}

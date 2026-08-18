'use client'

import { useCallback, useEffect, useMemo, useRef, useState, Fragment as ReactFragment } from 'react'
import { ClienteAlfabetoPicker } from './ClienteAlfabetoPicker'
import type { ClienteAlfabetoRow } from '../lib/clienteAlfabetoBusca'
import {
  aplicarTotaisNoRelatorioEspecial,
  atualizarCalculosDiaEspecial,
  calcularTotaisRelatorioEspecial,
  coletarSessoesPorEquipamento,
  formatDiaComDiaSemana,
  formatDiaCurtoPt,
  formatMinutosComoHHMM,
  getDiaSemanaInfo,
  minutosDeDuracaoHHMM,
  minutosAlmocoDia,
  resumoHorasTrabalhoDia,
  sortDiasTrabalhoEspecialCronologicamente,
  diaTrabalhoDataChaveOrdenacao,
} from '../lib/relatorioEspecialCalculos'
import { DocumentoEnvioAcoes } from './DocumentoEnvioAcoes'
import {
  buildTextoEnvioRelatorioEspecial,
  buildAssuntoEnvioRelatorioServico,
  type AbrirEnvioDocumentoClienteOpts,
} from '../context/DocumentoEnvioClienteContext'
import { imprimirRelatorioEspecialPdf } from '../modules/relatorios-especiais'
import { dataLocalHojeISO } from '../lib/relatorioEspecialShared'
import {
  criarDiaTrabalhoEspecialVazio,
  criarHorasEquipamentoDiaVazio,
  criarRelatorioEspecialVazio,
  MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_DIA,
  MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_MES,
  MAX_LINHAS_HORAS_RELATORIO_ESPECIAL_DIA,
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
  pdfLogoHtml?: string
  empresaNome?: string
  abrirEnvioDocumentoCliente?: (opts: AbrirEnvioDocumentoClienteOpts) => void
  /** Abre a aba de fechamento para cobrança (mesmo padrão do relatório de serviço). */
  onAbrirFechamentoCobranca?: (relatorioId: string, numero: string) => void
  getResumoCobrancaFase?: (relatorioId: string) => 'laranja' | 'azul' | 'verde' | 'biblioteca'
  onClickResumoCobranca?: (relatorioId: string) => void
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

function classNameResumoCobrancaEspecial(fase: 'laranja' | 'azul' | 'verde' | 'biblioteca'): string {
  if (fase === 'biblioteca') return 'relatorio-resumo-cobranca-wrap--biblioteca'
  if (fase === 'verde') return 'relatorio-resumo-cobranca-wrap--verde'
  if (fase === 'azul') return 'relatorio-resumo-cobranca-wrap--azul'
  return 'relatorio-resumo-cobranca-wrap--laranja'
}

function localeUiFromLang(lang: string): string {
  const map: Record<string, string> = {
    'pt-BR': 'pt-BR',
    es: 'es',
    fr: 'fr',
    it: 'it',
    de: 'de',
    en: 'en',
  }
  return map[lang] || 'pt-BR'
}

function labelResumoCobrancaEspecial(
  fase: 'laranja' | 'azul' | 'verde' | 'biblioteca',
  t: Record<string, string | undefined>
): string {
  if (fase === 'biblioteca') return t.resumoCobrancaEstadoBiblioteca || 'Na biblioteca'
  if (fase === 'verde') return t.resumoCobrancaEstadoNao || 'Não cobrar'
  if (fase === 'azul') return t.resumoCobrancaEstadoSim || 'Cobrar'
  return t.resumoCobrancaEstadoPendente || 'Decidir cobrança'
}

const RASCUNHO_ESPECIAL_KEY = 'nonato-relatorio-especial-rascunho'

function lerRascunhoEspecial(): RelatorioEspecial | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(RASCUNHO_ESPECIAL_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as RelatorioEspecial
    if (!p || typeof p !== 'object' || !p.id) return null
    return p
  } catch {
    return null
  }
}

function gravarRascunhoEspecial(rel: RelatorioEspecial): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(RASCUNHO_ESPECIAL_KEY, JSON.stringify(rel))
  } catch {
    /* quota */
  }
}

function limparRascunhoEspecial(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(RASCUNHO_ESPECIAL_KEY)
  } catch {
    /* ignorar */
  }
}

function rascunhoEspecialTemConteudo(rel: RelatorioEspecial): boolean {
  const eqs = (rel.equipamentos || []).filter((e) => e.equipamentoId || e.maquinaModelo || e.numeroMaquina)
  const dias = rel.diasTrabalho || []
  return Boolean(rel.cliente?.trim() || rel.tecnico?.trim() || eqs.length > 0 || dias.length > 0)
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
  pdfLogoHtml = '',
  empresaNome = 'Nonato Service',
  abrirEnvioDocumentoCliente,
  onAbrirFechamentoCobranca,
  getResumoCobrancaFase,
  onClickResumoCobranca,
}: RelatorioEspecialHubProps) {
  const t = labels
  const uiLocale = localeUiFromLang(selectedLanguage)
  const pdfOpts = useMemo(
    () => ({ labels: t, logoHtml: pdfLogoHtml, empresaNome, lang: selectedLanguage }),
    [t, pdfLogoHtml, empresaNome, selectedLanguage]
  )
  const ultimoRelPdfRef = useRef<RelatorioEspecial | null>(null)
  const envioRelatorio = useCallback(
    (rel: RelatorioEspecial, onOpenPdf: () => void) => ({
      title: t.envioRelatorioTitulo || 'Enviar relatório ao cliente',
      subject: buildAssuntoEnvioRelatorioServico(
        { numero: rel.numero, cliente: rel.cliente },
        t as Record<string, string | undefined>
      ),
      body: buildTextoEnvioRelatorioEspecial(
        {
          numero: rel.numero,
          cliente: rel.cliente,
          data: rel.data,
          horasTrabalho: aplicarTotaisNoRelatorioEspecial(rel).horasTrabalho,
          kmsPercorridos: aplicarTotaisNoRelatorioEspecial(rel).kmsPercorridos,
          equipamentos: rel.equipamentos,
        },
        t as Record<string, string | undefined>
      ),
      clienteId: rel.clienteId,
      clienteNome: rel.cliente,
      relatorio: rel,
      onOpenPdf,
    }),
    [t]
  )
  const imprimirPdf = useCallback(
    (rel: RelatorioEspecial) => {
      ultimoRelPdfRef.current = aplicarTotaisNoRelatorioEspecial(rel)
      imprimirRelatorioEspecialPdf(rel, pdfOpts)
    },
    [pdfOpts]
  )

  useEffect(() => {
    if (!abrirEnvioDocumentoCliente) return
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type !== 'reEspecialEnvio') return
      const rel = ultimoRelPdfRef.current
      if (!rel) return
      const channel = e.data.channel === 'whatsapp' ? 'whatsapp' : 'email'
      abrirEnvioDocumentoCliente({
        ...envioRelatorio(rel, () => imprimirPdf(rel)),
        defaultChannel: channel,
      })
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [abrirEnvioDocumentoCliente, envioRelatorio, imprimirPdf])
  const EnvioBotoes = ({
    rel,
    compact = false,
  }: {
    rel: RelatorioEspecial
    compact?: boolean
  }) =>
    abrirEnvioDocumentoCliente ? (
      <DocumentoEnvioAcoes
        abrirEnvio={abrirEnvioDocumentoCliente}
        {...envioRelatorio(rel, () => imprimirPdf(aplicarTotaisNoRelatorioEspecial(rel)))}
        emailLabel={t.enviarPorEmail || 'E-mail'}
        whatsLabel={t.enviarPorWhatsApp || 'WhatsApp'}
        compact={compact}
      />
    ) : null
  const [modo, setModo] = useState<'lista' | 'form' | 'fechamento'>('lista')
  const [form, setForm] = useState<RelatorioEspecial>(() => criarRelatorioEspecialVazio())
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [diaExpandido, setDiaExpandido] = useState<string | null>(null)
  /** Uids dos cartões de equipamento abertos (expandir / retrair detalhes). */
  const [equipExpandidos, setEquipExpandidos] = useState<Set<string>>(() => new Set())
  const [salvando, setSalvando] = useState(false)
  /** 'eliminar' = não mostrar textos de «guardar» durante a exclusão */
  const [acaoEmCurso, setAcaoEmCurso] = useState<'guardar' | 'eliminar' | null>(null)
  const [recuperando, setRecuperando] = useState(false)
  const snapshotGuardadoRef = useRef('')
  const rascunhoOferecidoRef = useRef(false)

  const formComTotais = useMemo(() => aplicarTotaisNoRelatorioEspecial(form), [form])

  const marcarSnapshot = useCallback((rel: RelatorioEspecial) => {
    snapshotGuardadoRef.current = JSON.stringify(aplicarTotaisNoRelatorioEspecial(rel))
  }, [])

  const formTemAlteracoes = useCallback(() => {
    return JSON.stringify(formComTotais) !== snapshotGuardadoRef.current
  }, [formComTotais])

  const voltarLista = useCallback(() => {
    if (modo !== 'lista' && formTemAlteracoes()) {
      const msg =
        t.relatorioEspecialSairSemGuardar ||
        'Tem alterações por guardar. Sair mesmo assim? (clique em Guardar para não perder)'
      if (!window.confirm(msg)) return
    }
    setModo('lista')
    setEditandoId(null)
    setDiaExpandido(null)
  }, [modo, formTemAlteracoes, t])

  const totais = useMemo(() => calcularTotaisRelatorioEspecial(form.diasTrabalho), [form.diasTrabalho])
  const sessoesPorEquip = useMemo(
    () => coletarSessoesPorEquipamento(form.diasTrabalho),
    [form.diasTrabalho]
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
    marcarSnapshot(vazio)
    setEditandoId(null)
    setModo('form')
    setDiaExpandido(null)
    setEquipExpandidos(new Set())
  }, [preverNumero, marcarSnapshot])

  /** Novo relatório: mantém data e número alinhados ao dia actual (meia-noite, regresso ao separador). */
  const sincronizarDataHojeNovoRelatorio = useCallback(() => {
    if (modo !== 'form' || editandoId) return
    const hoje = dataLocalHojeISO()
    const ontem = dataLocalHojeISO(new Date(Date.now() - 86_400_000))
    setForm((prev) => {
      if (prev.data === hoje) return prev
      // Actualiza só se a data era «hoje» ou «ontem» (passou meia-noite) — não sobrescreve datas antigas escolhidas à mão
      if (prev.data !== ontem && prev.data !== hoje) return prev
      return {
        ...prev,
        data: hoje,
        numero: preverNumero(hoje),
      }
    })
  }, [modo, editandoId, preverNumero])

  useEffect(() => {
    sincronizarDataHojeNovoRelatorio()
  }, [sincronizarDataHojeNovoRelatorio])

  useEffect(() => {
    if (modo !== 'form' || editandoId) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') sincronizarDataHojeNovoRelatorio()
    }
    const onFocus = () => sincronizarDataHojeNovoRelatorio()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    const id = window.setInterval(sincronizarDataHojeNovoRelatorio, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
      window.clearInterval(id)
    }
  }, [modo, editandoId, sincronizarDataHojeNovoRelatorio])

  /** Rascunho automático — sobrevive a atualização PWA / fecho acidental. */
  useEffect(() => {
    if (modo !== 'form' && modo !== 'fechamento') return
    if (!rascunhoEspecialTemConteudo(formComTotais)) return
    const id = window.setTimeout(() => gravarRascunhoEspecial(formComTotais), 400)
    return () => window.clearTimeout(id)
  }, [modo, formComTotais])

  useEffect(() => {
    if (rascunhoOferecidoRef.current || modo !== 'lista') return
    rascunhoOferecidoRef.current = true
    const draft = lerRascunhoEspecial()
    if (!draft || !rascunhoEspecialTemConteudo(draft)) return
    const jaGuardado = relatorios.some((r) => String(r.id) === String(draft.id))
    const msg = jaGuardado
      ? t.relatorioEspecialRascunhoContinuar ||
        'Há um rascunho deste relatório especial. Quer continuar a editar?'
      : t.relatorioEspecialRascunhoRecuperar ||
        'Encontrámos um rascunho do relatório especial (pode ser o de hoje). Quer recuperá-lo?'
    if (!window.confirm(msg)) return
    setForm({
      ...draft,
      equipamentos: [...(draft.equipamentos || [])],
      diasTrabalho: [...(draft.diasTrabalho || [])],
    })
    marcarSnapshot(draft)
    setEditandoId(jaGuardado ? draft.id : null)
    setModo('form')
    setDiaExpandido(null)
    setEquipExpandidos(new Set())
  }, [modo, relatorios, t, marcarSnapshot])

  const abrirEditar = useCallback(
    (rel: RelatorioEspecial) => {
      const copia = {
        ...rel,
        equipamentos: [...(rel.equipamentos || [])],
        diasTrabalho: [...(rel.diasTrabalho || [])],
      }
      setForm(copia)
      marcarSnapshot(copia)
      setEditandoId(rel.id)
      setModo('form')
      setDiaExpandido(null)
      setEquipExpandidos(new Set())
    },
    [marcarSnapshot]
  )

  const abrirFechamento = useCallback(
    (rel: RelatorioEspecial) => {
      const prep = aplicarTotaisNoRelatorioEspecial(rel)
      setForm(prep)
      marcarSnapshot(prep)
      setEditandoId(rel.id)
      setModo('fechamento')
    },
    [marcarSnapshot]
  )

  const eliminarRelatorio = useCallback(
    async (rel: RelatorioEspecial) => {
      const base =
        t.relatorioEspecialConfirmarEliminar ||
        'Eliminar este relatório especial? Esta ação não pode ser desfeita.'
      const msg = `${base}\n\n${rel.numero || ''} — ${rel.cliente || ''}`.trim()
      if (!window.confirm(msg)) return
      setAcaoEmCurso('eliminar')
      setSalvando(true)
      try {
        const rid = String(rel.id || '').trim()
        const rnum = String(rel.numero || '').trim()
              // Só eliminar por id — nunca por número (evita apagar outro relatório do mesmo dia).
        const lista = relatorios.filter((r) => {
          const id = String(r.id || '').trim()
          if (rid && id === rid) return false
          return true
        })
        const ok = await onSaveAll(lista)
        if (ok) {
          alert(t.relatorioEspecialEliminado || 'Relatório especial eliminado.')
          if (editandoId === rel.id || (rnum && String(form.numero || '').trim() === rnum)) {
            // Após eliminar: sair sem perguntar «alterações por guardar».
            setModo('lista')
            setEditandoId(null)
            setDiaExpandido(null)
          }
        }
      } finally {
        setSalvando(false)
        setAcaoEmCurso(null)
      }
    },
    [relatorios, onSaveAll, t, editandoId, form.numero]
  )

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
    setAcaoEmCurso('guardar')
    setSalvando(true)
    try {
      const preparado = aplicarTotaisNoRelatorioEspecial({ ...form, equipamentos: equipamentosOk })
      const lista = editandoId
        ? relatorios.map((r) => (r.id === editandoId ? preparado : r))
        : [...relatorios, preparado]
      const ok = await onSaveAll(lista)
      if (ok) {
        limparRascunhoEspecial()
        marcarSnapshot(preparado)
        alert(t.saveSuccess || 'Relatório especial guardado.')
        setModo('lista')
        setEditandoId(null)
      } else {
        alert(t.erroSalvar || 'Não foi possível guardar. Verifique a ligação e tente novamente.')
      }
    } finally {
      setSalvando(false)
      setAcaoEmCurso(null)
    }
  }, [form, editandoId, relatorios, onSaveAll, t, marcarSnapshot])

  const adicionarEquipamento = () => {
    if ((form.equipamentos?.length || 0) >= MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_MES) {
      alert(
        t.relatorioEspecialMaxEquipamentosMes ||
          `Máximo ${MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_MES} equipamentos por relatório (mês).`
      )
      return
    }
    const novo = criarEquipamentoRelatorioVazio('cliente')
    atualizarEquipamentos([...(form.equipamentos || []), novo])
    setEquipExpandidos((prev) => new Set(prev).add(novo.uid))
  }

  const toggleEquipExpandido = (uid: string) => {
    setEquipExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  const expandirTodosEquipamentos = () => {
    setEquipExpandidos(new Set((form.equipamentos || []).map((e) => e.uid)))
  }

  const retrairTodosEquipamentos = () => {
    setEquipExpandidos(new Set())
  }

  const adicionarDia = () => {
    const data = dataLocalHojeISO()
    const dia = criarDiaTrabalhoEspecialVazio(data)
    setForm((prev) => ({
      ...prev,
      diasTrabalho: sortDiasTrabalhoEspecialCronologicamente([...(prev.diasTrabalho || []), dia]),
    }))
    setDiaExpandido(dia.id)
  }

  const abrirEditarDia = (diaId: string) => {
    setDiaExpandido(diaId)
    setTimeout(() => {
      document.getElementById(`re-dia-card-${diaId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const actualizarDia = (diaId: string, patch: Partial<DiaTrabalhoEspecial>) => {
    setForm((prev) => ({
      ...prev,
      diasTrabalho: sortDiasTrabalhoEspecialCronologicamente(
        (prev.diasTrabalho || []).map((d) => {
          if (d.id !== diaId) return d
          const merged = { ...d, ...patch }
          if (patch.data != null) {
            const key = diaTrabalhoDataChaveOrdenacao(patch.data)
            if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) merged.data = key
          }
          return atualizarCalculosDiaEspecial(merged)
        })
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
    setAcaoEmCurso('guardar')
    setSalvando(true)
    try {
      const preparado = aplicarTotaisNoRelatorioEspecial(form)
      const lista = relatorios.map((r) => (r.id === preparado.id ? preparado : r))
      const ok = await onSaveAll(lista)
      if (ok) {
        marcarSnapshot(preparado)
        alert(t.relatorioEspecialFechamentoGuardado || 'Fechamento guardado.')
        setModo('lista')
      } else {
        alert(t.erroSalvar || 'Não foi possível guardar o fechamento.')
      }
    } finally {
      setSalvando(false)
      setAcaoEmCurso(null)
    }
  }

  if (modo === 'lista') {
    return (
      <div className="relatorio-especial-hub" style={{ padding: '16px 0' }}>
        <div className="relatorio-especial-hub__head">
          <h2 style={{ margin: 0, flex: '1 1 200px' }}>
            {t.relatorioEspecialTitle || 'RELATÓRIOS ESPECIAIS'}
          </h2>
          <button
            type="button"
            className="btn-secondary"
            disabled={recuperando || salvando}
            onClick={() => {
              void (async () => {
                setRecuperando(true)
                try {
                  const { recoverRelatoriosEspeciaisAggressive } = await import('../utils/cadastroSafety')
                  const { loadFromServer } = await import('../utils/dataStorage')
                  let serverList: unknown = null
                  try {
                    serverList = await loadFromServer('nonato-relatorios-especiais')
                  } catch {
                    serverList = null
                  }

                  let result = await recoverRelatoriosEspeciaisAggressive({
                    serverList: serverList ?? undefined,
                    resurrectTombstones: false,
                  })

                  if (result.blockedByTombstone > 0) {
                    const okRes =
                      window.confirm(
                        (
                          t.relatorioEspecialConfirmarRessuscitar ||
                          'Encontrámos {n} relatório(s) marcados como eliminados neste aparelho. Quer repô-los na lista?'
                        ).replace('{n}', String(result.blockedByTombstone))
                      )
                    if (okRes) {
                      result = await recoverRelatoriosEspeciaisAggressive({
                        serverList: serverList ?? undefined,
                        resurrectTombstones: true,
                      })
                    }
                  }

                  const draft = lerRascunhoEspecial()
                  if (draft && rascunhoEspecialTemConteudo(draft)) {
                    const ja = relatorios.some((r) => String(r.id) === String(draft.id))
                    if (!ja) {
                      const ok = await onSaveAll([...relatorios, aplicarTotaisNoRelatorioEspecial(draft)])
                      if (ok) {
                        limparRascunhoEspecial()
                        alert(
                          t.relatorioEspecialRascunhoRecuperado ||
                            'Rascunho do relatório especial recuperado e guardado.'
                        )
                        return
                      }
                    } else {
                      setForm({
                        ...draft,
                        equipamentos: [...(draft.equipamentos || [])],
                        diasTrabalho: [...(draft.diasTrabalho || [])],
                      })
                      marcarSnapshot(draft)
                      setEditandoId(draft.id)
                      setModo('form')
                      alert(
                        t.relatorioEspecialRascunhoContinuar ||
                          'Há um rascunho deste relatório especial. A abrir para continuar.'
                      )
                      return
                    }
                  }

                  const totalRec = result.recovered + result.resurrectedFromTombstone
                  if (totalRec > 0) {
                    alert(
                      (t.relatorioEspecialRecuperadosDetalhe ||
                        'Recuperados: {n}. Fontes: local/backup {src}, servidor {srv}. Total na lista: {tot}.')
                        .replace('{n}', String(totalRec))
                        .replace('{src}', String(result.totalSources))
                        .replace(
                          '{srv}',
                          result.serverOk ? String(result.fromServer) : (t.offline || 'offline')
                        )
                        .replace('{tot}', String(result.totalAfter))
                    )
                    return
                  }

                  alert(
                    t.relatorioEspecialNadaRecuperarForcado ||
                      'Não há cópia deste relatório no servidor nem no backup deste telemóvel.\n\nIsto acontece se o relatório foi preenchido mas não chegou a clicar em GUARDAR antes da atualização.\n\nNesse caso não é possível recuperar — é preciso criar de novo o de hoje e clicar em Guardar.\n\nConfirme também em Relatórios de Serviço (o normal) se o de hoje está lá.'
                  )
                } finally {
                  setRecuperando(false)
                }
              })()
            }}
          >
            {recuperando
              ? t.relatorioEspecialARecuperar || 'A recuperar…'
              : t.relatorioEspecialRecuperar || 'Recuperar relatório'}
          </button>
          <button type="button" className="btn-primary relatorio-especial-hub__novo" onClick={abrirNovo}>
            ➕ {t.relatorioEspecialNovo || 'Novo relatório especial'}
          </button>
        </div>
        <p className="relatorio-especial-hub__desc">
          {t.relatorioEspecialDescricao ||
            'Um relatório por intervenção de fabricante — até 11 equipamentos no mês, até 4 por dia, com horas separadas por equipamento e fechamento mensal.'}
        </p>
        {relatorios.length === 0 ? (
          <p style={{ color: '#aaa' }}>{t.relatorioEspecialListaVazia || 'Nenhum relatório especial ainda.'}</p>
        ) : (
          <div className="relatorio-especial-hub__lista">
            {[...relatorios]
              .sort((a, b) => String(b.data).localeCompare(String(a.data)))
              .map((rel) => {
                const prep = aplicarTotaisNoRelatorioEspecial(rel)
                return (
                  <div key={rel.id} className="relatorio-especial-card">
                    <div className="relatorio-especial-card__meta">
                      <strong className="relatorio-especial-card__numero">{rel.numero}</strong>
                      <div className="relatorio-especial-card__linha">
                        {rel.cliente}
                        {rel.tecnico ? ` · ${rel.tecnico}` : ''}
                      </div>
                      <div className="relatorio-especial-card__sub">
                        {(rel.equipamentos?.length || 0)} {t.equipamentosTitulo || 'Equipamentos'}
                        {' · '}
                        {prep.horasTrabalho} {t.horasTrabalho || 'Horas'}
                        {' · '}
                        {prep.kmsPercorridos} {t.km || 'KM'}
                        {prep.fechamento?.totalGeral ? ` · ✓ ${t.fechado || 'Fechado'}` : ''}
                      </div>
                      {(onAbrirFechamentoCobranca || (getResumoCobrancaFase && onClickResumoCobranca)) && (
                        <div className="relatorio-especial-card__cobranca-bar" aria-label={t.relatorioEspecialFechamentoCobranca || 'Fechamento / Cobrança'}>
                          {onAbrirFechamentoCobranca ? (
                            <button
                              type="button"
                              className="btn-primary relatorio-especial-card__cobranca"
                              onClick={() => onAbrirFechamentoCobranca(rel.id, rel.numero)}
                              title={
                                t.relatorioEspecialFechamentoCobrancaDica ||
                                'Abrir fechamento para cobrança (valores HT/KM/diárias)'
                              }
                            >
                              💶 {t.relatorioEspecialFechamentoCobranca || 'Fechamento / Cobrança'}
                            </button>
                          ) : null}
                          {getResumoCobrancaFase && onClickResumoCobranca ? (
                            <button
                              type="button"
                              className={`relatorio-especial-card__resumo-chip ${classNameResumoCobrancaEspecial(getResumoCobrancaFase(rel.id))}`}
                              onClick={() => onClickResumoCobranca(rel.id)}
                              title={
                                t.resumoCobrancaDicaClique ||
                                'Toque para indicar se deve cobrar ao cliente.'
                              }
                            >
                              {labelResumoCobrancaEspecial(getResumoCobrancaFase(rel.id), t)}
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="relatorio-especial-card__acoes">
                      <button type="button" className="btn-secondary" onClick={() => abrirEditar(rel)}>
                        ✏️ {t.edit || 'Editar'}
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => imprimirPdf(prep)}>
                        🖨 {t.print || 'PDF'}
                      </button>
                      <EnvioBotoes rel={rel} compact />
                      <button type="button" className="btn-secondary" onClick={() => abrirFechamento(rel)}>
                        ⏱ {t.relatorioEspecialFechamentoHoras || 'Fechamento de horas'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary relatorio-especial-card__eliminar"
                        disabled={salvando}
                        onClick={() => void eliminarRelatorio(rel)}
                      >
                        🗑{' '}
                        {salvando && acaoEmCurso === 'eliminar'
                          ? t.relatorioEspecialAEliminar || 'A eliminar…'
                          : t.delete || 'Eliminar'}
                      </button>
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
      <div className="relatorio-especial-fechamento" style={{ padding: '16px 0', maxWidth: 720 }}>
        <div className="mobile-sticky-toolbar relatorio-especial-mobile-bar">
          <button type="button" className="mobile-toolbar-btn mobile-toolbar-voltar" onClick={voltarLista}>
            ← {t.voltar || 'Voltar'}
          </button>
          <button
            type="button"
            className="mobile-toolbar-btn"
            disabled={salvando}
            onClick={() => void guardarFechamento()}
          >
            {salvando ? '…' : `💾 ${t.save || 'Guardar'}`}
          </button>
          <button type="button" className="mobile-toolbar-btn" onClick={() => imprimirPdf(formComTotais)}>
            🖨 PDF
          </button>
        </div>
        <button type="button" className="btn-secondary relatorio-especial-desktop-nav" style={{ marginBottom: 16 }} onClick={voltarLista}>
          ← {t.voltar || 'Voltar'}
        </button>
        <h2>{t.relatorioEspecialFechamentoHorasMes || t.relatorioEspecialFechamentoMes || 'Fechamento de horas do mês'}</h2>
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
                  <span style={{ color: '#00ff00', fontSize: 12 }} aria-label={t.relatorioEspecialFechadoEm || 'Fechado'}>
                    ✓{' '}
                    {(t.relatorioEspecialFechadoEm || 'Fechado em {data}').replace(
                      '{data}',
                      new Date(fechado.fechadoEm).toLocaleDateString(uiLocale)
                    )}
                  </span>
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
          <p style={{ fontSize: 13, color: '#aaa', marginTop: 0 }}>
            {t.relatorioEspecialPdfHorasViagem || t.horasViagem || 'Horas viagem'}:{' '}
            <strong style={{ color: '#00c853' }}>{formComTotais.horasViagem || '0:00'}</strong>
          </p>
          {form.fechamento?.totalGeral ? (
            <p style={{ color: '#00ff00' }}>
              ✓{' '}
              {(t.relatorioEspecialFechadoEm || 'Fechado em {data}').replace(
                '{data}',
                new Date(form.fechamento.totalGeral.fechadoEm).toLocaleString(uiLocale)
              )}
            </p>
          ) : (
            <button type="button" className="btn-primary" onClick={fecharTotalGeral}>
              {t.relatorioEspecialFecharTotal || 'Fechar total geral'}
            </button>
          )}
        </div>
        <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <button type="button" className="btn-primary" disabled={salvando} onClick={guardarFechamento}>
            {salvando ? '…' : t.save || 'Guardar fechamento'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => imprimirPdf(formComTotais)}>
            🖨 PDF
          </button>
          <EnvioBotoes rel={formComTotais} />
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
      <div className="mobile-sticky-toolbar relatorio-especial-mobile-bar">
        <button type="button" className="mobile-toolbar-btn mobile-toolbar-voltar" onClick={voltarLista}>
          ← {t.voltar || 'Voltar'}
        </button>
        <button
          type="button"
          className="mobile-toolbar-btn mobile-toolbar-btn--primary"
          disabled={salvando}
          onClick={() => void persistir()}
        >
          {salvando && acaoEmCurso === 'guardar' ? '…' : `💾 ${t.save || 'Guardar'}`}
        </button>
        <button type="button" className="mobile-toolbar-btn" onClick={() => imprimirPdf(formComTotais)}>
          🖨 PDF
        </button>
        {editandoId && (
          <button
            type="button"
            className="mobile-toolbar-btn mobile-toolbar-btn--danger"
            disabled={salvando}
            onClick={() => void eliminarRelatorio(formComTotais)}
          >
            🗑{' '}
            {salvando && acaoEmCurso === 'eliminar'
              ? t.relatorioEspecialAEliminar || 'A eliminar…'
              : t.delete || 'Eliminar'}
          </button>
        )}
      </div>

      <div className="relatorio-especial-form__action-bar relatorio-especial-desktop-nav">
        <button type="button" className="re-action-btn re-action-btn--ghost" onClick={voltarLista}>
          ← {t.voltar || 'Voltar'}
        </button>
        <div className="relatorio-especial-form__action-bar-acoes">
          <button
            type="button"
            className="re-action-btn re-action-btn--primary"
            disabled={salvando}
            onClick={() => void persistir()}
          >
            {salvando && acaoEmCurso === 'guardar' ? '…' : `💾 ${t.save || 'Guardar'}`}
          </button>
          {editandoId ? (
            <button
              type="button"
              className="re-action-btn re-action-btn--danger"
              disabled={salvando}
              onClick={() => void eliminarRelatorio(formComTotais)}
            >
              🗑{' '}
              {salvando && acaoEmCurso === 'eliminar'
                ? t.relatorioEspecialAEliminar || 'A eliminar…'
                : t.delete || 'Eliminar'}
            </button>
          ) : null}
          <button
            type="button"
            className="re-action-btn re-action-btn--ghost"
            onClick={() => imprimirPdf(formComTotais)}
          >
            🖨 PDF
          </button>
          <span className="relatorio-especial-form__envio">
            {abrirEnvioDocumentoCliente ? (
              <DocumentoEnvioAcoes
                abrirEnvio={abrirEnvioDocumentoCliente}
                {...envioRelatorio(formComTotais, () =>
                  imprimirPdf(aplicarTotaisNoRelatorioEspecial(formComTotais))
                )}
                emailLabel={t.email || 'E-mail'}
                whatsLabel="WhatsApp"
                className="relatorio-especial-form__envio-inner"
              />
            ) : null}
          </span>
        </div>
      </div>

      <header className="relatorio-especial-form__hero">
        <h2 className="relatorio-especial-form__titulo">
          {editandoId
            ? t.relatorioEspecialEditar || 'Editar relatório de serviços'
            : t.relatorioEspecialNovo || 'Novo relatório de serviços'}
        </h2>
        {formTemAlteracoes() ? (
          <p className="relatorio-especial-form__aviso-pendente">
            {t.relatorioEspecialAlteracoesPendentes ||
              'Alterações por guardar — clique em Guardar antes de sair.'}
          </p>
        ) : null}
      </header>

      <section className="relatorio-especial-panel relatorio-especial-form__basicos">
        <h3 className="relatorio-especial-panel__title">{t.informacoesBasicas || 'Informações básicas'}</h3>
        <div className="relatorio-especial-form__grid relatorio-especial-form__grid--basicos">
          <div className="relatorio-especial-form__field">
            <label>{t.numeroRelatorio || 'Número'}</label>
            <input
              type="text"
              value={form.numero}
              onChange={(e) => setForm({ ...form, numero: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div className="relatorio-especial-form__field">
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
          <div className="relatorio-especial-form__field">
            <label>{t.selecioneTecnico || 'Técnico'}</label>
            <select
              value={form.tecnico}
              onChange={(e) => setForm({ ...form, tecnico: e.target.value })}
              style={inputStyle}
            >
              <option value="">{t.selecioneTecnico || 'Técnico'}</option>
              {tecnicos.map((tec) => (
                <option key={tec.id} value={tec.name}>
                  {tec.name}
                </option>
              ))}
            </select>
          </div>

          {editandoId && (onAbrirFechamentoCobranca || (getResumoCobrancaFase && onClickResumoCobranca)) ? (
            <div className="relatorio-especial-form__cobranca-bar relatorio-especial-form__cobranca-bar--row">
              {onAbrirFechamentoCobranca ? (
                <button
                  type="button"
                  className="re-action-btn re-action-btn--primary relatorio-especial-form__cobranca"
                  onClick={() => onAbrirFechamentoCobranca(editandoId, form.numero)}
                  title={
                    t.relatorioEspecialFechamentoCobrancaDica ||
                    'Abrir fechamento para cobrança (valores HT/KM/diárias)'
                  }
                >
                  💶 {t.relatorioEspecialFechamentoCobranca || 'Fechamento / Cobrança'}
                </button>
              ) : null}
              {getResumoCobrancaFase && onClickResumoCobranca ? (
                <button
                  type="button"
                  className={`re-action-btn relatorio-especial-form__resumo-chip ${classNameResumoCobrancaEspecial(getResumoCobrancaFase(editandoId))}`}
                  onClick={() => onClickResumoCobranca(editandoId)}
                  title={
                    t.resumoCobrancaDicaClique ||
                    'Toque para indicar se deve cobrar ao cliente (após gravar o relatório).'
                  }
                >
                  {labelResumoCobrancaEspecial(getResumoCobrancaFase(editandoId), t)}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="relatorio-especial-form__field relatorio-especial-form__field--full">
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
          <div className="relatorio-especial-form__field">
            <label>{t.cidade || 'Cidade'}</label>
            <input
              type="text"
              value={form.cidade}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div className="relatorio-especial-form__field">
            <label>{t.telefone || 'Telefone'}</label>
            <input
              type="text"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div className="relatorio-especial-form__field">
            <label>{t.tipoServico || 'Tipo de serviço'}</label>
            <input
              type="text"
              value={form.tipoServico}
              onChange={(e) => setForm({ ...form, tipoServico: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      <section className="relatorio-equipamentos-block relatorio-especial-panel">
        <div className="relatorio-equipamentos-block__head relatorio-especial-panel__head">
          <div>
            <h3 className="relatorio-equipamentos-block__title relatorio-especial-panel__title">
              {t.relatorioEspecialEquipamentos || 'Equipamentos'}{' '}
              <span className="relatorio-especial-panel__count">
                ({form.equipamentos?.length || 0}/{MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_MES})
              </span>
            </h3>
            <p className="relatorio-equipamentos-block__lead">
              {t.relatorioEspecialEquipamentosAjuda ||
                'Adicione equipamentos do cliente ou busque na biblioteca do armazém. Edite ID, modelo e n.º série.'}
            </p>
          </div>
          <div className="relatorio-equipamentos-block__acoes">
            {(form.equipamentos || []).length > 0 && (
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={expandirTodosEquipamentos}
                >
                  {t.expandirTodos || t.expandAll || 'Expandir todos'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={retrairTodosEquipamentos}
                >
                  {t.retrairTodos || t.collapseAll || 'Retrair todos'}
                </button>
              </>
            )}
            <button
              type="button"
              className="btn-primary relatorio-equipamentos-block__add"
              disabled={!podeAdicionarEquip}
              onClick={adicionarEquipamento}
            >
              + {t.relatorioAdicionarEquipamento || 'Adicionar equipamento'}
            </button>
          </div>
        </div>

        {(form.equipamentos || []).length === 0 ? (
          <p className="relatorio-equipamentos-block__empty">
            {t.relatorioSemEquipamentos || 'Nenhum equipamento adicionado.'}
          </p>
        ) : (
          <div className="relatorio-equipamentos-list">
            {(form.equipamentos || []).map((eq, eqIdx) => {
              const aberto = equipExpandidos.has(eq.uid)
              const resumoLinha = [
                eq.equipamentoId || '',
                eq.maquinaModelo || '',
                eq.numeroMaquina ? `${t.numeroSerie || 'S/N'} ${eq.numeroMaquina}` : '',
              ]
                .filter(Boolean)
                .join(' · ')
              return (
              <div
                key={eq.uid}
                className={`relatorio-equipamento-card${aberto ? ' relatorio-equipamento-card--aberto' : ' relatorio-equipamento-card--fechado'}`}
              >
                <div className="relatorio-equipamento-card__head">
                  <button
                    type="button"
                    className="relatorio-equipamento-card__toggle"
                    onClick={() => toggleEquipExpandido(eq.uid)}
                    aria-expanded={aberto}
                  >
                    <span className="relatorio-equipamento-card__badge">
                      {(t.relatorioEquipamentoNumero || 'Equipamento {n}').replace('{n}', String(eqIdx + 1))}
                    </span>
                    <span className="relatorio-equipamento-card__resumo">
                      {resumoLinha || (t.relatorioEspecialEquipSemDetalhe || 'Sem detalhes — toque para editar')}
                    </span>
                    <span className="relatorio-equipamento-card__chevron" aria-hidden="true">
                      {aberto ? '▲' : '▼'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn-danger btn-danger--inline relatorio-equipamento-card__remove"
                    onClick={() => {
                      atualizarEquipamentos((form.equipamentos || []).filter((x) => x.uid !== eq.uid))
                      setEquipExpandidos((prev) => {
                        const next = new Set(prev)
                        next.delete(eq.uid)
                        return next
                      })
                    }}
                  >
                    {t.removerEquipamentoRelatorio || 'Remover'}
                  </button>
                </div>

                {aberto && (
                <div className="relatorio-equipamento-card__grid">
                  <div className="relatorio-equipamento-card__field--full">
                    <span className="relatorio-equipamento-card__label relatorio-equipamento-card__label--blue">
                      {t.relatorioEquipamentoOrigem || 'Origem do equipamento'}
                    </span>
                    <div
                      className="relatorio-equipamento-card__origem-radios"
                      role="radiogroup"
                      aria-label={t.relatorioEquipamentoOrigem || 'Origem do equipamento'}
                    >
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
                        <span>{t.relatorioEspecialEquipOrigemArmazem || t.relatorioEquipOrigemArmazem || 'Armazém — biblioteca de equipamentos'}</span>
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
                    <label className="relatorio-equipamento-card__label">{t.numeroSerie || 'S/N'}</label>
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
                )}
              </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="relatorio-especial-panel relatorio-especial-panel--dias">
        <div className="relatorio-equipamentos-block__head relatorio-especial-panel__head">
          <div>
            <h3 className="relatorio-especial-panel__title">{t.diasTrabalho || 'Dias de trabalho'}</h3>
            <p className="relatorio-especial-dia-secao__ajuda relatorio-especial-panel__lead">
              {t.relatorioEspecialInformacaoApenasData ||
                t.informacaoApenasDataObrigatoria ||
                'Apenas a data é obrigatória. Horários, KM e equipamentos são opcionais.'}
            </p>
          </div>
          <button type="button" className="btn-primary relatorio-equipamentos-block__add" onClick={adicionarDia}>
            + {t.adicionarDia || 'Adicionar dia'}
          </button>
        </div>
        <div className="relatorio-especial-callout" role="note">
          <span className="relatorio-especial-callout__icon" aria-hidden="true">
            i
          </span>
          <p>
            {t.relatorioEspecialDiasFimSemanaOk ||
              'Sábado e domingo também contam como dias de trabalho (diárias).'}
          </p>
        </div>

        {diasOrdenados.length > 0 ? (
          <div className="relatorio-especial-horas-block">
            <div className="relatorio-especial-horas-block__head">
              <h4 className="relatorio-especial-horas-block__title">
                {t.controleHorasDeslocamentos || 'Controlo de horas e deslocamentos'}
              </h4>
              <span className="relatorio-especial-horas-block__meta">
                {(t.diarias || 'Diárias')}: <strong>{totais.diarias}</strong>
              </span>
            </div>
            <div className="relatorio-dias-trabalho-wrap relatorio-especial-table-shell">
              <table className="relatorio-dias-trabalho-table relatorio-especial-horas-table">
                <thead>
                  <tr className="relatorio-especial-horas-table__group">
                    <th rowSpan={2}>{t.data || 'Data'}</th>
                    <th colSpan={3}>{t.ida || 'Ida'}</th>
                    <th colSpan={3}>{t.relatorioEspecialPdfHorasTrabalho || t.horas || 'Horas de trabalho'}</th>
                    <th colSpan={3}>{t.retorno || 'Retorno'}</th>
                    <th colSpan={3}>{t.km || 'KM'}</th>
                    <th rowSpan={2}>{t.pausa || 'Pausa'}</th>
                    <th rowSpan={2} className="relatorio-dia-acao-head">
                      {t.acao || 'Ação'}
                    </th>
                  </tr>
                  <tr className="relatorio-especial-horas-table__sub">
                    <th>{t.saida || 'Saída'}</th>
                    <th>{t.chegada || 'Chegada'}</th>
                    <th>{t.duracao || 'Duração'}</th>
                    <th>{t.inicio || 'Início'}</th>
                    <th>{t.fim || 'Fim'}</th>
                    <th>{t.relatorioEspecialPdfDuracaoLiquida || 'Líquido'}</th>
                    <th>{t.saida || 'Saída'}</th>
                    <th>{t.chegada || 'Chegada'}</th>
                    <th>{t.duracao || 'Duração'}</th>
                    <th>{t.ida || 'Ida'}</th>
                    <th>{t.retorno || 'Retorno'}</th>
                    <th>{t.total || 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  {diasOrdenados.map((dia, index) => {
                    const diaCalc = atualizarCalculosDiaEspecial(dia)
                    const sem = getDiaSemanaInfo(dia.data, t)
                    const horasResumo = resumoHorasTrabalhoDia(diaCalc)
                    const pausaFmt = (dia.tempoPausa || '').trim() || (dia.pausa === 'sim' ? '01:00' : dia.pausa || '—')
                    const temDescricao = Boolean((dia.descricaoTrabalho || '').trim())
                    return (
                      <ReactFragment key={dia.id}>
                        <tr className={sem.isFimDeSemana ? 're-dia-linha--fim-semana' : undefined}>
                          <td
                            rowSpan={temDescricao ? 2 : 1}
                            className={`relatorio-especial-horas-table__data${sem.isFimDeSemana ? ' relatorio-especial-horas-table__data--fds' : ''}`}
                          >
                            {formatDiaComDiaSemana(dia.data, t)}
                          </td>
                          <td>{dia.idaHora || '—'}</td>
                          <td>{dia.idaChegada || '—'}</td>
                          <td>{diaCalc.idaDuracao || '—'}</td>
                          <td>{horasResumo.inicio}</td>
                          <td>{horasResumo.fim}</td>
                          <td className="relatorio-especial-horas-table__liquido">
                            {horasResumo.soViagem ? (
                              <>
                                <strong>{horasResumo.viagemFmt}</strong>
                                <span className="relatorio-especial-horas-table__hint">
                                  {t.relatorioEspecialDiaSoViagem ||
                                    t.relatorioEspecialPdfHorasViagem ||
                                    'viagem'}
                                </span>
                              </>
                            ) : horasResumo.temHoras ? (
                              <>
                                <strong>{horasResumo.duracaoLiquida}</strong>
                                {horasResumo.almocoMinutos > 0 &&
                                horasResumo.duracaoBruta !== horasResumo.duracaoLiquida ? (
                                  <span className="relatorio-especial-horas-table__hint">
                                    {horasResumo.duracaoBruta} − {horasResumo.almocoFmt}{' '}
                                    {t.horaAlmoco || 'almoço'}
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              <strong>—</strong>
                            )}
                          </td>
                          <td>{dia.retornoSaida || '—'}</td>
                          <td>{dia.retornoChegada || '—'}</td>
                          <td>{diaCalc.retornoDuracao || '—'}</td>
                          <td>{dia.kmIda || '0'}</td>
                          <td>{dia.kmRetorno || '0'}</td>
                          <td>{diaCalc.kmTotal || '0'}</td>
                          <td rowSpan={temDescricao ? 2 : 1}>{pausaFmt}</td>
                          <td className="relatorio-dia-acao-cell" rowSpan={temDescricao ? 2 : 1}>
                            <div className="relatorio-especial-horas-table__acoes">
                              <button
                                type="button"
                                className="dia-trabalho-acao-btn dia-trabalho-acao-btn--edit"
                                onClick={() => abrirEditarDia(dia.id)}
                              >
                                {t.edit || 'Editar'}
                              </button>
                              <button
                                type="button"
                                className="dia-trabalho-acao-btn dia-trabalho-acao-btn--del"
                                onClick={() => {
                                  if (!window.confirm(t.confirmDelete || 'Remover este dia?')) return
                                  setForm((prev) => ({
                                    ...prev,
                                    diasTrabalho: prev.diasTrabalho!.filter((d) => d.id !== dia.id),
                                  }))
                                  if (diaExpandido === dia.id) setDiaExpandido(null)
                                }}
                              >
                                {t.delete || 'Eliminar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {temDescricao && (
                          <tr className="relatorio-especial-horas-table__desc-row">
                            <td colSpan={12} className="relatorio-dia-descricao-cell">
                              {dia.descricaoTrabalho}
                            </td>
                          </tr>
                        )}
                      </ReactFragment>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="relatorio-especial-horas-table__totais">
                    <td colSpan={6}>{t.totais || 'TOTAIS'}</td>
                    <td className="relatorio-especial-horas-table__liquido">
                      <strong>{formatMinutosComoHHMM(totais.horasTrabalhoTotal)}</strong>
                      {totais.horasAlmocoTotal > 0 ? (
                        <span className="relatorio-especial-horas-table__hint">
                          {formatMinutosComoHHMM(totais.horasTrabalhoBruto)} −{' '}
                          {formatMinutosComoHHMM(totais.horasAlmocoTotal)} {t.horaAlmoco || 'almoço'}
                        </span>
                      ) : null}
                    </td>
                    <td colSpan={3} />
                    <td colSpan={2} />
                    <td>{totais.kmsTotal}</td>
                    <td>{totais.horasAlmocoTotal > 0 ? `−${formatMinutosComoHHMM(totais.horasAlmocoTotal)}` : '—'}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <p className="relatorio-especial-empty-hint">
            {t.relatorioEspecialNenhumDiaTrabalho || t.nenhumDiaTrabalhoAdicionado || 'Nenhum dia de trabalho ainda.'}
          </p>
        )}

        {diasOrdenados.map((dia) => {
          const diaCalc = atualizarCalculosDiaEspecial(dia)
          const aberto = diaExpandido === dia.id
          const horasResumoCard = resumoHorasTrabalhoDia(diaCalc)
          const resumoHoras = (diaCalc.horasPorEquipamento || [])
            .filter((h) => h.equipamentoUid && h.horasDuracao)
            .map((h) => {
              const eq = form.equipamentos?.find((e) => e.uid === h.equipamentoUid)
              const idx = eq ? form.equipamentos!.indexOf(eq) : 0
              return `${eq ? labelEquipamentoCurto(eq, idx) : '?'}: ${h.horasDuracao}`
            })
            .join(' · ')
          const resumoLinha =
            resumoHoras ||
            (horasResumoCard.soViagem
              ? `${horasResumoCard.viagemFmt} ${t.relatorioEspecialDiaSoViagem || t.relatorioEspecialPdfHorasViagem || 'viagem'}`
              : '')
          return (
            <div key={dia.id} id={`re-dia-card-${dia.id}`} className="relatorio-especial-dia-card">
              <button
                type="button"
                className="relatorio-especial-dia-card__toggle"
                onClick={() => setDiaExpandido(aberto ? null : dia.id)}
              >
                <strong style={{ color: getDiaSemanaInfo(dia.data, t).isFimDeSemana ? '#ffd54f' : undefined }}>
                  {formatDiaComDiaSemana(dia.data, t)}
                </strong>
                {resumoLinha ? ` — ${resumoLinha}` : ''}
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
                      🕐 {t.relatorioEspecialIdaCliente || t.horariosIda || 'Ida ao cliente'}
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
                      🕐 {t.relatorioEspecialHoraTrabalhada || t.horarioServico || 'Hora trabalhada'} ({t.relatorioEspecialHorasPorEquipamento || 'por equipamento'})
                    </h4>
                    <p className="relatorio-especial-dia-secao__ajuda">
                      {t.relatorioEspecialMultiplasSessoesAjuda ||
                        t.relatorioEspecialHoraCorridaAjuda ||
                        'Pode repetir o mesmo equipamento no mesmo dia (ex.: 10:00–12:00 e 14:00–19:00). Máx. 4 equipamentos diferentes por dia.'}
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
                                if (v) {
                                  const uidsAtuais = new Set(
                                    (dia.horasPorEquipamento || [])
                                      .map((h, hi) => (hi === li ? '' : (h.equipamentoUid || '').trim()))
                                      .filter(Boolean)
                                  )
                                  if (!uidsAtuais.has(v) && uidsAtuais.size >= MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_DIA) {
                                    alert(
                                      t.relatorioEspecialMaxEquipamentosDia ||
                                        `Máximo ${MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_DIA} equipamentos diferentes por dia.`
                                    )
                                    return
                                  }
                                }
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
                            <label>{t.total || 'Total'}</label>
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
                    {(dia.horasPorEquipamento?.length || 0) < MAX_LINHAS_HORAS_RELATORIO_ESPECIAL_DIA && (
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
                      🕐 {t.relatorioEspecialSaidaCliente || t.horariosRetorno || 'Saída do cliente'}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={dia.pausa === 'true' || dia.pausa === 'sim' || Boolean((dia.tempoPausa || '').trim())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              actualizarDia(dia.id, {
                                pausa: 'sim',
                                tempoPausa: (dia.tempoPausa || '').trim() || '01:00',
                              })
                            } else {
                              actualizarDia(dia.id, { pausa: '', tempoPausa: '' })
                            }
                          }}
                        />
                        {t.pausa || 'Descanso / almoço'}
                      </label>
                      {minutosAlmocoDia(dia) > 0 ? (
                        <span style={{ fontSize: 12, color: '#00c853' }}>
                          −{formatMinutosComoHHMM(minutosAlmocoDia(dia))} {t.horaAlmoco || 'no total do dia'}
                        </span>
                      ) : null}
                    </div>
                    <div className="relatorio-especial-dia-secao__grid relatorio-especial-dia-secao__grid--almoco">
                      <div>
                        <label>{t.tempoPausa || 'Tempo (HH:MM)'}</label>
                        <input
                          type="time"
                          className="ns-datetime-input"
                          value={dia.tempoPausa || ''}
                          onChange={(e) => {
                            const v = e.target.value ? e.target.value.slice(0, 5) : ''
                            actualizarDia(dia.id, { tempoPausa: v, pausa: v ? 'sim' : '' })
                          }}
                        />
                      </div>
                    </div>
                    <p className="relatorio-especial-dia-secao__ajuda">
                      {t.relatorioEspecialTempoAlmocoDescricao ||
                        t.tempoPausaDescricao ||
                        'Ex.: 01:00 desconta 1 hora do total trabalhado (hora corrida menos almoço).'}
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
        {(form.equipamentos || []).map((eq, i) => {
          const sessoes = sessoesPorEquip[eq.uid] || []
          const total = formComTotais.horasPorEquipamentoResumo?.[eq.uid] || '0:00'
          return (
            <div key={eq.uid} className="relatorio-especial-resumo-equip" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#00c853' }}>
                {labelEquipamentoCurto(eq, i)} — <strong>{total}</strong>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 400, marginLeft: 6 }}>
                  ({t.relatorioEspecialTotalEquipamentoBruto || 'total na máquina — almoço no total geral'})
                </span>
              </div>
              {sessoes.length > 0 ? (
                <table className="relatorio-especial-resumo-equip__tabela">
                  <thead>
                    <tr>
                      <th>{t.relatorioEspecialPdfColDias || t.diasTrabalho || 'Dias'}</th>
                      <th>{t.relatorioEspecialPdfColHorario || 'Horário'}</th>
                      <th>{t.relatorioEspecialPdfHorasMaquina || t.total || 'Horas na máquina'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessoes.map((s, si) => (
                      <tr key={`${s.diaId}-${si}`}>
                        <td>{s.dataFormatada}</td>
                        <td>
                          {s.horasInicio && s.horasFim ? `${s.horasInicio} – ${s.horasFim}` : s.horasInicio || s.horasFim || '—'}
                        </td>
                        <td><strong>{s.horasDuracao || '—'}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
                  {t.relatorioEspecialPdfSemSessoesEquip || 'Sem horas registadas'}
                </p>
              )}
            </div>
          )
        })}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(0,200,83,0.25)' }}>
          <div>
            <div style={{ fontSize: 12, color: '#aaa' }}>{t.relatorioEspecialPdfTotalGeralLabel || t.relatorioEspecialTotalGeral || 'TOTAL DE HORAS DE TRABALHO'}</div>
            <strong style={{ fontSize: 28, color: '#00c853' }}>{formComTotais.horasTrabalho}</strong>
            {totais.horasAlmocoTotal > 0 && (
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                {formatMinutosComoHHMM(totais.horasTrabalhoBruto)} −{' '}
                {formatMinutosComoHHMM(totais.horasAlmocoTotal)} {t.horaAlmoco || 'almoço'}
                {' · '}
                {t.relatorioEspecialTotalComAlmoco || 'Total com desconto de almoço'}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#aaa' }}>
              {t.relatorioEspecialPdfHorasViagem || t.horasViagem || 'Horas viagem'}
            </div>
            <strong style={{ fontSize: 28, color: '#00c853' }}>{formComTotais.horasViagem || '0:00'}</strong>
            {totais.horasViagemTotal > 0 && (totais.horasViagemIda > 0 || totais.horasViagemRetorno > 0) ? (
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                {(t.horasViagemIda || 'Ida') + ': ' + formatMinutosComoHHMM(totais.horasViagemIda)}
                {' · '}
                {(t.horasViagemRetorno || 'Retorno') + ': ' + formatMinutosComoHHMM(totais.horasViagemRetorno)}
              </div>
            ) : null}
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#aaa' }}>KM</div>
            <strong>{formComTotais.kmsPercorridos}</strong>
          </div>
        </div>
      </section>

      <section className="relatorio-especial-panel relatorio-especial-form__observacoes">
        <h3 className="relatorio-especial-panel__title">{t.observacoes || 'Observações'}</h3>
        <textarea
          value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          rows={4}
          className="relatorio-especial-form__observacoes-input"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </section>

      <div className="relatorio-especial-form__action-bar relatorio-especial-form__actions">
        <div className="relatorio-especial-form__action-bar-acoes">
          <button
            type="button"
            className="re-action-btn re-action-btn--primary"
            disabled={salvando}
            onClick={() => void persistir()}
          >
            {salvando && acaoEmCurso === 'guardar' ? '…' : `💾 ${t.save || 'Guardar'}`}
          </button>
          {editandoId ? (
            <button
              type="button"
              className="re-action-btn re-action-btn--danger"
              disabled={salvando}
              onClick={() => void eliminarRelatorio(formComTotais)}
            >
              🗑{' '}
              {salvando && acaoEmCurso === 'eliminar'
                ? t.relatorioEspecialAEliminar || 'A eliminar…'
                : t.delete || 'Eliminar'}
            </button>
          ) : null}
          <button
            type="button"
            className="re-action-btn re-action-btn--ghost"
            onClick={() => imprimirPdf(formComTotais)}
          >
            🖨 PDF
          </button>
          <span className="relatorio-especial-form__envio">
            {abrirEnvioDocumentoCliente ? (
              <DocumentoEnvioAcoes
                abrirEnvio={abrirEnvioDocumentoCliente}
                {...envioRelatorio(formComTotais, () =>
                  imprimirPdf(aplicarTotaisNoRelatorioEspecial(formComTotais))
                )}
                emailLabel={t.email || 'E-mail'}
                whatsLabel="WhatsApp"
                className="relatorio-especial-form__envio-inner"
              />
            ) : null}
          </span>
        </div>
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

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { documentPdfDateLocale, localeDateShort, localeForLongDatetime } from '../translations'

const STORAGE_ENTIDADES = 'nonato-contador-entidades'
const STORAGE_PAGAMENTOS = 'nonato-contador-pagamentos'
const MAX_ANEXO_BYTES = 8 * 1024 * 1024

export type CategoriaEntidadeContador =
  | 'irs'
  | 'seguranca_social'
  | 'advogado'
  | 'contabilista'
  | 'seguros'
  | 'outro'

export type EntidadeContador = {
  id: string
  nome: string
  categoria: CategoriaEntidadeContador
  nif?: string
  contacto?: string
  notas?: string
  ativo: boolean
  criadoEm: string
}

export type AnexoContador = {
  id: string
  nome: string
  mime: string
  base64: string
  criadoEm: string
}

export type PagamentoContador = {
  id: string
  entidadeId: string
  entidadeNome: string
  dataPagamento: string
  valor: number
  periodoReferencia: string
  numeroDocumento?: string
  descricao?: string
  status: 'pago' | 'pendente'
  anexos: AnexoContador[]
  criadoEm: string
  atualizadoEm: string
}

type Props = {
  saveData: (key: string, data: unknown) => Promise<void>
  loadData: (key: string) => Promise<unknown>
  safeT: Record<string, string | undefined>
  localeLang: string
  closeTab: (tabId: string) => void
  activeTabId?: string
  isCompactLayout?: boolean
}

const CATEGORIA_LABEL: Record<CategoriaEntidadeContador, string> = {
  irs: 'IRS / Finanças',
  seguranca_social: 'Segurança Social',
  advogado: 'Advogado',
  contabilista: 'Contabilista / TOC',
  seguros: 'Seguros',
  outro: 'Outro',
}

const CATEGORIA_COR: Record<CategoriaEntidadeContador, string> = {
  irs: '#f87171',
  seguranca_social: '#38bdf8',
  advogado: '#a78bfa',
  contabilista: '#4ade80',
  seguros: '#fbbf24',
  outro: '#94a3b8',
}

const ENTIDADES_PADRAO: Omit<EntidadeContador, 'id' | 'criadoEm'>[] = [
  { nome: 'Autoridade Tributária (IRS)', categoria: 'irs', ativo: true },
  { nome: 'Segurança Social', categoria: 'seguranca_social', ativo: true },
  { nome: 'Advogado', categoria: 'advogado', ativo: true },
  { nome: 'Contabilista / TOC', categoria: 'contabilista', ativo: true },
]

function tx(safeT: Props['safeT'], key: string, fallback: string): string {
  const v = safeT[key]
  return typeof v === 'string' && v.trim() ? v : fallback
}

function getEntidadesPadrao(safeT: Props['safeT']): Omit<EntidadeContador, 'id' | 'criadoEm'>[] {
  return [
    { nome: tx(safeT, 'pagamentosContadorDefaultIrs', ENTIDADES_PADRAO[0].nome), categoria: 'irs', ativo: true },
    {
      nome: tx(safeT, 'pagamentosContadorDefaultSS', ENTIDADES_PADRAO[1].nome),
      categoria: 'seguranca_social',
      ativo: true,
    },
    { nome: tx(safeT, 'pagamentosContadorDefaultAdvogado', ENTIDADES_PADRAO[2].nome), categoria: 'advogado', ativo: true },
    {
      nome: tx(safeT, 'pagamentosContadorDefaultContabilista', ENTIDADES_PADRAO[3].nome),
      categoria: 'contabilista',
      ativo: true,
    },
  ]
}

type ResumoEntidadePdf = {
  nome: string
  categoriaLabel: string
  totalPago: number
  totalPendente: number
  quantidade: number
}

function formatMesLocale(yyyyMm: string, locale: string): string {
  if (!yyyyMm || yyyyMm.length < 7) return yyyyMm
  try {
    const [y, m] = yyyyMm.split('-').map(Number)
    const d = new Date(y, (m || 1) - 1, 1)
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  } catch {
    return yyyyMm
  }
}

function formatDataLocale(iso: string, locale: string): string {
  if (!iso) return ''
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString(locale)
  } catch {
    return iso
  }
}

function descricaoPeriodoFiltro(
  safeT: Props['safeT'],
  monthLocale: string,
  dateLocale: string,
  modo: 'todos' | 'mes' | 'intervalo',
  mes: string,
  inicio: string,
  fim: string
): string | undefined {
  if (modo === 'mes' && mes) {
    return `${tx(safeT, 'pagamentosContadorFiltroMes', 'Mês')}: ${formatMesLocale(mes, monthLocale)}`
  }
  if (modo === 'intervalo') {
    if (inicio && fim) {
      return `${tx(safeT, 'pagamentosContadorFiltroIntervalo', 'Intervalo')}: ${formatDataLocale(inicio, dateLocale)} — ${formatDataLocale(fim, dateLocale)}`
    }
    if (inicio) return `${tx(safeT, 'pagamentosContadorFiltroDesde', 'Desde')}: ${formatDataLocale(inicio, dateLocale)}`
    if (fim) return `${tx(safeT, 'pagamentosContadorFiltroAte', 'Até')}: ${formatDataLocale(fim, dateLocale)}`
  }
  return undefined
}

function buildPdfLabels(safeT: Props['safeT']) {
  return {
    subtitulo: tx(safeT, 'pagamentosContadorPdfSubtitulo', 'NONATO SERVICE — Relatório para o contabilista'),
    periodoAno: tx(safeT, 'pagamentosContadorPdfPeriodoAno', 'Período / ano:'),
    filtros: tx(safeT, 'pagamentosContadorPdfFiltros', 'Filtros'),
    registos: tx(safeT, 'pagamentosContadorPdfRegistos', 'Registos incluídos'),
    geradoEm: tx(safeT, 'pagamentosContadorPdfGeradoEm', 'Gerado em'),
    totalPago: tx(safeT, 'pagamentosContadorPdfTotalPago', 'Total pago'),
    totalPendente: tx(safeT, 'pagamentosContadorPdfTotalPendente', 'Total pendente'),
    totalGeral: tx(safeT, 'pagamentosContadorPdfTotalGeral', 'Total geral'),
    resumoEntidade: tx(safeT, 'pagamentosContadorPdfResumoEntidade', 'Resumo por entidade'),
    detalhe: tx(safeT, 'pagamentosContadorPdfDetalhe', 'Detalhe dos pagamentos'),
    colEntidade: tx(safeT, 'pagamentosContadorPdfColEntidade', 'Entidade'),
    colTipo: tx(safeT, 'pagamentosContadorPdfColTipo', 'Tipo'),
    colQtd: tx(safeT, 'pagamentosContadorPdfColQtd', 'Qtd.'),
    colPagoEur: tx(safeT, 'pagamentosContadorPdfColPagoEur', 'Pago (€)'),
    colPendenteEur: tx(safeT, 'pagamentosContadorPdfColPendenteEur', 'Pendente (€)'),
    colTotal: tx(safeT, 'pagamentosContadorPdfColTotal', 'Total (€)'),
    colData: tx(safeT, 'pagamentosContadorPdfColData', 'Data'),
    colPeriodo: tx(safeT, 'pagamentosContadorPdfColPeriodo', 'Período / ref.'),
    colDoc: tx(safeT, 'pagamentosContadorPdfColDoc', 'N.º doc.'),
    colEstado: tx(safeT, 'pagamentosContadorPdfColEstado', 'Estado'),
    colValor: tx(safeT, 'pagamentosContadorPdfColValor', 'Valor'),
    colDescricao: tx(safeT, 'pagamentosContadorPdfColDescricao', 'Descrição / anexos'),
    nenhumResumo: tx(safeT, 'pagamentosContadorPdfNenhum', 'Nenhum pagamento no filtro selecionado.'),
    nenhumDetalhe: tx(safeT, 'pagamentosContadorPdfNenhumDetalhe', 'Nenhum pagamento.'),
    totalFiltro: tx(safeT, 'pagamentosContadorPdfTotalFiltro', 'Total (filtro atual)'),
    docGerado: tx(safeT, 'pagamentosContadorPdfDocGerado', 'Documento gerado em'),
    instrucoesPrint: tx(
      safeT,
      'pagamentosContadorPdfInstrucoesPrint',
      'Use Ctrl+P (ou Cmd+P) para imprimir ou guardar como PDF.'
    ),
    estadoPago: tx(safeT, 'pagamentosContadorEstadoPago', 'Pago'),
    estadoPendente: tx(safeT, 'pagamentosContadorEstadoPendente', 'Pendente'),
  }
}

function labelCategoria(cat: CategoriaEntidadeContador, safeT: Props['safeT']): string {
  const map: Record<CategoriaEntidadeContador, string> = {
    irs: tx(safeT, 'pagamentosContadorCatIrs', CATEGORIA_LABEL.irs),
    seguranca_social: tx(safeT, 'pagamentosContadorCatSS', CATEGORIA_LABEL.seguranca_social),
    advogado: tx(safeT, 'pagamentosContadorCatAdvogado', CATEGORIA_LABEL.advogado),
    contabilista: tx(safeT, 'pagamentosContadorCatContabilista', CATEGORIA_LABEL.contabilista),
    seguros: tx(safeT, 'pagamentosContadorCatSeguros', CATEGORIA_LABEL.seguros),
    outro: tx(safeT, 'pagamentosContadorCatOutro', CATEGORIA_LABEL.outro),
  }
  return map[cat]
}

function emptyPagamentoForm(entidadeId = ''): Omit<PagamentoContador, 'id' | 'criadoEm' | 'atualizadoEm' | 'anexos' | 'entidadeNome'> & {
  anexos: AnexoContador[]
  entidadeNome: string
} {
  return {
    entidadeId,
    entidadeNome: '',
    dataPagamento: new Date().toISOString().slice(0, 10),
    valor: 0,
    periodoReferencia: '',
    numeroDocumento: '',
    descricao: '',
    status: 'pago',
    anexos: [],
  }
}

export function PagamentosContadorContent({
  saveData,
  loadData,
  safeT,
  localeLang,
  closeTab,
  activeTabId,
  isCompactLayout = false,
}: Props) {
  const dateLocale = localeDateShort(localeLang)
  const pdfDateLocale = documentPdfDateLocale(localeLang)
  const monthLocale = localeForLongDatetime(localeLang)
  const [view, setView] = useState<'pagamentos' | 'entidades'>('pagamentos')
  const [entidades, setEntidades] = useState<EntidadeContador[]>([])
  const [pagamentos, setPagamentos] = useState<PagamentoContador[]>([])
  const [loading, setLoading] = useState(true)

  const [filtroEntidade, setFiltroEntidade] = useState('')
  const [filtroPeriodoModo, setFiltroPeriodoModo] = useState<'todos' | 'mes' | 'intervalo'>('todos')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pago' | 'pendente'>('todos')
  const [busca, setBusca] = useState('')

  const [showPagamentoForm, setShowPagamentoForm] = useState(false)
  const [editingPagamentoId, setEditingPagamentoId] = useState<string | null>(null)
  const [pagamentoForm, setPagamentoForm] = useState(emptyPagamentoForm())

  const [entidadeForm, setEntidadeForm] = useState({
    nome: '',
    categoria: 'irs' as CategoriaEntidadeContador,
    nif: '',
    contacto: '',
    notas: '',
  })

  const anexoInputRef = useRef<HTMLInputElement>(null)

  const persistEntidades = useCallback(
    async (list: EntidadeContador[]) => {
      setEntidades(list)
      await saveData(STORAGE_ENTIDADES, list)
    },
    [saveData]
  )

  const persistPagamentos = useCallback(
    async (list: PagamentoContador[]) => {
      setPagamentos(list)
      await saveData(STORAGE_PAGAMENTOS, list)
    },
    [saveData]
  )

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      let ents = (await loadData(STORAGE_ENTIDADES)) as EntidadeContador[] | null
      if (!Array.isArray(ents) || ents.length === 0) {
        const now = new Date().toISOString()
        ents = getEntidadesPadrao(safeT).map((e, i) => ({
          ...e,
          id: `ent-pad-${i}-${Date.now()}`,
          criadoEm: now,
        }))
        await saveData(STORAGE_ENTIDADES, ents)
      }
      setEntidades(ents)

      const pags = (await loadData(STORAGE_PAGAMENTOS)) as PagamentoContador[] | null
      setPagamentos(Array.isArray(pags) ? pags : [])
    } catch {
      setEntidades([])
      setPagamentos([])
    } finally {
      setLoading(false)
    }
  }, [loadData, saveData, safeT])

  useEffect(() => {
    void carregar()
  }, [carregar, activeTabId])

  const entidadesAtivas = useMemo(() => entidades.filter(e => e.ativo), [entidades])

  const pagamentosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return [...pagamentos]
      .filter(p => {
        if (filtroEntidade && p.entidadeId !== filtroEntidade) return false
        if (filtroPeriodoModo === 'mes' && filtroMes && !p.dataPagamento.startsWith(filtroMes)) return false
        if (filtroPeriodoModo === 'intervalo') {
          if (filtroDataInicio && p.dataPagamento < filtroDataInicio) return false
          if (filtroDataFim && p.dataPagamento > filtroDataFim) return false
        }
        if (filtroStatus !== 'todos' && p.status !== filtroStatus) return false
        if (!q) return true
        const blob = [
          p.entidadeNome,
          p.periodoReferencia,
          p.numeroDocumento,
          p.descricao,
        ]
          .join(' ')
          .toLowerCase()
        return blob.includes(q)
      })
      .sort((a, b) => b.dataPagamento.localeCompare(a.dataPagamento))
  }, [
    pagamentos,
    filtroEntidade,
    filtroPeriodoModo,
    filtroMes,
    filtroDataInicio,
    filtroDataFim,
    filtroStatus,
    busca,
  ])

  const totais = useMemo(() => {
    let pago = 0
    let pendente = 0
    for (const p of pagamentosFiltrados) {
      if (p.status === 'pago') pago += p.valor
      else pendente += p.valor
    }
    return { pago, pendente, total: pago + pendente }
  }, [pagamentosFiltrados])

  const guardarEntidade = async () => {
    const nome = entidadeForm.nome.trim()
    if (!nome) {
      alert(tx(safeT, 'pagamentosContadorErroNomeEntidade', 'Indique o nome da entidade.'))
      return
    }
    const nova: EntidadeContador = {
      id: `ent-${Date.now()}`,
      nome,
      categoria: entidadeForm.categoria,
      nif: entidadeForm.nif.trim() || undefined,
      contacto: entidadeForm.contacto.trim() || undefined,
      notas: entidadeForm.notas.trim() || undefined,
      ativo: true,
      criadoEm: new Date().toISOString(),
    }
    await persistEntidades([...entidades, nova])
    setEntidadeForm({ nome: '', categoria: 'irs', nif: '', contacto: '', notas: '' })
  }

  const toggleEntidadeAtiva = async (id: string) => {
    const next = entidades.map(e => (e.id === id ? { ...e, ativo: !e.ativo } : e))
    await persistEntidades(next)
  }

  const removerEntidade = async (id: string) => {
    const usada = pagamentos.some(p => p.entidadeId === id)
    if (usada) {
      alert(
        tx(
          safeT,
          'pagamentosContadorErroEntidadeUsada',
          'Esta entidade tem pagamentos registados. Desative-a em vez de remover, ou apague os pagamentos primeiro.'
        )
      )
      return
    }
    if (!window.confirm(tx(safeT, 'pagamentosContadorConfirmarRemoverEntidade', 'Remover esta entidade?'))) return
    await persistEntidades(entidades.filter(e => e.id !== id))
  }

  const abrirNovoPagamento = () => {
    const firstId = entidadesAtivas[0]?.id ?? ''
    setEditingPagamentoId(null)
    setPagamentoForm(emptyPagamentoForm(firstId))
    setShowPagamentoForm(true)
  }

  const abrirEditarPagamento = (p: PagamentoContador) => {
    setEditingPagamentoId(p.id)
    setPagamentoForm({
      entidadeId: p.entidadeId,
      entidadeNome: p.entidadeNome,
      dataPagamento: p.dataPagamento,
      valor: p.valor,
      periodoReferencia: p.periodoReferencia,
      numeroDocumento: p.numeroDocumento ?? '',
      descricao: p.descricao ?? '',
      status: p.status,
      anexos: [...p.anexos],
    })
    setShowPagamentoForm(true)
  }

  const handleAnexoFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const novos: AnexoContador[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_ANEXO_BYTES) {
        alert(
          tx(safeT, 'pagamentosContadorErroAnexoGrande', 'Ficheiro demasiado grande (máx. 8 MB): ') + file.name
        )
        continue
      }
      const mime = file.type || 'application/octet-stream'
      if (!mime.startsWith('image/') && mime !== 'application/pdf') {
        alert(tx(safeT, 'pagamentosContadorErroAnexoTipo', 'Só imagens ou PDF: ') + file.name)
        continue
      }
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result ?? ''))
        r.onerror = () => reject(new Error('read'))
        r.readAsDataURL(file)
      })
      novos.push({
        id: `anx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nome: file.name,
        mime,
        base64,
        criadoEm: new Date().toISOString(),
      })
    }
    if (novos.length) {
      setPagamentoForm(prev => ({ ...prev, anexos: [...prev.anexos, ...novos] }))
    }
  }

  const removerAnexo = (anexoId: string) => {
    setPagamentoForm(prev => ({ ...prev, anexos: prev.anexos.filter(a => a.id !== anexoId) }))
  }

  const guardarPagamento = async () => {
    const ent = entidades.find(e => e.id === pagamentoForm.entidadeId)
    if (!ent) {
      alert(tx(safeT, 'pagamentosContadorErroEntidade', 'Selecione a entidade.'))
      return
    }
    if (!pagamentoForm.dataPagamento) {
      alert(tx(safeT, 'pagamentosContadorErroData', 'Indique a data do pagamento.'))
      return
    }
    if (!(pagamentoForm.valor > 0)) {
      alert(tx(safeT, 'pagamentosContadorErroValor', 'Indique um valor superior a zero.'))
      return
    }
    const now = new Date().toISOString()
    const payload: PagamentoContador = {
      id: editingPagamentoId ?? `pag-${Date.now()}`,
      entidadeId: ent.id,
      entidadeNome: ent.nome,
      dataPagamento: pagamentoForm.dataPagamento,
      valor: Math.round(pagamentoForm.valor * 100) / 100,
      periodoReferencia: pagamentoForm.periodoReferencia.trim(),
      numeroDocumento: pagamentoForm.numeroDocumento?.trim() || undefined,
      descricao: pagamentoForm.descricao?.trim() || undefined,
      status: pagamentoForm.status,
      anexos: pagamentoForm.anexos,
      criadoEm: editingPagamentoId
        ? pagamentos.find(p => p.id === editingPagamentoId)?.criadoEm ?? now
        : now,
      atualizadoEm: now,
    }
    const next = editingPagamentoId
      ? pagamentos.map(p => (p.id === editingPagamentoId ? payload : p))
      : [...pagamentos, payload]
    await persistPagamentos(next)
    setShowPagamentoForm(false)
    setEditingPagamentoId(null)
    setPagamentoForm(emptyPagamentoForm())
  }

  const removerPagamento = async (id: string) => {
    if (!window.confirm(tx(safeT, 'pagamentosContadorConfirmarRemoverPagamento', 'Remover este pagamento?'))) return
    await persistPagamentos(pagamentos.filter(p => p.id !== id))
  }

  const verAnexo = (a: AnexoContador) => {
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

  const gerarPdfContador = async () => {
    if (filtroPeriodoModo === 'mes' && !filtroMes) {
      alert(tx(safeT, 'pagamentosContadorPdfEscolhaMes', 'Escolha o mês no filtro «Por mês» antes de exportar.'))
      return
    }
    if (pagamentosFiltrados.length === 0) {
      alert(tx(safeT, 'pagamentosContadorPdfSemDados', 'Não há pagamentos no filtro atual para exportar.'))
      return
    }
    const resumoMap = new Map<string, ResumoEntidadePdf>()
    for (const p of pagamentosFiltrados) {
      const ent = entidades.find(e => e.id === p.entidadeId)
      const cat = ent ? labelCategoria(ent.categoria, safeT) : '—'
      const key = p.entidadeId || p.entidadeNome
      const cur = resumoMap.get(key) ?? {
        nome: p.entidadeNome,
        categoriaLabel: cat,
        totalPago: 0,
        totalPendente: 0,
        quantidade: 0,
      }
      cur.quantidade += 1
      if (p.status === 'pago') cur.totalPago += p.valor
      else cur.totalPendente += p.valor
      resumoMap.set(key, cur)
    }
    const resumoPorEntidade = [...resumoMap.values()].sort(
      (a, b) => b.totalPago + b.totalPendente - (a.totalPago + a.totalPendente)
    )
    const filtros: string[] = []
    if (filtroEntidade) {
      const nome = entidades.find(e => e.id === filtroEntidade)?.nome
      if (nome) filtros.push(`${tx(safeT, 'pagamentosContadorCampoEntidade', 'Entidade')}: ${nome}`)
    }
    const periodoDesc = descricaoPeriodoFiltro(
      safeT,
      monthLocale,
      dateLocale,
      filtroPeriodoModo,
      filtroMes,
      filtroDataInicio,
      filtroDataFim
    )
    if (periodoDesc) filtros.push(periodoDesc)
    if (filtroStatus !== 'todos') {
      filtros.push(
        `${tx(safeT, 'pagamentosContadorCampoEstado', 'Estado')}: ${
          filtroStatus === 'pago'
            ? tx(safeT, 'pagamentosContadorEstadoPago', 'Pago')
            : tx(safeT, 'pagamentosContadorEstadoPendente', 'Pendente')
        }`
      )
    }
    if (busca.trim()) filtros.push(`${tx(safeT, 'pagamentosContadorBusca', 'Pesquisa')}: ${busca.trim()}`)
    const payload = {
      pagamentos: pagamentosFiltrados.map(p => {
        const ent = entidades.find(e => e.id === p.entidadeId)
        return {
          id: p.id,
          entidadeId: p.entidadeId,
          entidadeNome: p.entidadeNome,
          categoriaLabel: ent ? labelCategoria(ent.categoria, safeT) : '—',
          dataPagamento: p.dataPagamento,
          valor: p.valor,
          periodoReferencia: p.periodoReferencia,
          numeroDocumento: p.numeroDocumento,
          descricao: p.descricao,
          status: p.status,
          anexosNomes: p.anexos.map(a => a.nome),
        }
      }),
      totalPago: totais.pago,
      totalPendente: totais.pendente,
      totalGeral: totais.total,
      resumoPorEntidade,
      periodo: periodoDesc,
      filtrosDescricao: filtros.join(' · ') || undefined,
      tituloRelatorio: tx(safeT, 'pagamentosContadorTitle', 'PAGAMENTOS AO CONTADOR'),
      notaRodape: tx(
        safeT,
        'pagamentosContadorPdfNotaRodape',
        'Relatório para entrega ao contabilista. Os documentos originais (PDF/fotos) estão anexados no sistema por cada linha indicada.'
      ),
      locale: pdfDateLocale,
      htmlLang: pdfDateLocale,
      labels: buildPdfLabels(safeT),
    }
    try {
      const res = await fetch('/api/pdf/pagamentos-contador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      const html = await res.text()
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(html)
        w.document.close()
      } else {
        alert(tx(safeT, 'pagamentosContadorPdfPopup', 'Permita pop-ups para abrir o PDF.'))
      }
    } catch (e) {
      console.error(e)
      alert(tx(safeT, 'pagamentosContadorPdfErro', 'Erro ao gerar PDF. Tente novamente.'))
    }
  }

  const pad = isCompactLayout ? '12px 10px' : '24px 28px'

  if (loading) {
    return (
      <div className="pagamentos-contador-panel" style={{ padding: pad, color: '#aaa' }}>
        {tx(safeT, 'pagamentosContadorCarregando', 'A carregar…')}
      </div>
    )
  }

  return (
    <div className="pagamentos-contador-panel" style={{ padding: pad, maxWidth: '1200px', margin: '0 auto' }}>
      <header className="pagamentos-contador-hero">
        <div>
          <h1 className="pagamentos-contador-hero__title">
            {tx(safeT, 'pagamentosContadorTitle', 'PAGAMENTOS AO CONTADOR')}
          </h1>
          <p className="pagamentos-contador-hero__sub">
            {tx(
              safeT,
              'pagamentosContadorDesc',
              'Registe pagamentos a entidades fiscais e profissionais (IRS, Segurança Social, advogado, contabilista) e anexe faturas/recibos contabilísticos.'
            )}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary pagamentos-contador-hero__close"
          onClick={() => activeTabId && closeTab(activeTabId)}
          title={tx(safeT, 'voltar', 'Voltar')}
        >
          ↶
        </button>
      </header>

      <div className="pagamentos-contador-tabs">
        <button
          type="button"
          className={`pagamentos-contador-tabs__btn${view === 'pagamentos' ? ' pagamentos-contador-tabs__btn--active' : ''}`}
          onClick={() => setView('pagamentos')}
        >
          {tx(safeT, 'pagamentosContadorTabPagamentos', 'Pagamentos')}
        </button>
        <button
          type="button"
          className={`pagamentos-contador-tabs__btn${view === 'entidades' ? ' pagamentos-contador-tabs__btn--active' : ''}`}
          onClick={() => setView('entidades')}
        >
          {tx(safeT, 'pagamentosContadorTabEntidades', 'Entidades')}
        </button>
      </div>

      {view === 'entidades' ? (
        <div className="pagamentos-contador-card">
          <h2 className="pagamentos-contador-card__title">
            {tx(safeT, 'pagamentosContadorEntidadesTitulo', 'Cadastro de entidades')}
          </h2>
          <p className="pagamentos-contador-card__hint">
            {tx(
              safeT,
              'pagamentosContadorEntidadesHint',
              'Cadastre quem recebe os pagamentos (Finanças, SS, advogado, TOC, etc.). Pode desativar sem apagar o histórico.'
            )}
          </p>

          <div className="pagamentos-contador-form-grid">
            <label>
              {tx(safeT, 'pagamentosContadorEntidadeNome', 'Nome')}
              <input
                value={entidadeForm.nome}
                onChange={e => setEntidadeForm(f => ({ ...f, nome: e.target.value }))}
                placeholder={tx(safeT, 'pagamentosContadorEntidadeNomePh', 'Ex.: Dr. Silva — Advogado')}
              />
            </label>
            <label>
              {tx(safeT, 'pagamentosContadorEntidadeCategoria', 'Tipo')}
              <select
                value={entidadeForm.categoria}
                onChange={e =>
                  setEntidadeForm(f => ({ ...f, categoria: e.target.value as CategoriaEntidadeContador }))
                }
              >
                {(Object.keys(CATEGORIA_LABEL) as CategoriaEntidadeContador[]).map(cat => (
                  <option key={cat} value={cat}>
                    {labelCategoria(cat, safeT)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              NIF
              <input
                value={entidadeForm.nif}
                onChange={e => setEntidadeForm(f => ({ ...f, nif: e.target.value }))}
                placeholder="Opcional"
              />
            </label>
            <label>
              {tx(safeT, 'pagamentosContadorEntidadeContacto', 'Contacto')}
              <input
                value={entidadeForm.contacto}
                onChange={e => setEntidadeForm(f => ({ ...f, contacto: e.target.value }))}
                placeholder="Email / telefone"
              />
            </label>
            <label className="pagamentos-contador-form-grid__full">
              {tx(safeT, 'pagamentosContadorEntidadeNotas', 'Notas')}
              <textarea
                value={entidadeForm.notas}
                onChange={e => setEntidadeForm(f => ({ ...f, notas: e.target.value }))}
                rows={2}
              />
            </label>
          </div>
          <button type="button" className="btn-primary pagamentos-contador-btn-add" onClick={() => void guardarEntidade()}>
            + {tx(safeT, 'pagamentosContadorEntidadeAdicionar', 'Adicionar entidade')}
          </button>

          <div className="pagamentos-contador-entidades-list">
            {entidades.map(ent => (
              <div
                key={ent.id}
                className={`pagamentos-contador-entidade${ent.ativo ? '' : ' pagamentos-contador-entidade--inativa'}`}
                style={{ borderLeftColor: CATEGORIA_COR[ent.categoria] }}
              >
                <div className="pagamentos-contador-entidade__head">
                  <strong>{ent.nome}</strong>
                  <span
                    className="pagamentos-contador-entidade__cat"
                    style={{ color: CATEGORIA_COR[ent.categoria] }}
                  >
                    {labelCategoria(ent.categoria, safeT)}
                  </span>
                </div>
                {(ent.nif || ent.contacto) && (
                  <div className="pagamentos-contador-entidade__meta">
                    {ent.nif ? `NIF: ${ent.nif}` : ''}
                    {ent.nif && ent.contacto ? ' · ' : ''}
                    {ent.contacto ?? ''}
                  </div>
                )}
                {ent.notas ? <div className="pagamentos-contador-entidade__notas">{ent.notas}</div> : null}
                <div className="pagamentos-contador-entidade__actions">
                  <button type="button" className="pagamentos-contador-btn-sm" onClick={() => void toggleEntidadeAtiva(ent.id)}>
                    {ent.ativo
                      ? tx(safeT, 'pagamentosContadorDesativar', 'Desativar')
                      : tx(safeT, 'pagamentosContadorAtivar', 'Ativar')}
                  </button>
                  <button type="button" className="pagamentos-contador-btn-sm pagamentos-contador-btn-sm--danger" onClick={() => void removerEntidade(ent.id)}>
                    {tx(safeT, 'remover', 'Remover')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="pagamentos-contador-resumo">
            <div className="pagamentos-contador-resumo__item pagamentos-contador-resumo__item--pago">
              <span>{tx(safeT, 'pagamentosContadorTotalPago', 'Pago')}</span>
              <strong>€{totais.pago.toFixed(2)}</strong>
            </div>
            <div className="pagamentos-contador-resumo__item pagamentos-contador-resumo__item--pend">
              <span>{tx(safeT, 'pagamentosContadorTotalPendente', 'Pendente')}</span>
              <strong>€{totais.pendente.toFixed(2)}</strong>
            </div>
            <div className="pagamentos-contador-resumo__item">
              <span>{tx(safeT, 'pagamentosContadorTotalFiltrado', 'Total (filtro)')}</span>
              <strong>€{totais.total.toFixed(2)}</strong>
            </div>
          </div>

          <div className="pagamentos-contador-toolbar">
            <input
              type="search"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder={tx(safeT, 'pagamentosContadorBusca', 'Pesquisar…')}
              className="pagamentos-contador-toolbar__search"
            />
            <select value={filtroEntidade} onChange={e => setFiltroEntidade(e.target.value)}>
              <option value="">{tx(safeT, 'pagamentosContadorTodasEntidades', 'Todas as entidades')}</option>
              {entidadesAtivas.map(e => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
            <select
              value={filtroPeriodoModo}
              onChange={e => setFiltroPeriodoModo(e.target.value as 'todos' | 'mes' | 'intervalo')}
              title={tx(safeT, 'pagamentosContadorFiltroPeriodoTitulo', 'Filtrar por período')}
            >
              <option value="todos">{tx(safeT, 'pagamentosContadorPeriodoTodos', 'Todos os períodos')}</option>
              <option value="mes">{tx(safeT, 'pagamentosContadorPeriodoMes', 'Por mês')}</option>
              <option value="intervalo">{tx(safeT, 'pagamentosContadorPeriodoIntervalo', 'Por datas')}</option>
            </select>
            {filtroPeriodoModo === 'mes' ? (
              <input
                type="month"
                value={filtroMes}
                onChange={e => setFiltroMes(e.target.value)}
                title={tx(safeT, 'pagamentosContadorFiltroMes', 'Mês')}
                aria-label={tx(safeT, 'pagamentosContadorFiltroMes', 'Mês')}
              />
            ) : null}
            {filtroPeriodoModo === 'intervalo' ? (
              <>
                <input
                  type="date"
                  value={filtroDataInicio}
                  onChange={e => setFiltroDataInicio(e.target.value)}
                  title={tx(safeT, 'pagamentosContadorFiltroDesde', 'Desde')}
                  aria-label={tx(safeT, 'pagamentosContadorFiltroDesde', 'Desde')}
                />
                <input
                  type="date"
                  value={filtroDataFim}
                  onChange={e => setFiltroDataFim(e.target.value)}
                  title={tx(safeT, 'pagamentosContadorFiltroAte', 'Até')}
                  aria-label={tx(safeT, 'pagamentosContadorFiltroAte', 'Até')}
                />
              </>
            ) : null}
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value as 'todos' | 'pago' | 'pendente')}
            >
              <option value="todos">{tx(safeT, 'pagamentosContadorTodosEstados', 'Todos')}</option>
              <option value="pago">{tx(safeT, 'pagamentosContadorEstadoPago', 'Pago')}</option>
              <option value="pendente">{tx(safeT, 'pagamentosContadorEstadoPendente', 'Pendente')}</option>
            </select>
            <button type="button" className="btn-primary pagamentos-contador-btn-add" onClick={abrirNovoPagamento}>
              + {tx(safeT, 'pagamentosContadorNovoPagamento', 'Novo pagamento')}
            </button>
            <button
              type="button"
              className="btn-primary pagamentos-contador-btn-pdf"
              onClick={() => void gerarPdfContador()}
              title={tx(
                safeT,
                'pagamentosContadorPdfHint',
                'Gera PDF com os pagamentos visíveis conforme os filtros (mês, datas, entidade, estado).'
              )}
            >
              📄 {tx(safeT, 'pagamentosContadorExportarPdf', 'Exportar PDF p/ contador')}
            </button>
          </div>
          <p className="pagamentos-contador-toolbar-hint">
            {tx(
              safeT,
              'pagamentosContadorPdfHint',
              'O PDF inclui só os pagamentos do filtro atual. Use «Por mês» para relatório mensal ou «Por datas» para um intervalo (ex.: trimestre).'
            )}
          </p>

          {pagamentosFiltrados.length === 0 ? (
            <div className="pagamentos-contador-empty">
              {tx(safeT, 'pagamentosContadorSemPagamentos', 'Nenhum pagamento registado. Use «Novo pagamento» para começar.')}
            </div>
          ) : (
            <div className="pagamentos-contador-lista">
              {pagamentosFiltrados.map(p => {
                const ent = entidades.find(e => e.id === p.entidadeId)
                const cor = ent ? CATEGORIA_COR[ent.categoria] : '#94a3b8'
                return (
                  <article
                    key={p.id}
                    className="pagamentos-contador-item"
                    style={{ borderLeftColor: cor }}
                  >
                    <div className="pagamentos-contador-item__main">
                      <div className="pagamentos-contador-item__top">
                        <strong>{p.entidadeNome}</strong>
                        <span
                          className={`pagamentos-contador-item__status pagamentos-contador-item__status--${p.status}`}
                        >
                          {p.status === 'pago'
                            ? tx(safeT, 'pagamentosContadorEstadoPago', 'Pago')
                            : tx(safeT, 'pagamentosContadorEstadoPendente', 'Pendente')}
                        </span>
                      </div>
                      <div className="pagamentos-contador-item__meta">
                        {new Date(p.dataPagamento + 'T12:00:00').toLocaleDateString(dateLocale)}
                        {p.periodoReferencia ? ` · ${p.periodoReferencia}` : ''}
                        {p.numeroDocumento ? ` · Doc. ${p.numeroDocumento}` : ''}
                      </div>
                      {p.descricao ? <p className="pagamentos-contador-item__desc">{p.descricao}</p> : null}
                      {p.anexos.length > 0 && (
                        <div className="pagamentos-contador-item__anexos">
                          {p.anexos.map(a => (
                            <button
                              key={a.id}
                              type="button"
                              className="pagamentos-contador-anexo-chip"
                              onClick={() => verAnexo(a)}
                            >
                              📎 {a.nome}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="pagamentos-contador-item__side">
                      <div className="pagamentos-contador-item__valor">€{p.valor.toFixed(2)}</div>
                      <button type="button" className="pagamentos-contador-btn-sm" onClick={() => abrirEditarPagamento(p)}>
                        {tx(safeT, 'editar', 'Editar')}
                      </button>
                      <button
                        type="button"
                        className="pagamentos-contador-btn-sm pagamentos-contador-btn-sm--danger"
                        onClick={() => void removerPagamento(p.id)}
                      >
                        {tx(safeT, 'remover', 'Remover')}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      {showPagamentoForm && (
        <div className="pagamentos-contador-modal-backdrop" onClick={() => setShowPagamentoForm(false)}>
          <div className="pagamentos-contador-modal" onClick={e => e.stopPropagation()}>
            <h3>
              {editingPagamentoId
                ? tx(safeT, 'pagamentosContadorEditarPagamento', 'Editar pagamento')
                : tx(safeT, 'pagamentosContadorNovoPagamento', 'Novo pagamento')}
            </h3>
            <div className="pagamentos-contador-form-grid">
              <label>
                {tx(safeT, 'pagamentosContadorCampoEntidade', 'Entidade')}
                <select
                  value={pagamentoForm.entidadeId}
                  onChange={e => setPagamentoForm(f => ({ ...f, entidadeId: e.target.value }))}
                >
                  <option value="">—</option>
                  {entidadesAtivas.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {tx(safeT, 'pagamentosContadorCampoData', 'Data pagamento')}
                <input
                  type="date"
                  value={pagamentoForm.dataPagamento}
                  onChange={e => setPagamentoForm(f => ({ ...f, dataPagamento: e.target.value }))}
                />
              </label>
              <label>
                {tx(safeT, 'pagamentosContadorCampoValor', 'Valor (€)')}
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={pagamentoForm.valor || ''}
                  onChange={e => setPagamentoForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
                />
              </label>
              <label>
                {tx(safeT, 'pagamentosContadorCampoPeriodo', 'Período / referência')}
                <input
                  value={pagamentoForm.periodoReferencia}
                  onChange={e => setPagamentoForm(f => ({ ...f, periodoReferencia: e.target.value }))}
                  placeholder={tx(safeT, 'pagamentosContadorCampoPeriodoPh', 'Ex.: IRS 2025, SS Março 2026')}
                />
              </label>
              <label>
                {tx(safeT, 'pagamentosContadorCampoNumDoc', 'N.º fatura / recibo')}
                <input
                  value={pagamentoForm.numeroDocumento}
                  onChange={e => setPagamentoForm(f => ({ ...f, numeroDocumento: e.target.value }))}
                />
              </label>
              <label>
                {tx(safeT, 'pagamentosContadorCampoEstado', 'Estado')}
                <select
                  value={pagamentoForm.status}
                  onChange={e =>
                    setPagamentoForm(f => ({ ...f, status: e.target.value as 'pago' | 'pendente' }))
                  }
                >
                  <option value="pago">{tx(safeT, 'pagamentosContadorEstadoPago', 'Pago')}</option>
                  <option value="pendente">{tx(safeT, 'pagamentosContadorEstadoPendente', 'Pendente')}</option>
                </select>
              </label>
              <label className="pagamentos-contador-form-grid__full">
                {tx(safeT, 'pagamentosContadorCampoDescricao', 'Descrição')}
                <textarea
                  value={pagamentoForm.descricao}
                  onChange={e => setPagamentoForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={2}
                />
              </label>
            </div>

            <div className="pagamentos-contador-anexos-block">
              <div className="pagamentos-contador-anexos-block__head">
                <strong>{tx(safeT, 'pagamentosContadorAnexos', 'Faturas / documentos contabilísticos')}</strong>
                <button
                  type="button"
                  className="pagamentos-contador-btn-sm"
                  onClick={() => anexoInputRef.current?.click()}
                >
                  📎 {tx(safeT, 'pagamentosContadorAnexar', 'Anexar PDF ou imagem')}
                </button>
                <input
                  ref={anexoInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  hidden
                  onChange={e => {
                    void handleAnexoFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </div>
              {pagamentoForm.anexos.length === 0 ? (
                <p className="pagamentos-contador-anexos-block__empty">
                  {tx(safeT, 'pagamentosContadorSemAnexos', 'Nenhum anexo. PDF ou foto da fatura do contabilista.')}
                </p>
              ) : (
                <ul className="pagamentos-contador-anexos-list">
                  {pagamentoForm.anexos.map(a => (
                    <li key={a.id}>
                      <button type="button" className="pagamentos-contador-anexo-chip" onClick={() => verAnexo(a)}>
                        {a.nome}
                      </button>
                      <button type="button" className="pagamentos-contador-btn-sm pagamentos-contador-btn-sm--danger" onClick={() => removerAnexo(a.id)}>
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pagamentos-contador-modal__actions">
              <button type="button" className="btn-primary" onClick={() => void guardarPagamento()}>
                {tx(safeT, 'guardar', 'Guardar')}
              </button>
              <button type="button" className="pagamentos-contador-btn-sm" onClick={() => setShowPagamentoForm(false)}>
                {tx(safeT, 'cancelar', 'Cancelar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NonatoBrandLogo } from './NonatoBrandLogo'
import { loadData, saveData } from '../utils/dataStorage'

export const BIBLIA_NONATO_STORAGE_KEY = 'nonato-biblia-nonato-service'

/** Anexo guardado em base64 (data URL) junto aos dados da Bíblia — mesmo limite prático do armazenamento local. */
export type BibliaAnexo = {
  id: string
  nome: string
  mime: string
  dataUrl: string
}

export type BibliaMarcaLinha = {
  id: string
  titulo: string
  modelosTexto: string
  ordem: number
  anexos: BibliaAnexo[]
}

const BIBLIA_ANEXO_MAX_POR_LINHA = 24
const BIBLIA_ANEXO_MAX_BYTES = 6 * 1024 * 1024 // ~6 MB por ficheiro

const MIME_ANEXO_PERMITIDO = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function mimePorNomeFicheiro(nome: string): string | null {
  const n = nome.toLowerCase()
  if (n.endsWith('.pdf')) return 'application/pdf'
  if (n.endsWith('.doc')) return 'application/msword'
  if (n.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg'
  if (n.endsWith('.png')) return 'image/png'
  if (n.endsWith('.gif')) return 'image/gif'
  if (n.endsWith('.webp')) return 'image/webp'
  return null
}

function ficheiroAnexoPermitido(file: File): boolean {
  if (file.type && MIME_ANEXO_PERMITIDO.has(file.type)) return true
  const m = mimePorNomeFicheiro(file.name)
  return m !== null && MIME_ANEXO_PERMITIDO.has(m)
}

function mimeParaGuardar(file: File): string {
  if (file.type && MIME_ANEXO_PERMITIDO.has(file.type)) return file.type
  return mimePorNomeFicheiro(file.name) || 'application/octet-stream'
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result ?? ''))
    r.onerror = () => reject(r.error ?? new Error('FileReader'))
    r.readAsDataURL(file)
  })
}

function normalizeAnexo(raw: unknown): BibliaAnexo | null {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const dataUrl = typeof o.dataUrl === 'string' ? o.dataUrl : ''
  if (!dataUrl.startsWith('data:')) return null
  return {
    id: typeof o.id === 'string' && o.id ? o.id : newId(),
    nome: typeof o.nome === 'string' ? o.nome.slice(0, 200) : 'ficheiro',
    mime: typeof o.mime === 'string' ? o.mime : 'application/octet-stream',
    dataUrl,
  }
}

export type BibliaFamiliaRow = {
  id: string
  nome: string
  ordem: number
  linhas: BibliaMarcaLinha[]
}

type BibliaPayload = { familias: BibliaFamiliaRow[]; updatedAt?: string }

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {
    /* ignore */
  }
  return `bn-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function normalizeLinha(raw: unknown, fallbackOrdem: number): BibliaMarcaLinha {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const anexosRaw = o.anexos
  const anexosArr = Array.isArray(anexosRaw) ? anexosRaw : []
  const anexos = anexosArr.map(normalizeAnexo).filter(Boolean) as BibliaAnexo[]
  return {
    id: typeof o.id === 'string' && o.id ? o.id : newId(),
    titulo: typeof o.titulo === 'string' ? o.titulo : '',
    modelosTexto: typeof o.modelosTexto === 'string' ? o.modelosTexto : '',
    ordem: typeof o.ordem === 'number' ? o.ordem : fallbackOrdem,
    anexos,
  }
}

function normalizeFamilia(raw: unknown, fallbackOrdem: number): BibliaFamiliaRow | null {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const nome = typeof o.nome === 'string' ? o.nome.trim() : ''
  const gruposLegacy = (o as { grupos?: unknown }).grupos
  const linhasRaw = o.linhas !== undefined ? o.linhas : gruposLegacy
  const linhasArr = Array.isArray(linhasRaw) ? linhasRaw : []
  const linhas = linhasArr.map((r, i) => normalizeLinha(r, i)).sort((a, b) => a.ordem - b.ordem)
  return {
    id: typeof o.id === 'string' && o.id ? o.id : newId(),
    nome,
    ordem: typeof o.ordem === 'number' ? o.ordem : fallbackOrdem,
    linhas: linhas.length ? linhas : [{ id: newId(), titulo: '', modelosTexto: '', ordem: 0, anexos: [] }],
  }
}

async function loadPayload(): Promise<BibliaPayload> {
  try {
    const raw = await loadData(BIBLIA_NONATO_STORAGE_KEY)
    if (!raw) return { familias: [] }
    const p =
      typeof raw === 'string'
        ? (JSON.parse(raw) as BibliaPayload)
        : (raw as BibliaPayload)
    const fa = Array.isArray(p?.familias) ? p.familias : []
    const familias = fa.map((f, i) => normalizeFamilia(f, i)).filter(Boolean) as BibliaFamiliaRow[]
    return { familias, updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : undefined }
  } catch {
    return { familias: [] }
  }
}

type BibliaNonatoServiceContentProps = {
  t: Record<string, string | undefined>
  onClose: () => void
  onHome: () => void
}

export function BibliaNonatoServiceContent({ t, onClose, onHome }: BibliaNonatoServiceContentProps) {
  const tr = useCallback((k: string, fb: string) => String(t[k] ?? fb), [t])

  const [loaded, setLoaded] = useState(false)
  const [familias, setFamilias] = useState<BibliaFamiliaRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attachTargetRef = useRef<{ familiaId: string; linhaId: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let ok = true
    ;(async () => {
      const payload = await loadPayload()
      if (!ok) return
      setFamilias(payload.familias)
      const first = payload.familias[0]?.id ?? null
      setSelectedId((prev) => (prev && payload.familias.some((f) => f.id === prev) ? prev : first))
      setLoaded(true)
    })()
    return () => {
      ok = false
    }
  }, [])

  const persist = useCallback(async (next: BibliaFamiliaRow[]) => {
    await saveData(BIBLIA_NONATO_STORAGE_KEY, {
      familias: next,
      updatedAt: new Date().toISOString(),
    }).catch(() => {})
  }, [])

  const scheduleSave = useCallback(
    (next: BibliaFamiliaRow[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        persist(next).catch(() => {})
      }, 380)
    },
    [persist]
  )

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const q = busca.trim().toLowerCase()
  const familiasFiltradas = useMemo(() => {
    if (!q) return familias
    return familias.filter((f) => {
      const nomeHit = (f.nome || '').toLowerCase().includes(q)
      const linhaHit = f.linhas.some((l) => {
        if ((l.titulo || '').toLowerCase().includes(q)) return true
        if ((l.modelosTexto || '').toLowerCase().includes(q)) return true
        return (l.anexos || []).some((a) => (a.nome || '').toLowerCase().includes(q))
      })
      return nomeHit || linhaHit
    })
  }, [familias, q])

  const selected = familias.find((f) => f.id === selectedId) ?? familiasFiltradas[0]

  const setFamiliasAndSave = useCallback(
    (updater: (prev: BibliaFamiliaRow[]) => BibliaFamiliaRow[]) => {
      setFamilias((prev) => {
        const next = updater(prev)
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave]
  )

  const addFamilia = useCallback(() => {
    const novo: BibliaFamiliaRow = {
      id: newId(),
      nome: '',
      ordem: familias.length,
      linhas: [{ id: newId(), titulo: '', modelosTexto: '', ordem: 0, anexos: [] }],
    }
    setFamiliasAndSave((prev) => [...prev, novo])
    setSelectedId(novo.id)
  }, [familias.length, setFamiliasAndSave])

  const removeFamilia = useCallback(
    (id: string) => {
      setFamiliasAndSave((prev) => {
        const next = prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, ordem: i }))
        if (selectedId === id && next.length) setSelectedId(next[0].id)
        else if (!next.length) setSelectedId(null)
        return next
      })
    },
    [selectedId, setFamiliasAndSave]
  )

  const moveFamilia = useCallback(
    (id: string, dir: -1 | 1) => {
      setFamiliasAndSave((prev) => {
        const idx = prev.findIndex((f) => f.id === id)
        const j = idx + dir
        if (idx < 0 || j < 0 || j >= prev.length) return prev
        const cp = [...prev]
        const tmp = cp[idx]
        cp[idx] = cp[j]!
        cp[j] = tmp!
        return cp.map((f, i) => ({ ...f, ordem: i }))
      })
    },
    [setFamiliasAndSave]
  )

  const updateFamiliaNome = useCallback(
    (id: string, nome: string) => {
      setFamiliasAndSave((prev) => prev.map((f) => (f.id === id ? { ...f, nome } : f)))
    },
    [setFamiliasAndSave]
  )

  const addLinha = useCallback(
    (familiaId: string) => {
      setFamiliasAndSave((prev) =>
        prev.map((f) => {
          if (f.id !== familiaId) return f
          const ordem = f.linhas.length
          return { ...f, linhas: [...f.linhas, { id: newId(), titulo: '', modelosTexto: '', ordem, anexos: [] }] }
        })
      )
    },
    [setFamiliasAndSave]
  )

  const removeLinha = useCallback(
    (familiaId: string, linhaId: string) => {
      setFamiliasAndSave((prev) =>
        prev.map((f) => {
          if (f.id !== familiaId) return f
          const linhas = f.linhas.filter((l) => l.id !== linhaId).map((l, i) => ({ ...l, ordem: i }))
          return {
            ...f,
            linhas:
              linhas.length > 0 ? linhas : [{ id: newId(), titulo: '', modelosTexto: '', ordem: 0, anexos: [] }],
          }
        })
      )
    },
    [setFamiliasAndSave]
  )

  const updateLinha = useCallback(
    (
      familiaId: string,
      linhaId: string,
      patch: Partial<Pick<BibliaMarcaLinha, 'titulo' | 'modelosTexto' | 'anexos'>>
    ) => {
      setFamiliasAndSave((prev) =>
        prev.map((f) => {
          if (f.id !== familiaId) return f
          return {
            ...f,
            linhas: f.linhas.map((l) => (l.id === linhaId ? { ...l, ...patch } : l)),
          }
        })
      )
    },
    [setFamiliasAndSave]
  )

  const clickAdicionarAnexos = useCallback((familiaId: string, linhaId: string) => {
    attachTargetRef.current = { familiaId, linhaId }
    fileInputRef.current?.click()
  }, [])

  const onAnexosSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const alvo = attachTargetRef.current
      attachTargetRef.current = null
      const input = e.target
      const list = input.files
      input.value = ''
      if (!alvo || !list?.length) return

      const collected: BibliaAnexo[] = []

      for (let i = 0; i < list.length; i++) {
        const file = list[i]!
        if (!ficheiroAnexoPermitido(file)) {
          window.alert(tr('bibliaNonatoAnexoTipoNaoPermitido', 'Tipo de ficheiro não permitido. Use PDF, Word ou imagem.'))
          continue
        }
        if (file.size > BIBLIA_ANEXO_MAX_BYTES) {
          window.alert(tr('bibliaNonatoAnexoLimiteFicheiro', 'Ficheiro demasiado grande (máx. ~6 MB por ficheiro).'))
          continue
        }
        try {
          const dataUrl = await readFileAsDataUrl(file)
          if (!dataUrl.startsWith('data:')) continue
          collected.push({
            id: newId(),
            nome: file.name.slice(0, 200) || 'ficheiro',
            mime: mimeParaGuardar(file),
            dataUrl,
          })
        } catch {
          window.alert(tr('bibliaNonatoAnexoErroLeitura', 'Não foi possível ler o ficheiro.'))
        }
      }

      if (!collected.length) return

      setFamiliasAndSave((prev) => {
        const fam = prev.find((f) => f.id === alvo.familiaId)
        const lin = fam?.linhas.find((l) => l.id === alvo.linhaId)
        if (!fam || !lin) return prev
        const existentes = lin.anexos || []
        const room = Math.max(0, BIBLIA_ANEXO_MAX_POR_LINHA - existentes.length)
        if (room <= 0) {
          queueMicrotask(() =>
            window.alert(tr('bibliaNonatoAnexoLimiteQuantidade', 'Limite de anexos por linha atingido.'))
          )
          return prev
        }
        const add = collected.slice(0, room)
        if (collected.length > room) {
          queueMicrotask(() =>
            window.alert(
              tr(
                'bibliaNonatoAnexoParcial',
                'Só couberam alguns ficheiros: limite de anexos por linha.'
              )
            )
          )
        }
        return prev.map((f) => {
          if (f.id !== alvo.familiaId) return f
          return {
            ...f,
            linhas: f.linhas.map((l) =>
              l.id === alvo.linhaId ? { ...l, anexos: [...existentes, ...add] } : l
            ),
          }
        })
      })
    },
    [tr, setFamiliasAndSave]
  )

  const removerAnexo = useCallback(
    (familiaId: string, linhaId: string, anexoId: string) => {
      setFamiliasAndSave((prev) =>
        prev.map((f) => {
          if (f.id !== familiaId) return f
          return {
            ...f,
            linhas: f.linhas.map((l) =>
              l.id === linhaId
                ? { ...l, anexos: (l.anexos || []).filter((a) => a.id !== anexoId) }
                : l
            ),
          }
        })
      )
    },
    [setFamiliasAndSave]
  )

  const btnOutline: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid rgba(0, 255, 120, 0.42)',
    backgroundColor: 'rgba(0, 28, 12, 0.72)',
    color: '#e6ffe8',
    fontWeight: 600,
  }

  const btnDanger: React.CSSProperties = {
    ...btnOutline,
    border: '1px solid rgba(255, 90, 90, 0.45)',
    backgroundColor: 'rgba(40, 14, 14, 0.72)',
    color: '#fecaca',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(148, 163, 184, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    color: '#f1f5f9',
    fontSize: '13px',
    boxSizing: 'border-box',
  }

  if (!loaded) {
    return (
      <div className="tab-content-wrapper tab-glass-root" style={{ minHeight: '320px', padding: '40px', color: '#94a3b8' }}>
        {tr('bibliaNonatoCarregando', 'A carregar…')}
      </div>
    )
  }

  return (
    <div className="tab-content-wrapper tab-glass-root" style={{ minHeight: '520px' }}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
        style={{ display: 'none' }}
        aria-hidden
        onChange={onAnexosSelected}
      />
      <div className="tab-glass-hero tab-glass-hero--compact">
        <div className="tab-glass-hero-top" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
            <NonatoBrandLogo
              variant="original"
              alt=""
              aria-hidden
              style={{
                height: 44,
                width: 'auto',
                maxWidth: 'min(200px, 38vw)',
                display: 'block',
                objectFit: 'contain',
              }}
            />
          </div>
          <div className="tab-glass-hero-heading">
            <h1 className="tab-glass-hero-title" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.2rem)' }}>
              {tr('bibliaNonatoServiceTitle', 'Bíblia da Nonato Service')}
            </h1>
            <p className="tab-glass-hero-meta" style={{ fontSize: '12px' }}>
              {tr('bibliaNonatoServiceSubtitle', 'Famílias, marcas e modelos — só para o seu uso diário.')}
            </p>
          </div>
          <div className="tab-glass-hero-actions">
            <div className="tab-glass-hero-actions-row">
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '6px 8px',
                  fontSize: '16px',
                  backgroundColor: 'rgba(0, 255, 0, 0.06)',
                  border: '1px solid rgba(0, 255, 0, 0.55)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={tr('voltar', 'Voltar')}
              >
                ↶
              </button>
              <button
                type="button"
                onClick={onHome}
                style={{
                  padding: '6px 8px',
                  fontSize: '16px',
                  backgroundColor: 'rgba(0, 150, 255, 0.06)',
                  border: '1px solid rgba(0, 150, 255, 0.55)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={tr('paginaInicial', 'Página Inicial')}
              >
                🏠
              </button>
            </div>
          </div>
        </div>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', marginBottom: '14px', maxWidth: '920px' }}>
        {tr('bibliaNonatoServiceDesc', 'Crie famílias de equipamentos e, dentro de cada uma, linhas por marca ou uma lista única de modelos.')}
      </p>

      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder={tr('bibliaNonatoPesquisaPlaceholder', 'Pesquisar em todas as famílias…')}
        style={{ ...inputStyle, maxWidth: '440px', marginBottom: '18px' }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '18px',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(94, 234, 212, 0.22)',
            background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.55) 100%)',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#5eead4' }}>
              {tr('bibliaNonatoFamiliasLista', 'FAMÍLIAS')}
            </span>
            <button type="button" style={{ ...btnOutline, padding: '6px 10px', fontSize: '11px' }} onClick={addFamilia}>
              + {tr('bibliaNonatoNovaFamilia', 'Nova')}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {familiasFiltradas.length === 0 ? (
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                {tr('bibliaNonatoSemFamilias', 'Ainda não há famílias. Clique em «Nova».')}
              </p>
            ) : (
              familiasFiltradas.map((f) => {
                const idxFull = familias.findIndex((x) => x.id === f.id)
                const title = (f.nome || '').trim() || tr('bibliaNonatoSemNomeFamilia', '(Sem nome)')
                const sel = selectedId === f.id
                return (
                  <div
                    key={f.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      padding: '10px',
                      borderRadius: '10px',
                      border: sel ? '1px solid rgba(45, 212, 191, 0.55)' : '1px solid rgba(148, 163, 184, 0.18)',
                      backgroundColor: sel ? 'rgba(13, 148, 136, 0.14)' : 'rgba(2, 6, 23, 0.35)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(f.id)}
                      style={{
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        color: '#f8fafc',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '13px',
                        padding: 0,
                      }}
                    >
                      {title}
                    </button>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <button
                        type="button"
                        style={{ ...btnOutline, padding: '4px 8px', fontSize: '10px', opacity: idxFull <= 0 ? 0.45 : 1 }}
                        disabled={idxFull <= 0}
                        onClick={() => moveFamilia(f.id, -1)}
                      >
                        ↑ {tr('bibliaNonatoMoverCima', 'Subir')}
                      </button>
                      <button
                        type="button"
                        style={{
                          ...btnOutline,
                          padding: '4px 8px',
                          fontSize: '10px',
                          opacity: idxFull >= familias.length - 1 ? 0.45 : 1,
                        }}
                        disabled={idxFull >= familias.length - 1}
                        onClick={() => moveFamilia(f.id, 1)}
                      >
                        ↓ {tr('bibliaNonatoMoverBaixo', 'Descer')}
                      </button>
                      <button type="button" style={{ ...btnDanger, padding: '4px 8px', fontSize: '10px' }} onClick={() => removeFamilia(f.id)}>
                        ✕ {tr('bibliaNonatoApagarFamilia', 'Eliminar')}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(96, 165, 250, 0.22)',
            background: 'rgba(15, 23, 42, 0.45)',
            padding: '18px',
            minHeight: '280px',
          }}
        >
          {!selected ? (
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{tr('bibliaNonatoSemFamilias', 'Crie uma família para começar.')}</p>
          ) : (
            <>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#93c5fd', marginBottom: '8px', letterSpacing: '0.08em' }}>
                {tr('bibliaNonatoNomeFamiliaLabel', 'Nome da família')}
              </label>
              <input
                value={selected.nome}
                onChange={(e) => updateFamiliaNome(selected.id, e.target.value)}
                placeholder={tr('bibliaNonatoNomeFamiliaPlaceholder', 'Ex.: Família das seccionadoras')}
                style={{ ...inputStyle, marginBottom: '18px' }}
              />

              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: '#93c5fd', marginBottom: '12px' }}>
                {tr('bibliaNonatoLinhasTitulo', 'LINHAS (MARCA / MODELOS)')}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selected.linhas.map((linha) => (
                  <div
                    key={linha.id}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      background: 'rgba(2, 6, 23, 0.5)',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          {tr('bibliaNonatoLinhaTituloLabel', 'Marca ou grupo (opcional)')}
                        </label>
                        <input
                          value={linha.titulo}
                          onChange={(e) => updateLinha(selected.id, linha.id, { titulo: e.target.value })}
                          placeholder={tr('bibliaNonatoLinhaTituloPlaceholder', 'Homag · Brandt · Weeke…')}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          {tr('bibliaNonatoModelosLabel', 'Modelos ou referências')}
                        </label>
                        <textarea
                          value={linha.modelosTexto}
                          onChange={(e) => updateLinha(selected.id, linha.id, { modelosTexto: e.target.value })}
                          placeholder={tr(
                            'bibliaNonatoModelosPlaceholder',
                            'Ex.: HPP 230, HPP 250 — ou uma referência por linha.'
                          )}
                          rows={4}
                          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'ui-monospace, monospace', lineHeight: 1.45 }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                      }}
                    >
                      <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                        {tr('bibliaNonatoAnexosTitulo', 'Documentos e imagens')}
                      </label>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px', lineHeight: 1.45 }}>
                        {tr(
                          'bibliaNonatoAnexosAjuda',
                          'Anexe PDF, Word ou imagens; ficam guardados neste navegador (até ~6 MB por ficheiro).'
                        )}
                      </p>
                      <button
                        type="button"
                        style={{ ...btnOutline, padding: '6px 10px', fontSize: '11px', marginBottom: '10px' }}
                        onClick={() => clickAdicionarAnexos(selected.id, linha.id)}
                      >
                        + {tr('bibliaNonatoAnexosAdicionar', 'Adicionar ficheiros')}
                      </button>
                      {(linha.anexos || []).length > 0 ? (
                        <ul
                          style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          {(linha.anexos || []).map((anexo) => (
                            <li
                              key={anexo.id}
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                borderRadius: '8px',
                                background: 'rgba(15,23,42,0.6)',
                                border: '1px solid rgba(148,163,184,0.15)',
                              }}
                            >
                              {anexo.mime.startsWith('image/') ? (
                                <img
                                  src={anexo.dataUrl}
                                  alt=""
                                  style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }}
                                />
                              ) : (
                                <span style={{ fontSize: '22px' }} aria-hidden>
                                  📎
                                </span>
                              )}
                              <span
                                style={{
                                  flex: '1 1 140px',
                                  fontSize: '12px',
                                  color: '#e2e8f0',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {anexo.nome}
                              </span>
                              <button
                                type="button"
                                style={{ ...btnOutline, padding: '4px 8px', fontSize: '10px' }}
                                onClick={() =>
                                  window.open(anexo.dataUrl, '_blank', 'noopener,noreferrer')
                                }
                              >
                                {tr('bibliaNonatoAnexoAbrir', 'Abrir')}
                              </button>
                              <a
                                href={anexo.dataUrl}
                                download={anexo.nome}
                                style={{
                                  ...btnOutline,
                                  padding: '4px 8px',
                                  fontSize: '10px',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  boxSizing: 'border-box',
                                }}
                              >
                                {tr('bibliaNonatoAnexoTransferir', 'Transferir')}
                              </a>
                              <button
                                type="button"
                                style={{ ...btnDanger, padding: '4px 8px', fontSize: '10px' }}
                                onClick={() => removerAnexo(selected.id, linha.id, anexo.id)}
                              >
                                {tr('bibliaNonatoAnexoRemover', 'Remover')}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button type="button" style={{ ...btnDanger, padding: '6px 10px', fontSize: '11px' }} onClick={() => removeLinha(selected.id, linha.id)}>
                        {tr('bibliaNonatoRemoverLinha', 'Remover linha')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" style={{ ...btnOutline, marginTop: '16px' }} onClick={() => addLinha(selected.id)}>
                + {tr('bibliaNonatoNovaLinha', 'Adicionar linha')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

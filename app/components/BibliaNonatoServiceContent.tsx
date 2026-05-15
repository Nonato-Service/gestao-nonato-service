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

/** Um modelo/referência com texto próprio e anexos (ex.: HPP 250 + notas + PDFs). */
export type BibliaModeloRow = {
  id: string
  nome: string
  informacoes: string
  ordem: number
  anexos: BibliaAnexo[]
}

export type BibliaMarcaLinha = {
  id: string
  titulo: string
  ordem: number
  modelos: BibliaModeloRow[]
}

const BIBLIA_ANEXO_MAX_POR_MODELO = 24
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

function emptyModelo(ordem: number): BibliaModeloRow {
  return { id: newId(), nome: '', informacoes: '', ordem, anexos: [] }
}

function emptyLinha(ordem: number): BibliaMarcaLinha {
  return { id: newId(), titulo: '', ordem, modelos: [emptyModelo(0)] }
}

/** Migra texto antigo (várias linhas ou "A, B, C") para cartões de modelo; anexos legacy ficam no 1.º modelo. */
function tokensFromLegacyModelosTexto(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (lines.length === 0) return []
  if (lines.length === 1 && lines[0].includes(',')) {
    return lines[0]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return lines
}

function migrateLegacyLinhaParaModelos(
  legacyText: string,
  legacyAnexos: BibliaAnexo[]
): BibliaModeloRow[] {
  const tokens = tokensFromLegacyModelosTexto(legacyText)
  if (tokens.length === 0) {
    if (legacyAnexos.length) {
      return [{ id: newId(), nome: '', informacoes: '', ordem: 0, anexos: [...legacyAnexos] }]
    }
    return [emptyModelo(0)]
  }
  return tokens.map((nome, i) => ({
    id: newId(),
    nome,
    informacoes: '',
    ordem: i,
    anexos: i === 0 ? [...legacyAnexos] : [],
  }))
}

function normalizeModelo(raw: unknown, fallbackOrdem: number): BibliaModeloRow | null {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const anexosRaw = o.anexos
  const anexosArr = Array.isArray(anexosRaw) ? anexosRaw : []
  const anexos = anexosArr.map(normalizeAnexo).filter(Boolean) as BibliaAnexo[]
  const nome =
    typeof o.nome === 'string'
      ? o.nome
      : typeof (o as { titulo?: unknown }).titulo === 'string'
        ? String((o as { titulo: string }).titulo)
        : ''
  const informacoes =
    typeof o.informacoes === 'string'
      ? o.informacoes
      : typeof (o as { notas?: unknown }).notas === 'string'
        ? String((o as { notas: string }).notas)
        : ''
  return {
    id: typeof o.id === 'string' && o.id ? o.id : newId(),
    nome: nome.slice(0, 400),
    informacoes,
    ordem: typeof o.ordem === 'number' ? o.ordem : fallbackOrdem,
    anexos,
  }
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
  const modelosRaw = o.modelos
  let modelos: BibliaModeloRow[] = []
  if (Array.isArray(modelosRaw) && modelosRaw.length > 0) {
    modelos = modelosRaw
      .map((r, i) => normalizeModelo(r, i))
      .filter(Boolean) as BibliaModeloRow[]
    modelos.sort((a, b) => a.ordem - b.ordem)
  } else {
    const legacyText = typeof o.modelosTexto === 'string' ? o.modelosTexto : ''
    const anexosRaw = o.anexos
    const anexosArr = Array.isArray(anexosRaw) ? anexosRaw : []
    const legacyAnexos = anexosArr.map(normalizeAnexo).filter(Boolean) as BibliaAnexo[]
    modelos = migrateLegacyLinhaParaModelos(legacyText, legacyAnexos)
  }
  if (!modelos.length) modelos = [emptyModelo(0)]
  return {
    id: typeof o.id === 'string' && o.id ? o.id : newId(),
    titulo: typeof o.titulo === 'string' ? o.titulo : '',
    ordem: typeof o.ordem === 'number' ? o.ordem : fallbackOrdem,
    modelos,
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
    linhas: linhas.length ? linhas : [emptyLinha(0)],
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
  /** `false` = bloco da marca/linha retraído (só cabeçalho); ausente/`true` = expandido */
  const [linhaCorpoAberto, setLinhaCorpoAberto] = useState<Record<string, boolean>>({})
  /** `false` = corpo do modelo retraído (só cabeçalho com nome); ausente/`true` = expandido */
  const [modeloCorpoAberto, setModeloCorpoAberto] = useState<Record<string, boolean>>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attachTargetRef = useRef<{ familiaId: string; linhaId: string; modeloId: string } | null>(null)
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
        return l.modelos.some((m) => {
          if ((m.nome || '').toLowerCase().includes(q)) return true
          if ((m.informacoes || '').toLowerCase().includes(q)) return true
          return (m.anexos || []).some((a) => (a.nome || '').toLowerCase().includes(q))
        })
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
      linhas: [emptyLinha(0)],
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
      const lid = newId()
      setLinhaCorpoAberto((p) => ({ ...p, [lid]: true }))
      setFamiliasAndSave((prev) =>
        prev.map((f) => {
          if (f.id !== familiaId) return f
          const ordem = f.linhas.length
          return { ...f, linhas: [...f.linhas, { ...emptyLinha(ordem), id: lid }] }
        })
      )
    },
    [setFamiliasAndSave]
  )

  const removeLinha = useCallback(
    (familiaId: string, linhaId: string) => {
      setLinhaCorpoAberto((prev) => {
        const next = { ...prev }
        delete next[linhaId]
        return next
      })
      setFamiliasAndSave((prev) =>
        prev.map((f) => {
          if (f.id !== familiaId) return f
          const linhas = f.linhas.filter((l) => l.id !== linhaId).map((l, i) => ({ ...l, ordem: i }))
          return {
            ...f,
            linhas:
              linhas.length > 0 ? linhas : [emptyLinha(0)],
          }
        })
      )
    },
    [setFamiliasAndSave]
  )

  const updateLinha = useCallback(
    (familiaId: string, linhaId: string, patch: Partial<Pick<BibliaMarcaLinha, 'titulo'>>) => {
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

  const updateModelo = useCallback(
    (
      familiaId: string,
      linhaId: string,
      modeloId: string,
      patch: Partial<Pick<BibliaModeloRow, 'nome' | 'informacoes' | 'anexos'>>
    ) => {
      setFamiliasAndSave((prev) =>
        prev.map((f) => {
          if (f.id !== familiaId) return f
          return {
            ...f,
            linhas: f.linhas.map((l) => {
              if (l.id !== linhaId) return l
              return {
                ...l,
                modelos: l.modelos.map((m) => (m.id === modeloId ? { ...m, ...patch } : m)),
              }
            }),
          }
        })
      )
    },
    [setFamiliasAndSave]
  )

  const addModelo = useCallback(
    (familiaId: string, linhaId: string) => {
      const novoId = newId()
      setModeloCorpoAberto((p) => ({ ...p, [novoId]: true }))
      setFamiliasAndSave((prev) =>
        prev.map((f) => {
          if (f.id !== familiaId) return f
          return {
            ...f,
            linhas: f.linhas.map((l) => {
              if (l.id !== linhaId) return l
              const ordem = l.modelos.length
              const novo = { ...emptyModelo(ordem), id: novoId }
              return { ...l, modelos: [...l.modelos, novo] }
            }),
          }
        })
      )
    },
    [setFamiliasAndSave]
  )

  const removeModelo = useCallback(
    (familiaId: string, linhaId: string, modeloId: string) => {
      setModeloCorpoAberto((prev) => {
        const next = { ...prev }
        delete next[modeloId]
        return next
      })
      setFamiliasAndSave((prev) =>
        prev.map((f) => {
          if (f.id !== familiaId) return f
          return {
            ...f,
            linhas: f.linhas.map((l) => {
              if (l.id !== linhaId) return l
              if (l.modelos.length <= 1) {
                return { ...l, modelos: [emptyModelo(0)] }
              }
              const rest = l.modelos.filter((m) => m.id !== modeloId).map((m, i) => ({ ...m, ordem: i }))
              return { ...l, modelos: rest }
            }),
          }
        })
      )
    },
    [setFamiliasAndSave]
  )

  const moveModelo = useCallback(
    (familiaId: string, linhaId: string, modeloId: string, dir: -1 | 1) => {
      setFamiliasAndSave((prev) =>
        prev.map((f) => {
          if (f.id !== familiaId) return f
          return {
            ...f,
            linhas: f.linhas.map((l) => {
              if (l.id !== linhaId) return l
              const idx = l.modelos.findIndex((m) => m.id === modeloId)
              const j = idx + dir
              if (idx < 0 || j < 0 || j >= l.modelos.length) return l
              const cp = [...l.modelos]
              const tmp = cp[idx]!
              cp[idx] = cp[j]!
              cp[j] = tmp
              return { ...l, modelos: cp.map((m, i) => ({ ...m, ordem: i })) }
            }),
          }
        })
      )
    },
    [setFamiliasAndSave]
  )

  const moveLinha = useCallback(
    (familiaId: string, linhaId: string, dir: -1 | 1) => {
      setFamiliasAndSave((prev) =>
        prev.map((f) => {
          if (f.id !== familiaId) return f
          const idx = f.linhas.findIndex((l) => l.id === linhaId)
          const j = idx + dir
          if (idx < 0 || j < 0 || j >= f.linhas.length) return f
          const cp = [...f.linhas]
          const tmp = cp[idx]!
          cp[idx] = cp[j]!
          cp[j] = tmp
          return { ...f, linhas: cp.map((l, i) => ({ ...l, ordem: i })) }
        })
      )
    },
    [setFamiliasAndSave]
  )

  const toggleLinhaCorpo = useCallback((linhaId: string) => {
    setLinhaCorpoAberto((prev) => ({
      ...prev,
      [linhaId]: !(prev[linhaId] !== false),
    }))
  }, [])

  const toggleModeloCorpo = useCallback((modeloId: string) => {
    setModeloCorpoAberto((prev) => ({
      ...prev,
      [modeloId]: !(prev[modeloId] !== false),
    }))
  }, [])

  const clickAdicionarAnexos = useCallback((familiaId: string, linhaId: string, modeloId: string) => {
    attachTargetRef.current = { familiaId, linhaId, modeloId }
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
        const mod = lin?.modelos.find((m) => m.id === alvo.modeloId)
        if (!fam || !lin || !mod) return prev
        const existentes = mod.anexos || []
        const room = Math.max(0, BIBLIA_ANEXO_MAX_POR_MODELO - existentes.length)
        if (room <= 0) {
          queueMicrotask(() =>
            window.alert(tr('bibliaNonatoAnexoLimiteQuantidade', 'Limite de anexos por modelo atingido.'))
          )
          return prev
        }
        const add = collected.slice(0, room)
        if (collected.length > room) {
          queueMicrotask(() =>
            window.alert(
              tr(
                'bibliaNonatoAnexoParcial',
                'Só couberam alguns ficheiros: limite de anexos por modelo.'
              )
            )
          )
        }
        return prev.map((f) => {
          if (f.id !== alvo.familiaId) return f
          return {
            ...f,
            linhas: f.linhas.map((l) => {
              if (l.id !== alvo.linhaId) return l
              return {
                ...l,
                modelos: l.modelos.map((m) =>
                  m.id === alvo.modeloId ? { ...m, anexos: [...existentes, ...add] } : m
                ),
              }
            }),
          }
        })
      })
    },
    [tr, setFamiliasAndSave]
  )

  const removerAnexo = useCallback(
    (familiaId: string, linhaId: string, modeloId: string, anexoId: string) => {
      setFamiliasAndSave((prev) =>
        prev.map((f) => {
          if (f.id !== familiaId) return f
          return {
            ...f,
            linhas: f.linhas.map((l) => {
              if (l.id !== linhaId) return l
              return {
                ...l,
                modelos: l.modelos.map((m) =>
                  m.id === modeloId
                    ? { ...m, anexos: (m.anexos || []).filter((a) => a.id !== anexoId) }
                    : m
                ),
              }
            }),
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
                    <p style={{ margin: 0, fontSize: '10px', color: '#64748b', lineHeight: 1.4 }}>
                      {tr('bibliaNonatoFamiliaListaResumo', '{m} marcas · {n} modelos')
                        .replace('{m}', String(f.linhas.length))
                        .replace(
                          '{n}',
                          String(f.linhas.reduce((acc, l) => acc + l.modelos.length, 0))
                        )}
                    </p>
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
              <div
                style={{
                  borderRadius: '14px',
                  border: '2px solid rgba(45, 212, 191, 0.4)',
                  background: 'linear-gradient(165deg, rgba(13, 148, 136, 0.16) 0%, rgba(2, 6, 23, 0.78) 50%)',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em', color: '#5eead4' }}>
                    {tr('bibliaNonatoFamiliaConteudoTitulo', 'TUDO NESTA FAMÍLIA')}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#ecfeff' }}>
                    {(selected.nome || '').trim() || tr('bibliaNonatoSemNomeFamilia', '(Sem nome)')}
                  </span>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.55 }}>
                  {tr(
                    'bibliaNonatoFamiliaConteudoAjuda',
                    'A família é o «sítio» do equipamento (ex.: Seccionadoras). As marcas (Weeke, Homag…) ficam cada uma no seu bloco abaixo — nada se mistura com outras famílias.'
                  )}
                </p>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#a5f3fc', marginBottom: '8px', letterSpacing: '0.08em' }}>
                  {tr('bibliaNonatoNomeFamiliaLabel', 'Nome da família')}
                </label>
                <input
                  value={selected.nome}
                  onChange={(e) => updateFamiliaNome(selected.id, e.target.value)}
                  placeholder={tr('bibliaNonatoNomeFamiliaPlaceholder', 'Ex.: Seccionadoras')}
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
              </div>

              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: '#93c5fd', marginBottom: '12px' }}>
                {tr('bibliaNonatoMarcasNaFamiliaTitulo', 'MARCAS — cada uma no seu bloco')}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selected.linhas.map((linha, li) => {
                  const marcaAberta = linhaCorpoAberto[linha.id] !== false
                  const nMod = linha.modelos.length
                  return (
                  <div
                    key={linha.id}
                    style={{
                      borderRadius: '12px',
                      border: '1px solid rgba(59, 130, 246, 0.45)',
                      background: 'rgba(15, 23, 42, 0.82)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px 14px',
                        background: 'rgba(30, 58, 138, 0.32)',
                        borderBottom: marcaAberta ? '1px solid rgba(148, 163, 184, 0.22)' : 'none',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleLinhaCorpo(linha.id)}
                        title={
                          marcaAberta
                            ? tr('bibliaNonatoModeloRetrair', 'Retrair')
                            : tr('bibliaNonatoModeloExpandir', 'Expandir')
                        }
                        aria-expanded={marcaAberta}
                        style={{
                          ...btnOutline,
                          padding: '8px 10px',
                          fontSize: '14px',
                          lineHeight: 1,
                          flexShrink: 0,
                          marginTop: '18px',
                        }}
                      >
                        {marcaAberta ? '▼' : '▶'}
                      </button>
                      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                        <label style={{ fontSize: '10px', color: '#bae6fd', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                          {tr('bibliaNonatoMarcaBlocoLabel', 'Marca / fornecedor (fica só neste bloco)')}
                        </label>
                        <input
                          value={linha.titulo}
                          onChange={(e) => updateLinha(selected.id, linha.id, { titulo: e.target.value })}
                          placeholder={tr('bibliaNonatoLinhaTituloPlaceholder', 'Ex.: Weeke')}
                          style={{ ...inputStyle, fontWeight: 600 }}
                        />
                        {!marcaAberta && (
                          <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>
                            {tr('bibliaNonatoLinhaResumoModelos', '{n} modelo(s)').replace('{n}', String(nMod))}{' '}
                            · {tr('bibliaNonatoLinhaResumoDica', 'Expandir para ver ou editar')}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flexShrink: 0, marginTop: '18px' }}>
                        <button
                          type="button"
                          style={{
                            ...btnOutline,
                            padding: '4px 8px',
                            fontSize: '10px',
                            opacity: li <= 0 ? 0.45 : 1,
                          }}
                          disabled={li <= 0}
                          onClick={() => moveLinha(selected.id, linha.id, -1)}
                          title={tr('bibliaNonatoLinhaMoverCima', 'Subir esta marca na lista')}
                        >
                          ↑ {tr('bibliaNonatoMoverCima', 'Subir')}
                        </button>
                        <button
                          type="button"
                          style={{
                            ...btnOutline,
                            padding: '4px 8px',
                            fontSize: '10px',
                            opacity: li >= selected.linhas.length - 1 ? 0.45 : 1,
                          }}
                          disabled={li >= selected.linhas.length - 1}
                          onClick={() => moveLinha(selected.id, linha.id, 1)}
                          title={tr('bibliaNonatoLinhaMoverBaixo', 'Descer esta marca na lista')}
                        >
                          ↓ {tr('bibliaNonatoMoverBaixo', 'Descer')}
                        </button>
                      </div>
                    </div>

                    {marcaAberta ? (
                      <div
                        style={{
                          padding: '14px 14px 16px 16px',
                          marginLeft: '6px',
                          borderLeft: '3px solid rgba(56, 189, 248, 0.55)',
                        }}
                      >
                        <div
                          style={{
                            marginBottom: '12px',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            color: '#7dd3fc',
                          }}
                        >
                          {tr('bibliaNonatoModelosDentroMarca', 'MODELOS NESTA MARCA')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {linha.modelos.map((modelo, mi) => {
                        const detalheAberto = modeloCorpoAberto[modelo.id] !== false
                        const nAnexos = (modelo.anexos || []).length
                        return (
                        <div
                          key={modelo.id}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1px solid rgba(56, 189, 248, 0.22)',
                            background: 'rgba(15, 23, 42, 0.72)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'flex-start',
                              gap: '10px',
                              marginBottom: detalheAberto ? '10px' : 0,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => toggleModeloCorpo(modelo.id)}
                              title={
                                detalheAberto
                                  ? tr('bibliaNonatoModeloRetrair', 'Retrair')
                                  : tr('bibliaNonatoModeloExpandir', 'Expandir')
                              }
                              aria-expanded={detalheAberto}
                              style={{
                                ...btnOutline,
                                padding: '8px 10px',
                                fontSize: '14px',
                                lineHeight: 1,
                                flexShrink: 0,
                              }}
                            >
                              {detalheAberto ? '▼' : '▶'}
                            </button>
                            <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                                {tr('bibliaNonatoModeloNomeLabel', 'Modelo ou referência')}
                              </label>
                              <input
                                value={modelo.nome}
                                onChange={(e) =>
                                  updateModelo(selected.id, linha.id, modelo.id, { nome: e.target.value })
                                }
                                placeholder={tr('bibliaNonatoModeloNomePlaceholder', 'Ex.: HPP 250')}
                                style={{ ...inputStyle, fontFamily: 'inherit' }}
                              />
                              {!detalheAberto && (
                                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                                  {nAnexos > 0
                                    ? tr('bibliaNonatoModeloResumoAnexos', '{n} anexo(s)').replace('{n}', String(nAnexos))
                                    : tr(
                                        'bibliaNonatoModeloResumoRetraido',
                                        'Detalhes e anexos ocultos — expanda para editar.'
                                      )}
                                </p>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flexShrink: 0 }}>
                              <button
                                type="button"
                                style={{
                                  ...btnOutline,
                                  padding: '4px 8px',
                                  fontSize: '10px',
                                  opacity: mi <= 0 ? 0.45 : 1,
                                }}
                                disabled={mi <= 0}
                                onClick={() => moveModelo(selected.id, linha.id, modelo.id, -1)}
                                title={tr('bibliaNonatoModeloMoverCima', 'Subir modelo na lista')}
                              >
                                ↑ {tr('bibliaNonatoMoverCima', 'Subir')}
                              </button>
                              <button
                                type="button"
                                style={{
                                  ...btnOutline,
                                  padding: '4px 8px',
                                  fontSize: '10px',
                                  opacity: mi >= linha.modelos.length - 1 ? 0.45 : 1,
                                }}
                                disabled={mi >= linha.modelos.length - 1}
                                onClick={() => moveModelo(selected.id, linha.id, modelo.id, 1)}
                                title={tr('bibliaNonatoModeloMoverBaixo', 'Descer modelo na lista')}
                              >
                                ↓ {tr('bibliaNonatoMoverBaixo', 'Descer')}
                              </button>
                            </div>
                          </div>

                          {detalheAberto ? (
                          <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                                {tr('bibliaNonatoModeloInfoLabel', 'Informações / notas')}
                              </label>
                              <textarea
                                value={modelo.informacoes}
                                onChange={(e) =>
                                  updateModelo(selected.id, linha.id, modelo.id, {
                                    informacoes: e.target.value,
                                  })
                                }
                                placeholder={tr(
                                  'bibliaNonatoModeloInfoPlaceholder',
                                  'Peças, calibrações, sintomas, links internos…'
                                )}
                                rows={4}
                                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.45 }}
                              />
                            </div>
                          </div>
                          <div
                            style={{
                              marginTop: '12px',
                              paddingTop: '12px',
                              borderTop: '1px solid rgba(148, 163, 184, 0.18)',
                            }}
                          >
                            <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                              {tr('bibliaNonatoAnexosTitulo', 'Documentos e imagens')}
                            </label>
                            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px', lineHeight: 1.45 }}>
                              {tr(
                                'bibliaNonatoAnexosAjudaModelo',
                                'Anexos só deste modelo (PDF, Word ou imagens; até ~6 MB por ficheiro).'
                              )}
                            </p>
                            <button
                              type="button"
                              style={{ ...btnOutline, padding: '6px 10px', fontSize: '11px', marginBottom: '10px' }}
                              onClick={() =>
                                clickAdicionarAnexos(selected.id, linha.id, modelo.id)
                              }
                            >
                              + {tr('bibliaNonatoAnexosAdicionar', 'Adicionar ficheiros')}
                            </button>
                            {(modelo.anexos || []).length > 0 ? (
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
                                {(modelo.anexos || []).map((anexo) => (
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
                                      onClick={() =>
                                        removerAnexo(selected.id, linha.id, modelo.id, anexo.id)
                                      }
                                    >
                                      {tr('bibliaNonatoAnexoRemover', 'Remover')}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button
                              type="button"
                              style={{ ...btnDanger, padding: '6px 10px', fontSize: '11px' }}
                              onClick={() => removeModelo(selected.id, linha.id, modelo.id)}
                            >
                              {tr('bibliaNonatoRemoverModelo', 'Remover modelo')}
                            </button>
                          </div>
                          </>
                          ) : null}
                        </div>
                        )
                      })}
                        </div>

                        <button
                          type="button"
                          style={{ ...btnOutline, marginTop: '12px', width: '100%', boxSizing: 'border-box' }}
                          onClick={() => addModelo(selected.id, linha.id)}
                        >
                          + {tr('bibliaNonatoNovoModelo', 'Adicionar modelo')}
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                          <button
                            type="button"
                            style={{ ...btnDanger, padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => removeLinha(selected.id, linha.id)}
                          >
                            {tr('bibliaNonatoRemoverLinha', 'Remover linha')}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  )
                })}
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

'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'

type ZipEntry = { path: string; size: number }

type Props = {
  dataUrl: string
  tr: (key: string, fallback: string) => string
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',')
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function entryKind(path: string): 'pdf' | 'image' | 'text' | 'other' {
  const lower = path.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower)) return 'image'
  if (/\.(txt|md|csv|json|log|xml|html?)$/.test(lower)) return 'text'
  return 'other'
}

function entryLabel(path: string): string {
  const parts = path.split(/[/\\]/)
  return parts[parts.length - 1] || path
}

export function ManuaisZipExplorer(props: Props) {
  const { dataUrl, tr } = props
  const zipRef = useRef<JSZip | null>(null)
  const [entries, setEntries] = useState<ZipEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewText, setPreviewText] = useState('')
  const [previewKind, setPreviewKind] = useState<'pdf' | 'image' | 'text' | 'other' | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    zipRef.current = null
    setEntries([])
    setSelectedPath(null)
    setPreviewUrl(null)
    setPreviewText('')
    setPreviewKind(null)
    setError(null)
    setLoading(true)

    ;(async () => {
      try {
        const bytes = dataUrlToUint8Array(dataUrl)
        const zip = await JSZip.loadAsync(bytes)
        if (cancelled) return
        zipRef.current = zip
        const list: ZipEntry[] = []
        zip.forEach((relativePath, file) => {
          if (file.dir) return
          list.push({
            path: relativePath.replace(/\\/g, '/'),
            size: (file as JSZip.JSZipObject & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0,
          })
        })
        list.sort((a, b) => {
          const aPdf = /\.pdf$/i.test(a.path)
          const bPdf = /\.pdf$/i.test(b.path)
          if (aPdf !== bPdf) return aPdf ? -1 : 1
          return a.path.localeCompare(b.path, undefined, { sensitivity: 'base', numeric: true })
        })
        setEntries(list)
        const indexPdf = list.find((e) => /(^|\/)index\.pdf$/i.test(e.path))
        const firstPdf = list.find((e) => /\.pdf$/i.test(e.path))
        setSelectedPath(indexPdf?.path || firstPdf?.path || null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [dataUrl])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    setPreviewText('')
    setPreviewKind(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })

    if (!selectedPath || !zipRef.current) return

    let cancelled = false
    let objectUrl: string | null = null
    const kind = entryKind(selectedPath)
    setPreviewLoading(true)
    setError(null)

    ;(async () => {
      try {
        const file = zipRef.current!.file(selectedPath)
        if (!file) throw new Error('missing_entry')
        if (kind === 'pdf' || kind === 'image') {
          const blob = await file.async('blob')
          if (cancelled) return
          objectUrl = URL.createObjectURL(blob)
          setPreviewUrl(objectUrl)
          setPreviewKind(kind)
        } else if (kind === 'text') {
          const text = await file.async('string')
          if (cancelled) return
          setPreviewText(text)
          setPreviewKind('text')
        } else {
          setPreviewKind('other')
        }
      } catch (err) {
        if (!cancelled) {
          setPreviewKind('other')
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [selectedPath])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => e.path.toLowerCase().includes(q))
  }, [entries, search])

  const downloadSelected = async () => {
    if (!selectedPath || !zipRef.current) return
    try {
      const file = zipRef.current.file(selectedPath)
      if (!file) return
      const blob = await file.async('blob')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = entryLabel(selectedPath)
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <p className="manuais-pro__preview-status">{tr('manuaisZipCarregando', 'A ler o pacote ZIP…')}</p>
    )
  }

  if (error && entries.length === 0) {
    return (
      <p className="manuais-pro__preview-status manuais-pro__preview-status--warn">
        {tr('manuaisZipErro', 'Não foi possível abrir o ZIP. Descarregue e extraia no computador.')}
        {error ? ` (${error})` : ''}
      </p>
    )
  }

  return (
    <div className="manuais-pro__zip-explorer">
      <p className="manuais-pro__zip-explorer-hint">
        {tr(
          'manuaisZipConteudoHint',
          'Escolha um ficheiro na lista (PDF, imagem ou texto). Para Start.exe HOMAG, descarregue o ZIP completo.'
        )}
      </p>
      <input
        type="search"
        className="manuais-pro__zip-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={tr('manuaisZipAProcurar', 'Procurar ficheiro no ZIP…')}
        aria-label={tr('manuaisZipAProcurar', 'Procurar ficheiro no ZIP…')}
      />
      <div className="manuais-pro__zip-layout">
        <ul className="manuais-pro__zip-list" role="listbox" aria-label={tr('manuaisZipListaTitulo', 'Ficheiros no ZIP')}>
          {filtered.length === 0 ? (
            <li className="manuais-pro__zip-empty">{tr('manuaisZipSemEntradas', 'Nenhum ficheiro encontrado.')}</li>
          ) : (
            filtered.map((entry) => {
              const active = selectedPath === entry.path
              const kind = entryKind(entry.path)
              return (
                <li key={entry.path}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`manuais-pro__zip-item${active ? ' is-active' : ''}`}
                    onClick={() => setSelectedPath(entry.path)}
                    title={entry.path}
                  >
                    <span className={`manuais-pro__zip-item-badge manuais-pro__zip-item-badge--${kind}`}>
                      {kind === 'pdf' ? 'PDF' : kind === 'image' ? 'IMG' : kind === 'text' ? 'TXT' : '···'}
                    </span>
                    <span className="manuais-pro__zip-item-text">
                      <span className="manuais-pro__zip-item-name">{entryLabel(entry.path)}</span>
                      <span className="manuais-pro__zip-item-path">{entry.path}</span>
                    </span>
                    <span className="manuais-pro__zip-item-size">{formatBytes(entry.size)}</span>
                  </button>
                </li>
              )
            })
          )}
        </ul>

        <div className="manuais-pro__zip-preview">
          {!selectedPath ? (
            <p className="manuais-pro__preview-status">
              {tr('manuaisZipEscolherFicheiro', 'Selecione um ficheiro à esquerda para visualizar.')}
            </p>
          ) : previewLoading ? (
            <p className="manuais-pro__preview-status">{tr('bibliaPreviewCarregando', 'A carregar conteúdo…')}</p>
          ) : previewKind === 'pdf' && previewUrl ? (
            <iframe className="manuais-pro__preview-frame" src={previewUrl} title={selectedPath} />
          ) : previewKind === 'image' && previewUrl ? (
            <div className="manuais-pro__preview-image-wrap">
              <img src={previewUrl} alt={selectedPath} className="manuais-pro__preview-image" />
            </div>
          ) : previewKind === 'text' ? (
            <textarea
              readOnly
              value={previewText}
              rows={16}
              className="manuais-pro__preview-textarea"
              style={{ width: '100%', minHeight: 280, fontFamily: 'inherit', lineHeight: 1.5 }}
            />
          ) : (
            <p className="manuais-pro__preview-status">
              {tr(
                'manuaisZipNaoPreview',
                'Este tipo não abre no browser (ex.: .exe). Descarregue o ficheiro ou o ZIP completo.'
              )}
            </p>
          )}
          {selectedPath ? (
            <div className="manuais-pro__zip-preview-actions">
              <button type="button" className="manuais-pro__doc-btn" onClick={() => void downloadSelected()}>
                {tr('manuaisZipDescarregarFicheiro', 'Descarregar este ficheiro')}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import { ManuaisZipPdfPreview } from './ManuaisZipPdfPreview'

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

function entryKind(path: string): 'pdf' | 'image' | 'text' | 'archive' | 'other' {
  const lower = path.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower)) return 'image'
  if (/\.(txt|md|csv|json|log|xml|html?)$/.test(lower)) return 'text'
  if (/\.(rar|7z|cab|tar|gz|bz2)$/i.test(lower)) return 'archive'
  return 'other'
}

function entryLabel(path: string): string {
  const parts = path.split(/[/\\]/)
  return parts[parts.length - 1] || path
}

function findSectionPdf(entries: ZipEntry[], folderRe: RegExp): string | null {
  const pdfs = entries.filter((e) => /\.pdf$/i.test(e.path))
  const inFolder = pdfs.filter((e) => {
    const parts = e.path.split(/[/\\]/)
    return parts.some((part) => folderRe.test(part))
  })
  if (inFolder.length === 0) return null
  const indexInFolder = inFolder.find((e) => /index\.pdf$/i.test(e.path))
  return indexInFolder?.path || inFolder.sort((a, b) => a.path.localeCompare(b.path))[0].path
}

function mimeForZipEntry(path: string, kind: ReturnType<typeof entryKind>): string {
  const lower = path.toLowerCase()
  if (kind === 'pdf') return 'application/pdf'
  if (kind === 'image') {
    if (lower.endsWith('.png')) return 'image/png'
    if (lower.endsWith('.gif')) return 'image/gif'
    if (lower.endsWith('.webp')) return 'image/webp'
    if (lower.endsWith('.bmp')) return 'image/bmp'
    if (lower.endsWith('.svg')) return 'image/svg+xml'
    return 'image/jpeg'
  }
  if (kind === 'text') {
    if (lower.endsWith('.json')) return 'application/json'
    if (lower.endsWith('.csv')) return 'text/csv'
    if (lower.endsWith('.md')) return 'text/markdown'
    if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html'
    return 'text/plain'
  }
  return 'application/octet-stream'
}

function detectKindFromBytes(path: string, bytes: Uint8Array): ReturnType<typeof entryKind> {
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf'
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image'
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'image'
  }
  return entryKind(path)
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
  const [previewBytes, setPreviewBytes] = useState<Uint8Array | null>(null)
  const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState<string | null>(null)
  const [previewText, setPreviewText] = useState('')
  const [previewKind, setPreviewKind] = useState<'pdf' | 'image' | 'text' | 'archive' | 'other' | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    zipRef.current = null
    setEntries([])
    setSelectedPath(null)
    setPreviewUrl(null)
    setPreviewBytes(null)
    setPreviewPdfBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
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
      if (previewPdfBlobUrl) URL.revokeObjectURL(previewPdfBlobUrl)
    }
  }, [previewUrl, previewPdfBlobUrl])

  useEffect(() => {
    setPreviewText('')
    setPreviewKind(null)
    setPreviewBytes(null)
    setPreviewPdfBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })

    if (!selectedPath || !zipRef.current) return

    let cancelled = false
    let objectUrl: string | null = null
    setPreviewLoading(true)
    setError(null)

    ;(async () => {
      try {
        const file = zipRef.current!.file(selectedPath)
        if (!file) throw new Error('missing_entry')
        const bytes = await file.async('uint8array')
        if (cancelled) return
        const kind = detectKindFromBytes(selectedPath, bytes)
        if (kind === 'pdf') {
          const pdfBlob = new Blob([bytes], { type: 'application/pdf' })
          const pdfUrl = URL.createObjectURL(pdfBlob)
          setPreviewPdfBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return pdfUrl
          })
          setPreviewBytes(bytes.slice())
          setPreviewKind('pdf')
        } else if (kind === 'image') {
          const blob = new Blob([bytes], { type: mimeForZipEntry(selectedPath, kind) })
          objectUrl = URL.createObjectURL(blob)
          setPreviewUrl(objectUrl)
          setPreviewKind('image')
        } else if (kind === 'text') {
          const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
          setPreviewText(text)
          setPreviewKind('text')
        } else if (kind === 'archive') {
          setPreviewKind('archive')
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

  const hasPreviewable = useMemo(
    () => entries.some((e) => ['pdf', 'image', 'text'].includes(entryKind(e.path))),
    [entries]
  )
  const selectedIsArchive = selectedPath ? entryKind(selectedPath) === 'archive' : false

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => e.path.toLowerCase().includes(q))
  }, [entries, search])

  const entryPaths = useMemo(() => entries.map((e) => e.path), [entries])

  const sectionNav = useMemo(
    () =>
      [
        {
          id: 'index',
          label: tr('manuaisZipNavIndice', 'Índice'),
          path: entries.find((e) => /(^|\/)index\.pdf$/i.test(e.path))?.path || null,
        },
        {
          id: 'eletrica',
          label: tr('manuaisZipNavEletrica', 'Elétrica'),
          path: findSectionPdf(entries, /elektr|eletric|electric|elektro|el[\.\-_]/i),
        },
        {
          id: 'mecanica',
          label: tr('manuaisZipNavMecanica', 'Mecânica'),
          path: findSectionPdf(entries, /mechan|mecan|mechanik|mk[\.\-_]/i),
        },
      ].filter((s) => s.path),
    [entries, tr]
  )

  const navigateToEntry = useCallback((targetPath: string) => {
    setSearch('')
    setSelectedPath(targetPath)
  }, [])

  const downloadSelected = async () => {
    if (!selectedPath || !zipRef.current) return
    try {
      const file = zipRef.current.file(selectedPath)
      if (!file) return
      const bytes = await file.async('uint8array')
      const kind = detectKindFromBytes(selectedPath, bytes)
      const blob = new Blob([bytes], { type: mimeForZipEntry(selectedPath, kind) })
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
      {!hasPreviewable ? (
        <p className="manuais-pro__preview-status manuais-pro__preview-status--warn" style={{ marginBottom: 12 }}>
          {tr(
            'manuaisZipSoArquivoInterno',
            'Este ZIP só contém outro arquivo comprimido (.rar, .7z, etc.) — não há PDFs para ver aqui. Descarregue, extraia no PC (WinRAR ou 7-Zip) e use «Importar pasta» com a pasta descompactada, ou compacte essa pasta em .zip com PDFs dentro.'
          )}
        </p>
      ) : null}
      <p className="manuais-pro__zip-explorer-hint">
        {tr(
          'manuaisZipConteudoHint',
          'Escolha um ficheiro na lista (PDF, imagem ou texto). Toque em Elétrica/Mecânica no PDF ou use os botões abaixo. Para Start.exe HOMAG, descarregue o ZIP completo.'
        )}
      </p>
      {sectionNav.length > 0 ? (
        <div className="manuais-pro__zip-section-nav" role="navigation" aria-label={tr('manuaisZipNavTitulo', 'Secções do manual')}>
          {sectionNav.map((sec) => (
            <button
              key={sec.id}
              type="button"
              className={`manuais-pro__zip-section-btn${selectedPath === sec.path ? ' is-active' : ''}`}
              onClick={() => sec.path && navigateToEntry(sec.path)}
            >
              {sec.label}
            </button>
          ))}
        </div>
      ) : null}
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
                      {kind === 'pdf'
                        ? 'PDF'
                        : kind === 'image'
                          ? 'IMG'
                          : kind === 'text'
                            ? 'TXT'
                            : kind === 'archive'
                              ? 'RAR'
                              : '···'}
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
          ) : previewKind === 'pdf' && previewBytes ? (
            <ManuaisZipPdfPreview
              bytes={previewBytes}
              path={selectedPath}
              entryPaths={entryPaths}
              onNavigate={navigateToEntry}
              tr={tr}
              fallbackBlobUrl={previewPdfBlobUrl}
            />
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
          ) : previewKind === 'archive' || selectedIsArchive ? (
            <p className="manuais-pro__preview-status">
              {tr(
                'manuaisZipRarExtrair',
                'Ficheiro .rar / .7z: extraia no computador (WinRAR ou 7-Zip). Depois importe a pasta descompactada com «+ Importar pasta», ou volte a compactar só os PDFs em .zip.'
              )}
            </p>
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

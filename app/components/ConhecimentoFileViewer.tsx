'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWritingAssistField } from '../context/WritingAssistFieldContext'

export type ConhecimentoFileItem = {
  id: string
  nome: string
  dataUrl: string
  mime?: string
  tipo?: string
}

type Props = {
  items: ConhecimentoFileItem[]
  onRemove: (id: string) => void
  tr: (key: string, fallback: string) => string
  emptyHint: string
  uploadLabel: string
  onUpload: (file: File) => void
  accept?: string
}

function guessMime(nome: string, mime?: string, tipo?: string): string {
  if (mime && mime !== 'application/octet-stream') return mime
  if (tipo && tipo !== 'application/octet-stream') return tipo
  const n = nome.toLowerCase()
  if (n.endsWith('.pdf')) return 'application/pdf'
  if (n.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (n.endsWith('.doc')) return 'application/msword'
  if (n.endsWith('.txt')) return 'text/plain'
  if (n.endsWith('.md')) return 'text/markdown'
  if (n.endsWith('.json')) return 'application/json'
  if (n.endsWith('.csv')) return 'text/csv'
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(n)) return 'image/*'
  return mime || tipo || 'application/octet-stream'
}

function isPdf(m: string, nome: string) {
  return m === 'application/pdf' || nome.toLowerCase().endsWith('.pdf')
}
function isImage(m: string, nome: string) {
  return m.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(nome)
}
function isTextLike(m: string, nome: string) {
  return (
    m.startsWith('text/') ||
    m === 'application/json' ||
    /\.(txt|md|csv|json|log|xml|html?)$/i.test(nome)
  )
}
function isWord(m: string, nome: string) {
  return (
    m.includes('wordprocessingml') ||
    m === 'application/msword' ||
    /\.(docx?|rtf)$/i.test(nome)
  )
}

function supportsTranslation(m: string, nome: string) {
  return isPdf(m, nome) || isTextLike(m, nome) || isWord(m, nome)
}

async function loadTextContent(item: ConhecimentoFileItem): Promise<string> {
  const mime = guessMime(item.nome, item.mime, item.tipo)
  if (isTextLike(mime, item.nome)) {
    const res = await fetch(item.dataUrl)
    return res.text()
  }
  if (isWord(mime, item.nome)) {
    const res = await fetch('/api/extract-file-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl: item.dataUrl, nome: item.nome }),
    })
    const data = (await res.json()) as { ok?: boolean; text?: string; message?: string; error?: string }
    if (data.ok && data.text) return data.text
    throw new Error(data.message || data.error || 'extract_failed')
  }
  return ''
}

function readTextareaSelection(el: HTMLTextAreaElement | null) {
  if (!el) return { text: '', start: 0, end: 0, hasSelection: false, full: '' }
  const full = el.value
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  const hasSelection = start !== end
  const text = (hasSelection ? full.slice(start, end) : full).trim()
  return { text, start, end, hasSelection, full }
}

export function ConhecimentoFileViewer(props: Props) {
  const { items, onRemove, tr, emptyHint, uploadLabel, onUpload, accept } = props
  const { openForField } = useWritingAssistField()
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [textLoading, setTextLoading] = useState(false)
  const [textError, setTextError] = useState<string | null>(null)
  const [editableText, setEditableText] = useState('')
  const [pdfPasteText, setPdfPasteText] = useState('')
  const docTextRef = useRef<HTMLTextAreaElement>(null)
  const pdfTextRef = useRef<HTMLTextAreaElement>(null)

  const previewItem = useMemo(
    () => (previewId ? items.find((i) => i.id === previewId) ?? null : null),
    [previewId, items]
  )

  const previewMime = previewItem
    ? guessMime(previewItem.nome, previewItem.mime, previewItem.tipo)
    : ''

  const canTranslate = previewItem ? supportsTranslation(previewMime, previewItem.nome) : false
  const isPdfPreview = previewItem ? isPdf(previewMime, previewItem.nome) : false
  const isDocTextPreview = previewItem
    ? isTextLike(previewMime, previewItem.nome) || isWord(previewMime, previewItem.nome)
    : false

  useEffect(() => {
    if (!previewItem) {
      setEditableText('')
      setPdfPasteText('')
      setTextError(null)
      setTextLoading(false)
      return
    }
    setPdfPasteText('')
    const mime = guessMime(previewItem.nome, previewItem.mime, previewItem.tipo)
    if (isPdf(mime, previewItem.nome) || isImage(mime, previewItem.nome)) {
      setEditableText('')
      setTextError(null)
      setTextLoading(false)
      return
    }
    if (isTextLike(mime, previewItem.nome) || isWord(mime, previewItem.nome)) {
      setTextLoading(true)
      setTextError(null)
      loadTextContent(previewItem)
        .then((t) => setEditableText(t))
        .catch((err) => {
          setTextError(err instanceof Error ? err.message : String(err))
          setEditableText('')
        })
        .finally(() => setTextLoading(false))
      return
    }
    setEditableText('')
    setTextError(null)
    setTextLoading(false)
  }, [previewItem])

  const runTranslate = useCallback(() => {
    const el = isPdfPreview ? pdfTextRef.current : docTextRef.current
    const { text, start, end, hasSelection, full } = readTextareaSelection(el)
    if (!text) {
      alert(
        tr(
          'bibliaTraducaoSemTexto',
          isPdfPreview
            ? 'Copie texto do PDF (Ctrl+C) e cole no campo abaixo antes de traduzir.'
            : 'Escreva, cole ou selecione texto no campo antes de traduzir.'
        )
      )
      return
    }

    const apply = (translated: string) => {
      if (isPdfPreview) {
        setPdfPasteText(translated)
        return
      }
      if (hasSelection) {
        setEditableText(full.slice(0, start) + translated + full.slice(end))
      } else {
        setEditableText(translated)
      }
    }

    openForField(text, apply)
  }, [isPdfPreview, openForField, tr])

  const runCopy = useCallback(() => {
    const el = isPdfPreview ? pdfTextRef.current : docTextRef.current
    const { text, full } = readTextareaSelection(el)
    const toCopy = text || full
    if (!toCopy.trim()) return
    void navigator.clipboard.writeText(toCopy).catch(() => {})
  }, [isPdfPreview])

  const renderPreviewBody = () => {
    if (!previewItem) return null
    const mime = previewMime
    if (isPdf(mime, previewItem.nome)) {
      return (
        <iframe
          className="manuais-pro__preview-frame"
          src={previewItem.dataUrl}
          title={previewItem.nome}
        />
      )
    }
    if (isImage(mime, previewItem.nome)) {
      return (
        <div className="manuais-pro__preview-image-wrap">
          <img src={previewItem.dataUrl} alt={previewItem.nome} className="manuais-pro__preview-image" />
        </div>
      )
    }
    if (textLoading) {
      return <p className="manuais-pro__preview-status">{tr('bibliaPreviewCarregando', 'A carregar conteúdo…')}</p>
    }
    if (textError) {
      return (
        <p className="manuais-pro__preview-status manuais-pro__preview-status--warn">
          {tr('bibliaPreviewDocxHint', 'Não foi possível extrair texto. Use Descarregar ou converta o ficheiro para PDF/TXT.')}
          {textError ? ` (${textError})` : ''}
        </p>
      )
    }
    if (isDocTextPreview) {
      return (
        <textarea
          ref={docTextRef}
          value={editableText}
          onChange={(e) => setEditableText(e.target.value)}
          rows={14}
          className="manuais-pro__preview-textarea manuais-pro__translate-field"
          style={{
            width: '100%',
            minHeight: 220,
            fontFamily: 'inherit',
            lineHeight: 1.55,
            userSelect: 'text',
          }}
          placeholder={tr(
            'bibliaPreviewTextoPlaceholder',
            'Conteúdo do ficheiro — selecione um trecho ou traduza tudo.'
          )}
        />
      )
    }
    return (
      <p className="manuais-pro__preview-status">
        {tr(
          'bibliaPreviewNaoSuportado',
          'Pré-visualização não disponível para este tipo. Use Descarregar ou abra numa nova janela.'
        )}
      </p>
    )
  }

  return (
    <div className="manuais-pro__file-viewer">
      {items.length === 0 ? (
        <p className="manuais-pro__empty-hint">{emptyHint}</p>
      ) : (
        <ul className="manuais-pro__doc-list manuais-pro__doc-list--tall">
          {items.map((item) => {
            const active = previewId === item.id
            return (
              <li key={item.id} className={`manuais-pro__doc-item${active ? ' is-active' : ''}`}>
                <span className="manuais-pro__doc-name" title={item.nome}>
                  {item.nome}
                </span>
                <div className="manuais-pro__doc-actions">
                  <button
                    type="button"
                    className="manuais-pro__doc-btn manuais-pro__doc-btn--primary"
                    onClick={() => setPreviewId(active ? null : item.id)}
                  >
                    {active
                      ? tr('bibliaPreviewFechar', 'Fechar')
                      : tr('bibliaVisualizarAnexo', 'Visualizar')}
                  </button>
                  <a
                    href={item.dataUrl}
                    download={item.nome}
                    className="manuais-pro__doc-btn"
                    title={tr('bibliaDescarregarAnexo', 'Descarregar')}
                  >
                    {tr('bibliaDescarregarAnexo', 'Descarregar')}
                  </a>
                  <button
                    type="button"
                    className="manuais-pro__act manuais-pro__act--danger"
                    onClick={() => {
                      if (previewId === item.id) setPreviewId(null)
                      onRemove(item.id)
                    }}
                    title={tr('excluir', 'Excluir')}
                  >
                    ×
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {previewItem && (
        <div className="manuais-pro__preview-panel">
          <div className="manuais-pro__preview-head">
            <div>
              <p className="manuais-pro__preview-eyebrow">{tr('bibliaPreviewTitulo', 'Pré-visualização')}</p>
              <strong className="manuais-pro__preview-filename">{previewItem.nome}</strong>
            </div>
            {isPdfPreview && (
              <a
                href={previewItem.dataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="manuais-pro__doc-btn"
              >
                {tr('bibliaAbrirNovaJanela', 'Abrir janela')}
              </a>
            )}
          </div>

          <div className="manuais-pro__preview-body">{renderPreviewBody()}</div>

          {canTranslate && (
            <div className="manuais-pro__translate-zone">
              <p className="manuais-pro__translate-zone-title">
                {tr('bibliaTraducaoComoTitulo', 'Tradução')}
              </p>
              <p className="manuais-pro__translate-zone-hint">
                {isPdfPreview
                  ? tr(
                      'bibliaTraducaoHintPdf',
                      '1. Selecione texto no PDF acima e copie (Ctrl+C). 2. Cole abaixo. 3. Prima Traduzir (trecho seleccionado ou texto completo).'
                    )
                  : tr(
                      'bibliaTraducaoHintDoc',
                      'Selecione um trecho no texto acima ou deixe sem seleção para traduzir tudo. Prima Traduzir.'
                    )}
              </p>

              {isPdfPreview && (
                <textarea
                  ref={pdfTextRef}
                  value={pdfPasteText}
                  onChange={(e) => setPdfPasteText(e.target.value)}
                  rows={6}
                  className="manuais-pro__translate-field"
                  placeholder={tr(
                    'bibliaTraducaoCampoPdf',
                    'Cole aqui o texto copiado do PDF…'
                  )}
                />
              )}

              <div className="manuais-pro__translate-actions">
                <button
                  type="button"
                  className="manuais-pro__doc-btn manuais-pro__doc-btn--translate-main"
                  onClick={runTranslate}
                >
                  {tr('bibliaTraduzir', 'Traduzir')}
                </button>
                <button type="button" className="manuais-pro__doc-btn" onClick={runCopy}>
                  {tr('bibliaCopiarTexto', 'Copiar texto')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <label className="manuais-pro__upload">
        <input
          type="file"
          accept={accept}
          className="manuais-pro__file-input"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) {
              onUpload(f)
              e.target.value = ''
            }
          }}
        />
        {uploadLabel}
      </label>
    </div>
  )
}

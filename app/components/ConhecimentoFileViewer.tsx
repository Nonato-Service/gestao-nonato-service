'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AssistTextarea } from './AssistTextFields'
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

export function ConhecimentoFileViewer(props: Props) {
  const { items, onRemove, tr, emptyHint, uploadLabel, onUpload, accept } = props
  const { openForField } = useWritingAssistField()
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [textContent, setTextContent] = useState('')
  const [textLoading, setTextLoading] = useState(false)
  const [textError, setTextError] = useState<string | null>(null)
  const [editableText, setEditableText] = useState('')

  const previewItem = useMemo(
    () => (previewId ? items.find((i) => i.id === previewId) ?? null : null),
    [previewId, items]
  )

  const previewMime = previewItem
    ? guessMime(previewItem.nome, previewItem.mime, previewItem.tipo)
    : ''

  useEffect(() => {
    if (!previewItem) {
      setTextContent('')
      setEditableText('')
      setTextError(null)
      setTextLoading(false)
      return
    }
    const mime = guessMime(previewItem.nome, previewItem.mime, previewItem.tipo)
    if (isPdf(mime, previewItem.nome) || isImage(mime, previewItem.nome)) {
      setTextContent('')
      setEditableText('')
      setTextError(null)
      setTextLoading(false)
      return
    }
    if (isTextLike(mime, previewItem.nome) || isWord(mime, previewItem.nome)) {
      setTextLoading(true)
      setTextError(null)
      loadTextContent(previewItem)
        .then((t) => {
          setTextContent(t)
          setEditableText(t)
        })
        .catch((err) => {
          setTextError(err instanceof Error ? err.message : String(err))
          setTextContent('')
          setEditableText('')
        })
        .finally(() => setTextLoading(false))
      return
    }
    setTextContent('')
    setEditableText('')
    setTextError(null)
    setTextLoading(false)
  }, [previewItem])

  const handleTranslateSelection = useCallback(() => {
    const sel = typeof window !== 'undefined' ? window.getSelection()?.toString().trim() : ''
    const source = sel || editableText.trim()
    if (!source) {
      alert(tr('bibliaPreviewSemSelecao', 'Selecione um trecho de texto ou carregue o conteúdo textual primeiro.'))
      return
    }
    openForField(source, (translated) => {
      if (sel) {
        try {
          void navigator.clipboard.writeText(translated)
          alert(tr('bibliaTraducaoCopiada', 'Tradução copiada para a área de transferência.'))
        } catch {
          setEditableText((prev) => (prev ? `${prev}\n\n---\n${translated}` : translated))
        }
      } else {
        setEditableText(translated)
      }
    })
  }, [editableText, openForField, tr])

  const handleCopySelection = useCallback(() => {
    const sel = typeof window !== 'undefined' ? window.getSelection()?.toString().trim() : ''
    const text = sel || editableText
    if (!text) return
    void navigator.clipboard.writeText(text).catch(() => {})
  }, [editableText])

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
    if (isTextLike(mime, previewItem.nome) || isWord(mime, previewItem.nome)) {
      return (
        <AssistTextarea
          value={editableText}
          onValueChange={setEditableText}
          rows={14}
          className="manuais-pro__preview-textarea"
          style={{
            width: '100%',
            minHeight: 220,
            fontFamily: 'inherit',
            lineHeight: 1.55,
            userSelect: 'text',
          }}
          placeholder={tr('bibliaPreviewTextoPlaceholder', 'Conteúdo do ficheiro — selecione texto para traduzir.')}
          assistButtonTitle={tr('bibliaTraduzirTexto', 'Traduzir texto com assistente')}
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
          <div className="manuais-pro__translate-guide">
            <p className="manuais-pro__translate-guide-title">
              {tr('bibliaTraducaoComoTitulo', 'Como traduzir')}
            </p>
            <ol className="manuais-pro__translate-steps">
              <li>{tr('bibliaTraducaoPasso1', '1. Clique Visualizar no ficheiro')}</li>
              <li>{tr('bibliaTraducaoPasso2', '2. Selecione o texto (ou use o campo abaixo em Word/TXT)')}</li>
              <li>{tr('bibliaTraducaoPasso3', '3. Prima Traduzir — abre o assistente de dois idiomas')}</li>
            </ol>
            {isPdf(previewMime, previewItem.nome) && (
              <p className="manuais-pro__translate-pdf-hint">
                {tr(
                  'bibliaTraducaoPdfHint',
                  'Em PDF: selecione texto dentro do documento, copie (Ctrl+C) e use «Abrir tradutor» para colar e traduzir.'
                )}
              </p>
            )}
          </div>
          <div className="manuais-pro__preview-head">
            <div>
              <p className="manuais-pro__preview-eyebrow">{tr('bibliaPreviewTitulo', 'Pré-visualização')}</p>
              <strong className="manuais-pro__preview-filename">{previewItem.nome}</strong>
            </div>
            <div className="manuais-pro__preview-toolbar">
              <button
                type="button"
                className="manuais-pro__doc-btn manuais-pro__doc-btn--translate-main"
                onClick={() => {
                  const sel = typeof window !== 'undefined' ? window.getSelection()?.toString().trim() : ''
                  const source = sel || editableText.trim()
                  openForField(source, (translated) => {
                    if (!source) return
                    if (sel) {
                      void navigator.clipboard.writeText(translated).catch(() => {})
                      alert(tr('bibliaTraducaoCopiada', 'Tradução copiada para a área de transferência.'))
                    } else {
                      setEditableText(translated)
                    }
                  })
                }}
              >
                ✦ {tr('bibliaAbrirTradutor', 'Abrir tradutor')}
              </button>
              <button type="button" className="manuais-pro__doc-btn manuais-pro__doc-btn--accent" onClick={handleTranslateSelection}>
                {tr('bibliaTraduzirSelecao', 'Traduzir seleção')}
              </button>
              <button type="button" className="manuais-pro__doc-btn" onClick={handleCopySelection}>
                {tr('bibliaCopiarSelecao', 'Copiar seleção')}
              </button>
              {(isTextLike(previewMime, previewItem.nome) || isWord(previewMime, previewItem.nome)) && editableText && (
                <button
                  type="button"
                  className="manuais-pro__doc-btn manuais-pro__doc-btn--accent"
                  onClick={() => openForField(editableText, setEditableText)}
                >
                  {tr('bibliaTraduzirTexto', 'Traduzir texto completo')}
                </button>
              )}
              <a href={previewItem.dataUrl} target="_blank" rel="noopener noreferrer" className="manuais-pro__doc-btn">
                {tr('bibliaAbrirNovaJanela', 'Abrir janela')}
              </a>
            </div>
          </div>
          <div className="manuais-pro__preview-body">{renderPreviewBody()}</div>
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

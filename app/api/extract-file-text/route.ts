import { NextRequest, NextResponse } from 'next/server'
import AdmZip from 'adm-zip'

export const runtime = 'nodejs'

function parseDataUrl(dataUrl: string): Buffer | null {
  if (!dataUrl.startsWith('data:')) return null
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return null
  const meta = dataUrl.slice(0, comma)
  const payload = dataUrl.slice(comma + 1)
  if (meta.includes(';base64')) {
    return Buffer.from(payload, 'base64')
  }
  try {
    return Buffer.from(decodeURIComponent(payload), 'utf8')
  } catch {
    return null
  }
}

function stripXml(xml: string): string {
  return xml
    .replace(/<w:tab[^/]*\/>/gi, '\t')
    .replace(/<w:br[^/]*\/>/gi, '\n')
    .replace(/<\/w:p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function extractDocxText(buf: Buffer): string {
  const zip = new AdmZip(buf)
  const entry = zip.getEntry('word/document.xml')
  if (!entry) return ''
  return stripXml(entry.getData().toString('utf8'))
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { dataUrl?: string; nome?: string }
    const dataUrl = String(body.dataUrl || '')
    const nome = String(body.nome || '').toLowerCase()
    const buf = parseDataUrl(dataUrl)
    if (!buf) {
      return NextResponse.json({ ok: false, error: 'invalid_data_url' }, { status: 400 })
    }

    const isDocx =
      nome.endsWith('.docx') ||
      dataUrl.startsWith('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    const isDoc = nome.endsWith('.doc') || dataUrl.startsWith('data:application/msword')
    const isText =
      nome.endsWith('.txt') ||
      nome.endsWith('.md') ||
      nome.endsWith('.csv') ||
      nome.endsWith('.json') ||
      dataUrl.startsWith('data:text/')

    if (isDocx) {
      const text = extractDocxText(buf)
      return NextResponse.json({ ok: true, text, kind: 'docx' })
    }
    if (isDoc) {
      return NextResponse.json({
        ok: false,
        error: 'doc_binary',
        message: 'Formato .doc antigo — use Descarregar ou converta para .docx.',
      })
    }
    if (isText) {
      return NextResponse.json({ ok: true, text: buf.toString('utf8'), kind: 'text' })
    }

    return NextResponse.json({ ok: false, error: 'unsupported' }, { status: 400 })
  } catch (e) {
    console.error('[extract-file-text]', e)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}

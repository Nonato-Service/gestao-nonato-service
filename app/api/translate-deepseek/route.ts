import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

const LANG_LABEL: Record<string, string> = {
  'pt-BR': 'Portuguese (Brazil)',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  de: 'German',
}

function extractJsonObject(text: string): Record<string, string> | null {
  const trimmed = text.trim()
  try {
    const o = JSON.parse(trimmed)
    if (o && typeof o === 'object' && !Array.isArray(o)) return o as Record<string, string>
  } catch {
    /* fall through */
  }
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try {
      const o = JSON.parse(trimmed.slice(start, end + 1))
      if (o && typeof o === 'object' && !Array.isArray(o)) return o as Record<string, string>
    } catch {
      return null
    }
  }
  return null
}

export async function POST(req: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey?.trim()) {
    return NextResponse.json(
      {
        error:
          'Chave DeepSeek não configurada. Crie DEEPSEEK_API_KEY no ficheiro .env (local) ou nas variáveis do Railway.',
      },
      { status: 503 }
    )
  }

  let body: { sourceLang?: string; targetLang?: string; fields?: Record<string, string> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { sourceLang = 'pt-BR', targetLang = 'en', fields } = body
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    return NextResponse.json({ error: 'Campo "fields" é obrigatório (objeto chave→texto)' }, { status: 400 })
  }

  const entries = Object.entries(fields).filter(
    ([, v]) => typeof v === 'string' && v.trim().length > 0
  )
  if (entries.length === 0) {
    return NextResponse.json({ error: 'Nenhum texto para traduzir' }, { status: 400 })
  }

  const totalChars = entries.reduce((n, [, v]) => n + v.length, 0)
  if (totalChars > 14000) {
    return NextResponse.json(
      { error: 'Texto total demasiado longo (máx. ~14000 caracteres). Reduza e tente novamente.' },
      { status: 400 }
    )
  }

  const src = LANG_LABEL[sourceLang] || sourceLang
  const tgt = LANG_LABEL[targetLang] || targetLang
  if (sourceLang === targetLang) {
    const translated: Record<string, string> = {}
    for (const [k, v] of entries) translated[k] = v
    return NextResponse.json({ translated })
  }

  const payload = Object.fromEntries(entries)
  const system = `You translate technical field service reports. Rules:
- Preserve unchanged: numbers, dates, times, serial numbers, product codes, model names, email, URLs, percentages.
- Translate only human-readable prose.
- Output MUST be a single JSON object with EXACTLY the same keys as input. Values are translated strings.
- Empty strings stay empty. No markdown fences. No commentary.`

  const user = `Source language: ${src}
Target language: ${tgt}

Input JSON (translate each value):
${JSON.stringify(payload, null, 0)}`

  const url = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions'

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
        max_tokens: 8192,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg =
        (data as { error?: { message?: string } })?.error?.message ||
        (typeof (data as { message?: string }).message === 'string'
          ? (data as { message: string }).message
          : `HTTP ${res.status}`)
      return NextResponse.json({ error: msg }, { status: res.status >= 500 ? 502 : 400 })
    }

    const content = (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message
      ?.content
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Resposta vazia da API DeepSeek' }, { status: 502 })
    }

    const translated = extractJsonObject(content)
    if (!translated) {
      return NextResponse.json(
        { error: 'Não foi possível ler o JSON da tradução. Tente de novo ou reduza o texto.' },
        { status: 502 }
      )
    }

    const out: Record<string, string> = {}
    for (const [k] of entries) {
      const v = translated[k]
      out[k] = typeof v === 'string' ? v : payload[k]
    }

    return NextResponse.json({ translated: out })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro de rede'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

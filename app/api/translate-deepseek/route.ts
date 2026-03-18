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

function normalizeApiUrl(raw?: string): string {
  const def = 'https://api.deepseek.com/chat/completions'
  if (!raw?.trim()) return def
  let u = raw.trim().replace(/\/$/, '')
  if (!u.includes('chat/completions')) {
    u = u.endsWith('/v1') ? `${u}/chat/completions` : `${u}/chat/completions`
  }
  return u
}

function extractJsonObject(text: string): Record<string, string> | null {
  let s = text.trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  try {
    const o = JSON.parse(s)
    if (o && typeof o === 'object' && !Array.isArray(o)) return o as Record<string, string>
  } catch {
    /* fall through */
  }
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try {
      const o = JSON.parse(s.slice(start, end + 1))
      if (o && typeof o === 'object' && !Array.isArray(o)) return o as Record<string, string>
    } catch {
      return null
    }
  }
  return null
}

/** GET: ver se a chave está configurada (para aviso na interface) */
export async function GET() {
  const ok = !!process.env.DEEPSEEK_API_KEY?.trim()
  return NextResponse.json({ deepseekConfigured: ok })
}

export async function POST(req: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey?.trim()) {
    return NextResponse.json(
      {
        error:
          'DeepSeek: defina DEEPSEEK_API_KEY no .env (local) ou nas variáveis de ambiente do Railway / servidor.',
      },
      { status: 503 }
    )
  }

  let body: { sourceLang?: string; targetLang?: string; fields?: Record<string, string> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido no pedido' }, { status: 400 })
  }

  const { sourceLang = 'pt-BR', targetLang = 'en', fields } = body
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    return NextResponse.json({ error: 'Campo "fields" é obrigatório' }, { status: 400 })
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
      { error: 'Texto demasiado longo (máx. ~14000 caracteres).' },
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
  const keysList = Object.keys(payload).join(', ')
  const system = `You translate technical field service reports. Output valid JSON only.
Rules: Keep numbers, dates, times, serial numbers, codes, model names, emails, URLs unchanged.
Translate prose only. Return one JSON object with exactly these keys: ${keysList}
Each value is the translated string. No markdown, no explanation, no code fences.`

  const user = `From ${src} to ${tgt}:\n${JSON.stringify(payload)}`

  const url = normalizeApiUrl(process.env.DEEPSEEK_API_URL)
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

  async function callDeepSeek(useJsonMode: boolean) {
    const bodyReq: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      max_tokens: 8192,
    }
    if (useJsonMode) {
      bodyReq.response_format = { type: 'json_object' }
    }
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyReq),
    })
  }

  try {
    let res = await callDeepSeek(true)
    let data = await res.json().catch(() => ({}))

    if (!res.ok && (data as { error?: { message?: string } })?.error?.message?.includes('response_format')) {
      res = await callDeepSeek(false)
      data = await res.json().catch(() => ({}))
    }

    if (!res.ok) {
      const msg =
        (data as { error?: { message?: string } })?.error?.message ||
        (typeof (data as { message?: string }).message === 'string'
          ? (data as { message: string }).message
          : `HTTP ${res.status}`)
      return NextResponse.json(
        { error: `DeepSeek: ${msg}` },
        { status: res.status >= 500 ? 502 : 400 }
      )
    }

    const content = (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message
      ?.content
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'DeepSeek devolveu resposta vazia. Verifique o modelo e a chave API.' },
        { status: 502 }
      )
    }

    let translated = extractJsonObject(content)
    if (!translated) {
      const retryRes = await callDeepSeek(false)
      const retryData = await retryRes.json().catch(() => ({}))
      const retryContent = (retryData as { choices?: { message?: { content?: string } }[] })?.choices?.[0]
        ?.message?.content
      if (retryContent && typeof retryContent === 'string') {
        translated = extractJsonObject(retryContent)
      }
    }

    if (!translated) {
      return NextResponse.json(
        {
          error:
            'Não foi possível ler o JSON da tradução. Tente texto mais curto ou verifique a conta DeepSeek.',
        },
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
    return NextResponse.json({ error: `DeepSeek: ${msg}` }, { status: 502 })
  }
}

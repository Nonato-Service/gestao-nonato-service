import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HOMAG_ORIGIN = 'https://shop.homag.com'

const NO_STORE_HEADERS: HeadersInit = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
}

function isAllowedHomagUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    return host === 'shop.homag.com' || host.endsWith('.homag.com')
  } catch {
    return false
  }
}

/** Proxy público só para URLs shop.homag.com — permite <img> sem bloqueio de sessão. */
export async function GET(request: NextRequest) {
  const url = (new URL(request.url).searchParams.get('url') || '').trim()
  if (!url || !isAllowedHomagUrl(url)) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  try {
    const res = await fetch(url, {
      headers: {
        Referer: `${HOMAG_ORIGIN}/`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      cache: 'no-store',
    })
    if (!res.ok) {
      return new NextResponse(null, { status: res.status === 404 ? 404 : 502, headers: NO_STORE_HEADERS })
    }
    const buf = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    return new NextResponse(null, { status: 502, headers: NO_STORE_HEADERS })
  }
}

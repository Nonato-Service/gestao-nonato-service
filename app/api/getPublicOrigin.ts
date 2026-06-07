import { NextRequest } from 'next/server'

const INVALID_HOSTS = new Set(['0.0.0.0', '127.0.0.1', 'localhost', '[::1]', '::1'])

function hostOnly(host: string): string {
  return host.split(':')[0]?.trim().toLowerCase() || ''
}

function isValidPublicHost(host: string): boolean {
  const h = hostOnly(host)
  if (!h) return false
  if (INVALID_HOSTS.has(h)) return false
  return true
}

function pickHost(raw: string | null | undefined): string | null {
  if (!raw) return null
  const first = raw.split(',')[0]?.trim()
  if (!first || !isValidPublicHost(first)) return null
  return first
}

/**
 * Origem pública correcta para redirects (Railway/proxy).
 * Evita redireccionar para 0.0.0.0:PORT quando o Node escuta em 0.0.0.0 internamente.
 */
export function getPublicOrigin(request: NextRequest): string {
  const envRaw =
    process.env.NONATO_PUBLIC_URL?.trim() ||
    process.env.RAILWAY_STATIC_URL?.trim() ||
    (process.env.RAILWAY_PUBLIC_DOMAIN?.trim()
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN.trim()}`
      : '')
  if (envRaw) {
    try {
      const u = new URL(envRaw.startsWith('http') ? envRaw : `https://${envRaw}`)
      if (isValidPublicHost(u.host)) return u.origin
    } catch {
      /* continuar */
    }
  }

  const xfProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
  const xfHost = pickHost(request.headers.get('x-forwarded-host'))
  if (xfHost) return `${xfProto}://${xfHost}`

  const host = pickHost(request.headers.get('host'))
  if (host) {
    const proto =
      request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
      request.nextUrl.protocol.replace(':', '') ||
      'https'
    return `${proto}://${host}`
  }

  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const ref = new URL(referer)
      if (isValidPublicHost(ref.host)) return ref.origin
    } catch {
      /* continuar */
    }
  }

  try {
    if (isValidPublicHost(request.nextUrl.host)) return request.nextUrl.origin
  } catch {
    /* continuar */
  }

  return request.nextUrl.origin
}

/** Resolver ligações relativas de PDF para ficheiros dentro de um ZIP de manual. */

function normalizePathPart(part: string): string {
  return decodeURIComponent(part.trim().replace(/\\/g, '/'))
}

export function normalizeZipRelativePath(currentPath: string, target: string): string {
  const raw = normalizePathPart(target.split('#')[0].split('?')[0])
  if (!raw) return ''
  if (/^[a-zA-Z]:\//.test(raw) || raw.startsWith('/')) return raw.replace(/^\/+/, '')

  const dir = currentPath.includes('/') ? currentPath.replace(/\/[^/]+$/, '') : ''
  let combined = raw
  if (dir && !raw.startsWith('../') && !raw.startsWith('./')) {
    combined = raw.includes('/') ? raw : `${dir}/${raw}`
  } else if (dir) {
    combined = `${dir}/${raw}`
  }

  const parts = combined.split('/').filter((p) => p.length > 0)
  const stack: string[] = []
  for (const p of parts) {
    if (p === '.') continue
    if (p === '..') {
      stack.pop()
      continue
    }
    stack.push(p)
  }
  return stack.join('/')
}

export function cleanLinkTarget(target: string): string {
  let t = target.trim()
  t = t.replace(/^file:\/\/\/[a-z]:\//i, '')
  t = t.replace(/^file:\/\//i, '')
  return t.replace(/^\/+/, '')
}

export function matchEntryByPathSuffix(normalized: string, entryPaths: string[]): string | null {
  const targetParts = normalized
    .toLowerCase()
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
  if (targetParts.length === 0) return null
  if (/^[a-z]:$/.test(targetParts[0])) targetParts.shift()

  const matches = entryPaths.filter((p) => {
    const ep = p.toLowerCase().replace(/\\/g, '/').split('/').filter(Boolean)
    if (ep.length < targetParts.length) return false
    const tail = ep.slice(-targetParts.length)
    return tail.every((seg, i) => seg === targetParts[i])
  })

  if (matches.length === 1) return matches[0]
  if (matches.length > 1) {
    matches.sort((a, b) => a.length - b.length)
    return matches[0]
  }
  return null
}

/** Resolve ligações relativas do PDF (ex.: Elektrik/Index.PDF) para um ficheiro dentro do ZIP. */
export function resolveZipEntryPath(
  currentPath: string,
  linkTarget: string,
  entryPaths: string[]
): string | null {
  const normalized = normalizeZipRelativePath(currentPath, cleanLinkTarget(linkTarget))
  if (!normalized) return null

  const suffixMatch = matchEntryByPathSuffix(normalized, entryPaths)
  if (suffixMatch) return suffixMatch

  const lowerPaths = entryPaths.map((p) => ({ p, l: p.toLowerCase().replace(/\\/g, '/') }))
  const normLower = normalized.toLowerCase()

  const direct = lowerPaths.find((x) => x.l === normLower)
  if (direct) return direct.p

  const base = normLower.split('/').pop() || normLower
  const byBase = lowerPaths.filter((x) => x.l.split('/').pop() === base)
  if (byBase.length === 1) return byBase[0].p

  const ends = lowerPaths.filter(
    (x) => x.l.endsWith(`/${normLower}`) || x.l.endsWith(normLower) || x.l.includes(`/${normLower}`)
  )
  if (ends.length === 1) return ends[0].p
  if (ends.length > 1) {
    ends.sort((a, b) => a.l.length - b.l.length)
    return ends[0].p
  }

  if (!/\.[a-z0-9]{2,5}$/i.test(normLower)) {
    const folderPdfs = lowerPaths.filter(
      (x) => x.l.includes(`/${normLower}/`) && x.l.endsWith('.pdf')
    )
    if (folderPdfs.length > 0) {
      const idx = folderPdfs.find((x) => /index\.pdf$/.test(x.l))
      return (idx || folderPdfs[0]).p
    }
  }

  const keyword = normLower.replace(/\.(pdf|htm|html?)$/i, '')
  if (keyword.length >= 3) {
    const kw = lowerPaths.filter((x) => x.l.includes(keyword) && x.l.endsWith('.pdf'))
    if (kw.length === 1) return kw[0].p
  }

  return null
}

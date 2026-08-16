export const BIBLIOTECA_PECAS_ULTIMA_SELECAO_KEY = 'nonato-biblioteca-pecas-ultima-selecao'
export const NONATO_PECA_LOOKUP_URL_TEMPLATE_KEY = 'nonato-peca-lookup-url-template'

/** URL de entrada da loja HOMAG (sem código no path); convertida automaticamente para pesquisa global. */
export const HOMAG_SHOP_PECA_LOOKUP_ROOT = 'https://shop.homag.com/s/?language=en_US'

export function buildPecaCatalogoUrlFromTemplate(template: string, codigo: string): string | null {
  const rawCode = String(codigo || '').trim()
  const tpl = String(template || '').trim()
  if (!rawCode || !tpl) return null

  const hasExplicitPlaceholder =
    /\{codigo\}/i.test(tpl) || /\{codigopath\}/i.test(tpl) || /\{CODIGOPATH\}/i.test(tpl) || tpl.includes('*')

  // HOMAG eShop: só a página da loja (ex.: …/s/?language=en_US) — monta pesquisa global com o mesmo idioma.
  if (!hasExplicitPlaceholder) {
    try {
      const u = new URL(tpl)
      if (/shop\.homag\.com$/i.test(u.hostname)) {
        const path = (u.pathname || '/').replace(/\/+$/, '') || '/'
        if (path === '/s') {
          const language = u.searchParams.get('language') || 'en_US'
          const term = encodeURIComponent(rawCode)
          const out = `https://shop.homag.com/s/global-search/${term}?language=${encodeURIComponent(language)}`
          return new URL(out).href
        }
      }
    } catch {
      /* continuar com marcadores clássicos */
    }
  }

  const enc = encodeURIComponent(rawCode)
  const encPath = encodeURI(rawCode)
  let out = tpl
  if (out.includes('{codigo}')) out = out.split('{codigo}').join(enc)
  else if (out.includes('{CODIGO}')) out = out.split('{CODIGO}').join(enc)
  else if (out.includes('{codigoPath}')) out = out.split('{codigoPath}').join(encPath)
  else if (out.includes('{CODIGOPATH}')) out = out.split('{CODIGOPATH}').join(encPath)
  else if (out.includes('*')) out = out.replace(/\*/g, enc)
  else return null
  if (!out.startsWith('http://') && !out.startsWith('https://')) return null
  try {
    return new URL(out).href
  } catch {
    return null
  }
}

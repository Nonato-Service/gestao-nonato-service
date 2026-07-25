/**
 * Importação HOMAG via API Aura — commerce.SearchController.searchProducts
 * Página UI 1-based → searchInput.page 0-based.
 */
import { absHomagUrl, decodeHtmlText } from './images.mjs'
import { extractHomagPrecoFromProduct, formatHomagPreco } from './homag-preco.mjs'
import { normalizarCodigoHomagProduto } from './homag-codigo-ref.mjs'

export const DEFAULT_FIELDS = ['Name', 'StockKeepingUnit', 'From_price__c']

export function parseCategoryIdFromUrl(startUrl) {
  const m = String(startUrl || '').match(/\/category\/[^/]+\/([0-9A-Za-z]{18})/)
  return m ? m[1] : '0ZG0900000059puGAA'
}

export function parseHomagAuraProducts(body) {
  let data = body
  if (typeof body === 'string') {
    try {
      data = JSON.parse(body)
    } catch {
      return { products: [], total: 0, pageSize: 20 }
    }
  }
  const actions = data?.actions || []
  for (const act of actions) {
    const pp =
      act?.returnValue?.returnValue?.productsPage ||
      act?.returnValue?.productsPage ||
      act?.returnValue?.returnValue?.returnValue?.productsPage
    const categories = act?.returnValue?.returnValue?.categories || act?.returnValue?.categories
    if (!pp?.products) continue
    const products = (pp.products || [])
      .map((p) => {
        const rawCodigo = String(p?.fields?.StockKeepingUnit?.value || p?.fields?.sku?.value || '').trim()
        const norm = normalizarCodigoHomagProduto(rawCodigo)
        if (!norm) return null
        const codigo = norm.codigo
        const nome = decodeHtmlText(p?.fields?.Name?.value || p?.name || codigo)
        let imagemUrl = absHomagUrl(
          p?.defaultImage?.url ||
            p?.defaultImage?.thumbnailUrl ||
            p?.image?.url ||
            p?.fields?.Image_URL__c?.value ||
            ''
        )
        const preco = formatHomagPreco(extractHomagPrecoFromProduct(p))
        return {
          codigo,
          codigoOriginal: norm.codigoOriginal,
          referenciasAlternativas: norm.referenciasAlternativas,
          codigosAlternativos: norm.codigosAlternativos,
          descricao: nome,
          imagemUrl,
          preco,
        }
      })
      .filter(Boolean)
    return {
      products,
      total: Number(pp.total) || 0,
      pageSize: Number(pp.pageSize) || 20,
      rawCategories: categories || null,
    }
  }
  return { products: [], total: 0, pageSize: 20, rawCategories: null }
}

/**
 * Captura webstoreId + aura.context da sessão actual.
 */
export async function captureAuraSession(page, startUrl) {
  const categoryId = parseCategoryIdFromUrl(startUrl)
  let captured = null

  const handler = (req) => {
    if (req.method() !== 'POST' || !req.url().includes('/aura')) return
    const post = req.postData() || ''
    if (!post.includes('searchProducts')) return
    try {
      const params = new URLSearchParams(post)
      const message = JSON.parse(params.get('message'))
      const action = message.actions?.[0]
      const auraContext = params.get('aura.context')
      const pageURI = params.get('aura.pageURI') || '/s/category/spare-parts'
      if (action?.params?.params?.searchInput) {
        captured = {
          categoryId,
          webstoreId: action.params.params.webstoreId,
          effectiveAccountId: action.params.params.effectiveAccountId ?? null,
          searchInputTemplate: action.params.params.searchInput,
          auraContext,
          pageURI,
          auraUrl: req.url().split('?')[0] + '?aura.ApexAction.execute=1',
        }
      }
    } catch {
      /* ignore */
    }
  }

  page.on('request', handler)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(12000)
  page.off('request', handler)

  if (!captured?.webstoreId) {
    throw new Error('[HOMAG API] Não foi possível capturar sessão Aura (searchProducts).')
  }
  return captured
}

function buildSearchInput(session, pageNum) {
  const pageIndex = Math.max(0, Number(pageNum) - 1)
  return {
    ...session.searchInputTemplate,
    categoryId: session.categoryId,
    searchTerm: session.searchInputTemplate?.searchTerm ?? '',
    refinements: session.searchInputTemplate?.refinements ?? [],
    fields: session.searchInputTemplate?.fields ?? DEFAULT_FIELDS,
    page: pageIndex,
    includeQuantityRule: true,
    includePrices: true,
  }
}

/**
 * @param {import('playwright').BrowserContext} context
 * @param {object} session — de captureAuraSession
 * @param {number} pageNum — página 1-based
 */
export async function fetchHomagProductsViaApi(context, session, pageNum) {
  const message = {
    actions: [
      {
        id: '1;a',
        descriptor: 'aura://ApexActionController/ACTION$execute',
        callingDescriptor: 'UNKNOWN',
        params: {
          namespace: 'commerce',
          classname: 'SearchController',
          method: 'searchProducts',
          params: {
            webstoreId: session.webstoreId,
            effectiveAccountId: session.effectiveAccountId ?? null,
            searchInput: buildSearchInput(session, pageNum),
          },
          cacheable: false,
          isContinuation: false,
        },
      },
    ],
  }

  const body = new URLSearchParams({
    message: JSON.stringify(message),
    'aura.context': session.auraContext,
    'aura.pageURI': session.pageURI,
    'aura.token': 'undefined',
  })

  const base = 'https://shop.homag.com'
  const url = session.auraUrl.startsWith('http') ? session.auraUrl : `${base}/s/sfsites/aura?aura.ApexAction.execute=1`

  const res = await context.request.post(url, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: `${base}${session.pageURI}`,
    },
    data: body.toString(),
  })

  if (!res.ok()) {
    throw new Error(`[HOMAG API] HTTP ${res.status()} pág.${pageNum}`)
  }
  const text = await res.text()
  const parsed = parseHomagAuraProducts(text)
  return { ...parsed, pageNum, range: rangeFromPage(pageNum, parsed.pageSize, parsed.total) }
}

function rangeFromPage(pageNum, pageSize = 20, total = 0) {
  const start = (pageNum - 1) * pageSize + 1
  const end = Math.min(pageNum * pageSize, total || pageNum * pageSize)
  return `${start} - ${end} of ${total || '?'} Items`
}

export function catalogMaxPage(total, pageSize = 20) {
  return total > 0 ? Math.ceil(total / pageSize) : 0
}

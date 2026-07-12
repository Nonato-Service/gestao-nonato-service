/**
 * Importação HOMAG via API Aura — contorna limite de 250 págs (5000 itens/query).
 */
import fs from 'fs'
import { normCodigo } from './resume.mjs'
import {
  captureAuraSession,
  fetchHomagProductsViaApi,
  parseHomagAuraProducts,
  parseCategoryIdFromUrl,
  catalogMaxPage,
} from './api-products.mjs'

const API_MAX_PAGE_INDEX = 249
const API_PAGE_SIZE = 20
const API_MAX_ITEMS_PER_QUERY = (API_MAX_PAGE_INDEX + 1) * API_PAGE_SIZE

async function auraSearch(context, session, searchInput) {
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
            effectiveAccountId: null,
            searchInput,
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
  const res = await context.request.post(
    'https://shop.homag.com/s/sfsites/aura?aura.ApexAction.execute=1',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Referer: `https://shop.homag.com${session.pageURI}`,
      },
      data: body.toString(),
    }
  )
  const text = await res.text()
  if (!res.ok()) throw new Error(`[HOMAG API] HTTP ${res.status()}`)
  const parsed = JSON.parse(text)
  const act = parsed.actions?.[0]
  if (act?.state === 'ERROR') {
    const msg = act?.error?.[0]?.message || 'Aura ERROR'
    throw new Error(`[HOMAG API] ${msg}`)
  }
  return parseHomagAuraProducts(text)
}

function baseInput(session, categoryId, searchTerm = '') {
  return {
    ...session.searchInputTemplate,
    categoryId,
    searchTerm: searchTerm || '',
    refinements: [],
    fields: session.searchInputTemplate?.fields || ['Name', 'StockKeepingUnit', 'From_price__c'],
    includeQuantityRule: true,
    includePrices: false,
  }
}

export async function fetchCategoryTree(context, session, categoryId) {
  const r = await auraSearch(context, session, { ...baseInput(session, categoryId), page: 0 })
  const cats = r.rawCategories || null
  return { total: r.total, categories: cats }
}

export async function getSearchTotal(context, session, categoryId, searchTerm) {
  const r = await auraSearch(context, session, { ...baseInput(session, categoryId, searchTerm), page: 0 })
  return r.total
}

/** Divide prefixos até cada bucket ter ≤5000 itens (máx. 250 págs API). */
export async function buildSearchBuckets(context, session, categoryId, rootTerm = '') {
  const buckets = []
  const queue = [{ categoryId, searchTerm: rootTerm }]
  const seen = new Set()

  while (queue.length) {
    const { categoryId: cid, searchTerm } = queue.shift()
    const key = `${cid}|${searchTerm}`
    if (seen.has(key)) continue
    seen.add(key)

    let total = 0
    try {
      total = await getSearchTotal(context, session, cid, searchTerm)
    } catch (e) {
      console.warn(`[HOMAG API] Bucket "${searchTerm || '(todos)'}": ${e.message}`)
      continue
    }
    if (total <= 0) continue

    if (total <= API_MAX_ITEMS_PER_QUERY) {
      buckets.push({ categoryId: cid, searchTerm, total })
      console.log(`[HOMAG API] Bucket "${searchTerm || '(todos)'}" — ${total} itens, ${Math.ceil(total / 20)} págs`)
    } else {
      for (let d = 0; d <= 9; d++) {
        queue.push({ categoryId: cid, searchTerm: searchTerm + String(d) })
      }
    }
  }
  return buckets
}

export async function fetchBucketPage(context, session, bucket, pageIndex) {
  const input = { ...baseInput(session, bucket.categoryId, bucket.searchTerm), page: pageIndex }
  const r = await auraSearch(context, session, input)
  return r.products
}

export async function fetchAllBucketProducts(context, session, bucket, onPage) {
  const maxIdx = Math.min(API_MAX_PAGE_INDEX, Math.ceil(bucket.total / API_PAGE_SIZE) - 1)
  const all = []
  for (let idx = 0; idx <= maxIdx; idx++) {
    const products = await fetchBucketPage(context, session, bucket, idx)
    if (onPage) await onPage(idx + 1, maxIdx + 1, products)
    if (!products.length) break
    all.push(...products)
    await sleep(120)
  }
  return all
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function listSubcategories(rawCategories) {
  const out = []
  for (const ch of rawCategories?.children || []) {
    const c = ch?.category
    const count = Number(ch?.productCount) || 0
    if (c?.id && count > 0) out.push({ id: c.id, name: c.name || c.id, count })
  }
  return out
}

function bucketKey(b) {
  return `${b.categoryId}|${b.searchTerm}`
}

async function backfillMissingImages(context, page, products, items, buildItemFromDiscovered, embedOff, maxEmbed) {
  let photos = 0
  for (const meta of products) {
    const codKey = normCodigo(meta.codigo)
    if (!codKey || !meta.imagemUrl) continue
    const idx = items.findIndex((it) => normCodigo(it.codigo) === codKey)
    const cur = idx >= 0 ? items[idx] : null
    if (!cur) continue
    const hasFile =
      cur.imagem_local && fs.existsSync(cur.imagem_local) && fs.statSync(cur.imagem_local).size > 500
    if (hasFile && (cur.imagem || cur.imagem_url)) continue
    const it = await buildItemFromDiscovered(context, page, meta, idx, embedOff, maxEmbed)
    if (!it.imagem && !it.imagem_url) continue
    items[idx] = {
      ...cur,
      nome: cur.nome || it.nome,
      descricao: cur.descricao || it.descricao,
      imagem: it.imagem || cur.imagem,
      imagem_url: it.imagem_url || cur.imagem_url,
      imagem_local: it.imagem_local || cur.imagem_local,
    }
    photos++
  }
  return photos
}

/**
 * Importação completa via API — buckets por prefixo + subcategorias.
 */
export async function runHomagApiImport(opts) {
  const {
    context,
    page,
    startUrl,
    items,
    codigosVistos,
    stateFile,
    outFile,
    startUrl: url,
    interactive,
    buildItemFromDiscovered,
    saveResumeFn,
    apiState = {},
  } = opts

  let globalSeq = items.length
  const session = await initHomagApiSession(page, startUrl)
  const rootId = session.categoryId

  const first = await auraSearch(context, session, { ...baseInput(session, rootId), page: 0 })
  const subs = listSubcategories(first.rawCategories)
  console.log(`[HOMAG API] Catálogo: ${first.total} itens, ${subs.length} subcategorias`)

  const allBuckets = []
  const rootBuckets = await buildSearchBuckets(context, session, rootId, '')
  allBuckets.push(...rootBuckets)

  for (const sub of subs) {
    console.log(`[HOMAG API] Subcategoria "${sub.name}" (${sub.count} itens)…`)
    const subBuckets = await buildSearchBuckets(context, session, sub.id, '')
    allBuckets.push(...subBuckets)
  }

  const seenBucket = new Set(apiState.doneBuckets || [])
  const uniqueBuckets = []
  for (const b of allBuckets) {
    const k = bucketKey(b)
    if (seenBucket.has(k)) continue
    if (uniqueBuckets.some((x) => bucketKey(x) === k)) continue
    uniqueBuckets.push(b)
  }

  console.log(`[HOMAG API] ${uniqueBuckets.length} buckets a importar (${seenBucket.size} já feitos)`)

  const maxBuckets = Number(process.env.HOMAG_API_MAX_BUCKETS) || 0
  if (maxBuckets > 0 && uniqueBuckets.length > maxBuckets) {
    uniqueBuckets.length = maxBuckets
    console.log(`[HOMAG API] Limite teste: ${maxBuckets} buckets`)
  }

  let totalNew = 0
  let bucketsDone = [...(apiState.doneBuckets || [])]

  for (let bi = 0; bi < uniqueBuckets.length; bi++) {
    const bucket = uniqueBuckets[bi]
    const bk = bucketKey(bucket)
    const label = bucket.searchTerm ? `"${bucket.searchTerm}"` : '(todos)'
    console.log(`\n[HOMAG API] Bucket ${bi + 1}/${uniqueBuckets.length} ${label} — ${bucket.total} itens`)

    let bucketNew = 0
    let bucketPhotos = 0
    await fetchAllBucketProducts(context, session, bucket, async (pg, pgTotal, products) => {
      let added = 0
      let photos = 0
      for (const meta of products) {
        const codKey = normCodigo(meta.codigo)
        if (!codKey) continue

        if (codigosVistos.has(codKey)) {
          const n = await backfillMissingImages(
            context,
            page,
            [meta],
            items,
            buildItemFromDiscovered,
            opts.embedOff,
            opts.maxEmbed
          )
          photos += n
          bucketPhotos += n
          continue
        }

        const it = await buildItemFromDiscovered(context, page, meta, globalSeq, opts.embedOff, opts.maxEmbed)
        codigosVistos.add(codKey)
        items.push(it)
        globalSeq++
        added++
        bucketNew++
        totalNew++
        if (it.imagem || it.imagem_url) {
          photos++
          bucketPhotos++
        }
      }
      if (pg % 10 === 0 || pg === pgTotal) {
        console.log(
          `[HOMAG API]   pág.${pg}/${pgTotal} — +${added} novas, +${photos} fotos (bucket +${bucketNew}/+${bucketPhotos}, total ${items.length})`
        )
      }
    })

    bucketsDone.push(bk)
    try {
      saveResumeFn({
        items,
        startUrl: url,
        pageNum: 0,
        range: `API bucket ${bi + 1}/${uniqueBuckets.length} ${label}`,
        interactive,
        apiMode: true,
        apiDoneBuckets: bucketsDone,
      })
    } catch (e) {
      console.warn(`[HOMAG API] Aviso ao guardar retoma: ${e?.message || e}`)
    }
    console.log(`[HOMAG API] Bucket ${label} concluído (+${bucketNew} novas, +${bucketPhotos} fotos)`)
    await sleep(300)
  }

  if (process.env.HOMAG_API_BACKFILL_IMAGES === '1') {
    const dedup = []
    const seen = new Set()
    for (const b of allBuckets) {
      const k = bucketKey(b)
      if (seen.has(k)) continue
      seen.add(k)
      dedup.push(b)
    }
    console.log(`\n[HOMAG API] Backfill de imagens — ${dedup.length} buckets (peças sem foto)…`)
    let backfillTotal = 0
    for (let bi = 0; bi < dedup.length; bi++) {
      const bucket = dedup[bi]
      const label = bucket.searchTerm ? `"${bucket.searchTerm}"` : '(todos)'
      let bucketPhotos = 0
      await fetchAllBucketProducts(context, session, bucket, async (pg, pgTotal, products) => {
        bucketPhotos += await backfillMissingImages(
          context,
          page,
          products,
          items,
          buildItemFromDiscovered,
          opts.embedOff,
          opts.maxEmbed
        )
        if (pg % 25 === 0 || pg === pgTotal) {
          console.log(`[HOMAG API]   backfill ${label} pág.${pg}/${pgTotal} — +${bucketPhotos} fotos`)
        }
      })
      backfillTotal += bucketPhotos
      if (bucketPhotos > 0) {
        try {
          saveResumeFn({
            items,
            startUrl: url,
            pageNum: 0,
            range: `API backfill imagens ${bi + 1}/${dedup.length} ${label}`,
            interactive,
            apiMode: true,
            apiDoneBuckets: bucketsDone,
          })
        } catch (e) {
          console.warn(`[HOMAG API] Aviso ao guardar backfill: ${e?.message || e}`)
        }
      }
    }
    console.log(`[HOMAG API] Backfill concluído — +${backfillTotal} fotos`)
  }

  return { items, totalNew, bucketsDone, completedFully: true }
}

export async function initHomagApiSession(page, startUrl) {
  console.log('[HOMAG API] A capturar sessão Aura (searchProducts)…')
  const session = await captureAuraSession(page, startUrl)
  console.log(`[HOMAG API] Sessão OK — webstore ${session.webstoreId}, categoria ${session.categoryId}`)
  return session
}

export {
  API_MAX_PAGE_INDEX,
  API_MAX_ITEMS_PER_QUERY,
  API_PAGE_SIZE,
  catalogMaxPage,
  parseCategoryIdFromUrl,
}
